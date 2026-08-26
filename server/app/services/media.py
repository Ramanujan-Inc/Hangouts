import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import UploadFile
from supabase import Client
from app.core.config import settings
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError
from app.core.storage import (
    upload_file_bytes,
    generate_presigned_download_url,
    delete_file_object,
)
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


def _upload_media_to_r2(hangout_id: str, file_bytes: bytes, filename: str, content_type: str) -> str:
    """Upload media file bytes to the private Cloudflare R2 hangout-media bucket and return its relative object key."""
    safe_filename = filename.replace(" ", "_") if filename else "file"
    media_uuid = str(uuid.uuid4())
    object_key = f"{settings.ENVIRONMENT}/hng_{hangout_id}/med_{media_uuid}_{safe_filename}"

    upload_file_bytes(
        bucket=settings.R2_BUCKET_MEDIA,
        key=object_key,
        file_bytes=file_bytes,
        content_type=content_type,
    )
    return object_key


def _sign_media_item(item: Dict[str, Any]) -> Dict[str, Any]:
    """Attach temporary signed download URLs for private media items."""
    signed = dict(item)
    if "url" in signed and signed["url"]:
        signed["url"] = generate_presigned_download_url(
            bucket=settings.R2_BUCKET_MEDIA,
            key=signed["url"],
        )
    if "thumbnail_url" in signed and signed["thumbnail_url"]:
        signed["thumbnail_url"] = generate_presigned_download_url(
            bucket=settings.R2_BUCKET_MEDIA,
            key=signed["thumbnail_url"],
        )
    return signed


def upload_media(
    db: Client,
    hangout_id: str,
    user_id: str,
    file: UploadFile,
    caption: Optional[str] = None,
    is_shared: bool = True,
) -> Dict[str, Any]:
    """Upload photo or video media file to private storage and record database entry."""
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

    # 4. Upload file object to private R2 storage
    file_bytes = file.file.read()
    file_size = len(file_bytes)
    check_storage_quota(db, user_id, file_size)

    object_key = _upload_media_to_r2(hangout_id, file_bytes, file.filename or "media", content_type)

    now = datetime.now(timezone.utc).isoformat()
    media_data = {
        "hangout_id": hangout_id,
        "uploaded_by": user_id,
        "url": object_key,
        "thumbnail_url": object_key,
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
    media_record["is_favorited"] = False

    # Attach uploader profile
    profile_res = db.table("profiles").select("*").eq("id", user_id).execute()
    if profile_res.data:
        media_record["uploader"] = profile_res.data[0]

    return _sign_media_item(media_record)


def upload_bulk_media(
    db: Client,
    hangout_id: str,
    user_id: str,
    files: List[UploadFile],
    captions: Optional[List[str]] = None,
    caption: Optional[str] = None,
    is_shared: bool = True,
) -> List[Dict[str, Any]]:
    """Upload multiple photos or videos to private storage and record database entries in batch with captions."""
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

        object_key = _upload_media_to_r2(hangout_id, file_bytes, file.filename or "media", content_type)

        # Resolve individual caption for this file index if provided
        file_caption = None
        if captions and idx < len(captions) and captions[idx]:
            file_caption = captions[idx]
        elif caption:
            file_caption = caption

        media_records_to_insert.append({
            "hangout_id": hangout_id,
            "uploaded_by": user_id,
            "url": object_key,
            "thumbnail_url": object_key,
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
        item["is_favorited"] = False

    return [_sign_media_item(item) for item in inserted_items]


def get_hangout_media(
    db: Client,
    hangout_id: str,
    user_id: str,
    media_type_filter: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Retrieve gallery media for a hangout, enforcing privacy rules and signing URLs."""
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

    # 4. Attach is_favorited for user_id
    media_ids = [item["id"] for item in visible_items if "id" in item]
    favorited_ids = set()
    if media_ids and user_id:
        fav_res = db.table("media_favorites").select("media_id").in_("media_id", media_ids).eq("user_id", str(user_id)).execute()
        if fav_res.data:
            favorited_ids = {str(f["media_id"]) for f in fav_res.data}

    for item in visible_items:
        item["uploader"] = profiles_map.get(item.get("uploaded_by"))
        item["is_favorited"] = str(item.get("id")) in favorited_ids

    return [_sign_media_item(item) for item in visible_items]


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

    media_item["is_favorited"] = True
    profile_res = db.table("profiles").select("*").eq("id", media_item["uploaded_by"]).execute()
    if profile_res.data:
        media_item["uploader"] = profile_res.data[0]

    return _sign_media_item(media_item)


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

    media_item["is_favorited"] = False
    profile_res = db.table("profiles").select("*").eq("id", media_item["uploaded_by"]).execute()
    if profile_res.data:
        media_item["uploader"] = profile_res.data[0]

    return _sign_media_item(media_item)


def delete_media(db: Client, media_id: str, user_id: str) -> None:
    """Delete a media item from R2 storage and database (only allowed by original uploader)."""
    media_res = db.table("media").select("*").eq("id", media_id).execute()
    if not media_res.data:
        raise NotFoundError("Media item not found.")

    media_item = media_res.data[0]
    if str(media_item.get("uploaded_by")) != str(user_id):
        raise ForbiddenError("Only the original uploader can delete this media item.")

    # Delete object from private R2 bucket
    delete_file_object(bucket=settings.R2_BUCKET_MEDIA, key=media_item.get("url", ""))

    db.table("media").delete().eq("id", media_id).execute()

