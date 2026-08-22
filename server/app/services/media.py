import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import UploadFile
from supabase import Client
from app.core.config import settings
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError
from app.services.storage import check_storage_quota

ALLOWED_IMAGE_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
}

ALLOWED_VIDEO_MIME_TYPES = {
    "video/mp4",
    "video/quicktime",
    "video/webm",
    "video/x-matroska",
    "video/avi",
}

ALLOWED_MIME_TYPES = ALLOWED_IMAGE_MIME_TYPES | ALLOWED_VIDEO_MIME_TYPES


def _upload_to_storage(db: Client, file_bytes: bytes, filename: str, content_type: str) -> str:
    """Helper to upload file bytes to Cloudflare R2 or Supabase Storage as configured."""
    object_id = str(uuid.uuid4())
    safe_filename = filename.replace(" ", "_") if filename else "file"
    object_key = f"media/{object_id}_{safe_filename}"

    # 1. Cloudflare R2 Upload
    if settings.R2_ACCOUNT_ID and settings.R2_ACCESS_KEY_ID and settings.R2_SECRET_ACCESS_KEY:
        try:
            import boto3
            r2_endpoint = f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
            s3 = boto3.client(
                "s3",
                endpoint_url=r2_endpoint,
                aws_access_key_id=settings.R2_ACCESS_KEY_ID,
                aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                region_name="auto",
            )
            s3.put_object(
                Bucket=settings.R2_BUCKET_NAME,
                Key=object_key,
                Body=file_bytes,
                ContentType=content_type,
            )
            if settings.R2_PUBLIC_URL:
                return f"{settings.R2_PUBLIC_URL.rstrip('/')}/{object_key}"
            return f"{r2_endpoint}/{settings.R2_BUCKET_NAME}/{object_key}"
        except Exception:
            pass

    # 2. Supabase Storage / Native Storage Upload
    try:
        db.storage.from_(settings.STORAGE_BUCKET).upload(object_key, file_bytes, {"content-type": content_type})
    except Exception:
        pass

    return f"{settings.SUPABASE_URL}/storage/v1/object/public/{settings.STORAGE_BUCKET}/{object_key}"


def upload_media(
    db: Client,
    hangout_id: str,
    user_id: str,
    file: UploadFile,
    caption: Optional[str] = None,
    is_shared: bool = True,
) -> Dict[str, Any]:
    """Upload photo or video media file to storage and record database entry."""
    # 1. Check hangout existence
    hangout_res = db.table("hangouts").select("id").eq("id", hangout_id).execute()
    if not hangout_res.data:
        raise NotFoundError("Hangout not found.")

    # 2. Validate MIME type
    content_type = file.content_type or ""
    if content_type not in ALLOWED_MIME_TYPES:
        raise BadRequestError(
            f"Unsupported file type '{content_type}'. Allowed types are photos ({', '.join(ALLOWED_IMAGE_MIME_TYPES)}) and videos ({', '.join(ALLOWED_VIDEO_MIME_TYPES)})."
        )

    # 3. Determine media_type ('photo' or 'video')
    media_type = "video" if content_type in ALLOWED_VIDEO_MIME_TYPES else "photo"

    # 4. Upload file object to storage
    file_bytes = file.file.read()
    file_size = len(file_bytes)
    check_storage_quota(db, user_id, file_size)

    url = _upload_to_storage(db, file_bytes, file.filename or "media", content_type)
    thumbnail_url = url  # Can be expanded for video/image thumbnail rendering

    now = datetime.now(timezone.utc).isoformat()
    media_data = {
        "hangout_id": hangout_id,
        "uploaded_by": user_id,
        "url": url,
        "thumbnail_url": thumbnail_url,
        "caption": caption,
        "media_type": media_type,
        "favorites_count": 0,
        "file_size_bytes": file_size,
        "is_shared": is_shared,
        "created_at": now,
    }

    insert_res = db.table("media").insert(media_data).execute()
    if not insert_res.data:
        raise Exception("Failed to save media record.")

    media_record = insert_res.data[0]

    # Attach uploader profile
    profile_res = db.table("profiles").select("*").eq("id", user_id).execute()
    if profile_res.data:
        media_record["uploader"] = profile_res.data[0]

    return media_record


def upload_bulk_media(
    db: Client,
    hangout_id: str,
    user_id: str,
    files: List[UploadFile],
    captions: Optional[List[str]] = None,
    caption: Optional[str] = None,
    is_shared: bool = True,
) -> List[Dict[str, Any]]:
    """Upload multiple photos or videos to storage and record database entries in batch with individual or global captions."""
    if not files:
        raise BadRequestError("No files provided for upload.")

    # 1. Check hangout existence
    hangout_res = db.table("hangouts").select("id").eq("id", hangout_id).execute()
    if not hangout_res.data:
        raise NotFoundError("Hangout not found.")

    # 2. Get uploader profile
    profile_res = db.table("profiles").select("*").eq("id", user_id).execute()
    uploader_profile = profile_res.data[0] if profile_res.data else None

    now = datetime.now(timezone.utc).isoformat()
    media_records_to_insert = []

    for idx, file in enumerate(files):
        content_type = file.content_type or ""
        if content_type not in ALLOWED_MIME_TYPES:
            raise BadRequestError(
                f"Unsupported file type '{content_type}' for file '{file.filename}'. Allowed types are photos ({', '.join(ALLOWED_IMAGE_MIME_TYPES)}) and videos ({', '.join(ALLOWED_VIDEO_MIME_TYPES)})."
            )

        media_type = "video" if content_type in ALLOWED_VIDEO_MIME_TYPES else "photo"
        file_bytes = file.file.read()
        file_size = len(file_bytes)
        check_storage_quota(db, user_id, file_size)

        url = _upload_to_storage(db, file_bytes, file.filename or "media", content_type)

        # Resolve individual caption for this file index if provided
        file_caption = None
        if captions and idx < len(captions) and captions[idx]:
            file_caption = captions[idx]
        elif caption:
            file_caption = caption

        media_records_to_insert.append({
            "hangout_id": hangout_id,
            "uploaded_by": user_id,
            "url": url,
            "thumbnail_url": url,
            "caption": file_caption,
            "media_type": media_type,
            "favorites_count": 0,
            "file_size_bytes": file_size,
            "is_shared": is_shared,
            "created_at": now,
        })

    insert_res = db.table("media").insert(media_records_to_insert).execute()
    if not insert_res.data:
        raise Exception("Failed to save bulk media records.")

    inserted_items = insert_res.data
    for item in inserted_items:
        item["uploader"] = uploader_profile

    return inserted_items


def get_hangout_media(
    db: Client,
    hangout_id: str,
    user_id: str,
    media_type_filter: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Retrieve gallery media for a hangout, enforcing privacy rules (is_shared = false visible only to uploader)."""
    # 1. Check hangout existence
    hangout_res = db.table("hangouts").select("id").eq("id", hangout_id).execute()
    if not hangout_res.data:
        raise NotFoundError("Hangout not found.")

    query = db.table("media").select("*").eq("hangout_id", hangout_id)
    if media_type_filter:
        query = query.eq("media_type", media_type_filter)

    res = query.order("created_at", desc=True).execute()
    items = res.data or []

    # 2. Filter private items not owned by current user
    visible_items = []
    for item in items:
        if not item.get("is_shared", True) and str(item.get("uploaded_by")) != str(user_id):
            continue
        visible_items.append(item)

    # 3. Attach uploader profiles
    uploader_ids = list({item["uploaded_by"] for item in visible_items if "uploaded_by" in item})
    profiles_map = {}
    if uploader_ids:
        profiles_res = db.table("profiles").select("*").in_("id", uploader_ids).execute()
        if profiles_res.data:
            profiles_map = {p["id"]: p for p in profiles_res.data}

    for item in visible_items:
        item["uploader"] = profiles_map.get(item.get("uploaded_by"))

    return visible_items


def favorite_media(db: Client, media_id: str, user_id: str) -> Dict[str, Any]:
    """Toggle or set favorite for a media item."""
    media_res = db.table("media").select("*").eq("id", media_id).execute()
    if not media_res.data:
        raise NotFoundError("Media item not found.")

    media_item = media_res.data[0]
    
    # Check if already favorited
    fav_res = db.table("media_favorites").select("id").eq("media_id", media_id).eq("user_id", user_id).execute()
    if not fav_res.data:
        # Add favorite
        db.table("media_favorites").insert({"media_id": media_id, "user_id": user_id}).execute()
        new_count = media_item.get("favorites_count", 0) + 1
        db.table("media").update({"favorites_count": new_count}).eq("id", media_id).execute()
        media_item["favorites_count"] = new_count

    return media_item


def unfavorite_media(db: Client, media_id: str, user_id: str) -> Dict[str, Any]:
    """Remove favorite from a media item."""
    media_res = db.table("media").select("*").eq("id", media_id).execute()
    if not media_res.data:
        raise NotFoundError("Media item not found.")

    media_item = media_res.data[0]
    
    fav_res = db.table("media_favorites").select("id").eq("media_id", media_id).eq("user_id", user_id).execute()
    if fav_res.data:
        db.table("media_favorites").delete().eq("media_id", media_id).eq("user_id", user_id).execute()
        new_count = max(0, media_item.get("favorites_count", 1) - 1)
        db.table("media").update({"favorites_count": new_count}).eq("id", media_id).execute()
        media_item["favorites_count"] = new_count

    return media_item


def delete_media(db: Client, media_id: str, user_id: str) -> None:
    """Delete a media item (only allowed by original uploader)."""
    media_res = db.table("media").select("*").eq("id", media_id).execute()
    if not media_res.data:
        raise NotFoundError("Media item not found.")

    media_item = media_res.data[0]
    if str(media_item.get("uploaded_by")) != str(user_id):
        raise ForbiddenError("Only the original uploader can delete this media item.")

    db.table("media").delete().eq("id", media_id).execute()
