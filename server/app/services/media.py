import mimetypes
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from app.models.media import Media, MediaFavorite
from app.models.hangout import Hangout
from app.models.profile import Profile
from app.core.config import settings
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError
from app.core.storage import (
    upload_file_bytes,
    generate_presigned_download_url,
    generate_presigned_upload_url,
    delete_file_object,
)
from app.schemas.media import DirectUploadItemRequest, DirectMediaConfirmItem
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


def _media_to_dict(
    media: Media,
    is_favorited: bool = False,
    uploader_profile: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    prof_dict = uploader_profile
    if not prof_dict and media.uploader:
        prof_dict = {
            "id": str(media.uploader.id),
            "username": media.uploader.username,
            "email": media.uploader.email,
            "avatar_url": media.uploader.avatar_url,
            "created_at": media.uploader.created_at.isoformat(),
            "updated_at": media.uploader.updated_at.isoformat(),
        }
    return {
        "id": str(media.id),
        "hangout_id": str(media.hangout_id),
        "uploaded_by": str(media.uploaded_by),
        "url": media.url,
        "thumbnail_url": media.thumbnail_url,
        "caption": media.caption,
        "media_type": media.media_type,
        "favorites_count": media.favorites_count,
        "file_size_bytes": media.file_size_bytes,
        "is_shared": media.is_shared,
        "is_cover": media.is_cover,
        "created_at": media.created_at.isoformat(),
        "is_favorited": is_favorited,
        "uploader": prof_dict,
    }


def upload_media(
    db: Session,
    hangout_id: str,
    user_id: str,
    file: UploadFile,
    caption: Optional[str] = None,
    is_shared: bool = True,
) -> Dict[str, Any]:
    """Upload photo or video media file to private storage and record database entry."""
    from app.services.hangouts import resolve_hangout_id
    canonical_id = resolve_hangout_id(db, hangout_id)
    h_uuid = uuid.UUID(canonical_id)
    u_uuid = uuid.UUID(str(user_id))

    hangout = db.get(Hangout, h_uuid)
    if not hangout:
        raise NotFoundError("Hangout not found.")

    content_type = file.content_type or ""
    if content_type not in ALLOWED_MIME_TYPES:
        raise BadRequestError(
            f"Unsupported file type '{content_type}'. Allowed types are photos ({', '.join(ALLOWED_IMAGE_MIME_TYPES)}) and videos ({', '.join(ALLOWED_VIDEO_MIME_TYPES)})."
        )

    media_type = "video" if content_type in ALLOWED_VIDEO_MIME_TYPES else "photo"
    file_bytes = file.file.read()
    file_size = len(file_bytes)
    check_storage_quota(db, user_id, file_size)

    object_key = _upload_media_to_r2(canonical_id, file_bytes, file.filename or "media", content_type)

    media = Media(
        hangout_id=h_uuid,
        uploaded_by=u_uuid,
        url=object_key,
        thumbnail_url=object_key,
        caption=caption,
        media_type=media_type,
        favorites_count=0,
        file_size_bytes=file_size,
        is_shared=is_shared,
        is_cover=False,
    )
    db.add(media)
    db.flush()
    db.refresh(media, attribute_names=["uploader"])

    media_dict = _media_to_dict(media, is_favorited=False)
    return _sign_media_item(media_dict)


def upload_bulk_media(
    db: Session,
    hangout_id: str,
    user_id: str,
    files: List[UploadFile],
    captions: Optional[List[str]] = None,
    caption: Optional[str] = None,
    is_shared: bool = True,
    cover_index: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """Upload multiple photos or videos to private storage and record database entries in batch with captions."""
    if not files:
        raise BadRequestError("No files provided for upload.")

    from app.services.hangouts import resolve_hangout_id
    canonical_id = resolve_hangout_id(db, hangout_id)
    h_uuid = uuid.UUID(canonical_id)
    u_uuid = uuid.UUID(str(user_id))

    hangout = db.get(Hangout, h_uuid)
    if not hangout:
        raise NotFoundError("Hangout not found.")

    total_bytes = 0
    prepared_files = []
    for idx, file in enumerate(files):
        content_type = file.content_type or ""
        if not content_type or content_type == "application/octet-stream":
            guessed, _ = mimetypes.guess_type(file.filename or "")
            if guessed:
                content_type = guessed

        if content_type not in ALLOWED_MIME_TYPES:
            raise BadRequestError(
                f"Unsupported file type '{content_type}' for file '{file.filename}'. Allowed types are photos ({', '.join(ALLOWED_IMAGE_MIME_TYPES)}) and videos ({', '.join(ALLOWED_VIDEO_MIME_TYPES)})."
            )

        media_type = "video" if content_type in ALLOWED_VIDEO_MIME_TYPES else "photo"
        file_bytes = file.file.read()
        file_size = len(file_bytes)
        total_bytes += file_size

        file_caption = None
        if captions and idx < len(captions) and captions[idx]:
            file_caption = captions[idx]
        elif caption:
            file_caption = caption

        is_item_cover = cover_index is not None and idx == cover_index

        prepared_files.append({
            "idx": idx,
            "filename": file.filename or "media",
            "content_type": content_type,
            "media_type": media_type,
            "file_bytes": file_bytes,
            "file_size": file_size,
            "caption": file_caption,
            "is_cover": is_item_cover,
        })

    check_storage_quota(db, user_id, total_bytes)

    uploader = db.get(Profile, u_uuid)
    uploader_profile = {
        "id": str(uploader.id),
        "username": uploader.username,
        "email": uploader.email,
        "avatar_url": uploader.avatar_url,
        "created_at": uploader.created_at.isoformat(),
        "updated_at": uploader.updated_at.isoformat(),
    } if uploader else None

    inserted_media_objects = []
    cover_object_key = None

    for item in prepared_files:
        object_key = _upload_media_to_r2(
            canonical_id,
            item["file_bytes"],
            item["filename"],
            item["content_type"],
        )
        if item["is_cover"]:
            cover_object_key = object_key

        m = Media(
            hangout_id=h_uuid,
            uploaded_by=u_uuid,
            url=object_key,
            thumbnail_url=object_key,
            caption=item["caption"],
            media_type=item["media_type"],
            favorites_count=0,
            file_size_bytes=item["file_size"],
            is_shared=is_shared,
            is_cover=item["is_cover"],
        )
        db.add(m)
        inserted_media_objects.append(m)

    if cover_object_key:
        hangout.cover_photo_url = cover_object_key

    db.flush()

    results = []
    for m in inserted_media_objects:
        d = _media_to_dict(m, is_favorited=False, uploader_profile=uploader_profile)
        results.append(_sign_media_item(d))

    return results


def get_hangout_media(
    db: Session,
    hangout_id: str,
    user_id: str,
    media_type_filter: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Retrieve gallery media for a hangout, enforcing privacy rules and signing URLs."""
    from app.services.hangouts import resolve_hangout_id
    canonical_id = resolve_hangout_id(db, hangout_id)
    h_uuid = uuid.UUID(canonical_id)
    u_uuid = uuid.UUID(str(user_id)) if user_id else None

    hangout = db.get(Hangout, h_uuid)
    if not hangout:
        raise NotFoundError("Hangout not found.")

    query = (
        select(Media)
        .options(joinedload(Media.uploader))
        .where(Media.hangout_id == h_uuid)
    )
    if media_type_filter:
        query = query.where(Media.media_type == media_type_filter)
    query = query.order_by(Media.created_at.desc())

    media_items = db.scalars(query).all()

    visible_items = [
        m for m in media_items
        if m.is_shared or (u_uuid and m.uploaded_by == u_uuid)
    ]

    favorited_ids = set()
    if visible_items and u_uuid:
        m_ids = [m.id for m in visible_items]
        fav_rows = db.scalars(
            select(MediaFavorite.media_id).where(
                MediaFavorite.media_id.in_(m_ids),
                MediaFavorite.user_id == u_uuid,
            )
        ).all()
        favorited_ids = set(fav_rows)

    result = []
    for m in visible_items:
        d = _media_to_dict(m, is_favorited=(m.id in favorited_ids))
        result.append(_sign_media_item(d))

    return result


def favorite_media(db: Session, media_id: str, user_id: str) -> Dict[str, Any]:
    """Toggle or set favorite for a media item."""
    try:
        m_uuid = uuid.UUID(str(media_id))
        u_uuid = uuid.UUID(str(user_id))
    except (ValueError, AttributeError):
        raise NotFoundError("Media item not found.")

    media = db.scalar(
        select(Media).options(joinedload(Media.uploader)).where(Media.id == m_uuid)
    )
    if not media:
        raise NotFoundError("Media item not found.")

    existing_fav = db.scalar(
        select(MediaFavorite).where(
            MediaFavorite.media_id == m_uuid,
            MediaFavorite.user_id == u_uuid,
        )
    )
    if not existing_fav:
        fav = MediaFavorite(media_id=m_uuid, user_id=u_uuid)
        db.add(fav)
        media.favorites_count += 1
        db.flush()

    d = _media_to_dict(media, is_favorited=True)
    return _sign_media_item(d)


def unfavorite_media(db: Session, media_id: str, user_id: str) -> Dict[str, Any]:
    """Remove favorite from a media item."""
    try:
        m_uuid = uuid.UUID(str(media_id))
        u_uuid = uuid.UUID(str(user_id))
    except (ValueError, AttributeError):
        raise NotFoundError("Media item not found.")

    media = db.scalar(
        select(Media).options(joinedload(Media.uploader)).where(Media.id == m_uuid)
    )
    if not media:
        raise NotFoundError("Media item not found.")

    existing_fav = db.scalar(
        select(MediaFavorite).where(
            MediaFavorite.media_id == m_uuid,
            MediaFavorite.user_id == u_uuid,
        )
    )
    if existing_fav:
        db.delete(existing_fav)
        media.favorites_count = max(0, media.favorites_count - 1)
        db.flush()

    d = _media_to_dict(media, is_favorited=False)
    return _sign_media_item(d)


def delete_media(db: Session, media_id: str, user_id: str) -> None:
    """Delete a media item from R2 storage and database (only allowed by original uploader)."""
    try:
        m_uuid = uuid.UUID(str(media_id))
        u_uuid = uuid.UUID(str(user_id))
    except (ValueError, AttributeError):
        raise NotFoundError("Media item not found.")

    media = db.get(Media, m_uuid)
    if not media:
        raise NotFoundError("Media item not found.")

    if media.uploaded_by != u_uuid:
        raise ForbiddenError("Only the original uploader can delete this media item.")

    delete_file_object(bucket=settings.R2_BUCKET_MEDIA, key=media.url)
    db.delete(media)
    db.flush()


def prepare_direct_media_uploads(
    db: Session,
    hangout_id: str,
    user_id: str,
    files: List[DirectUploadItemRequest],
) -> Dict[str, Any]:
    """Generate presigned PUT upload URLs for client-side direct upload to R2."""
    if not files:
        raise BadRequestError("No files provided for upload.")

    from app.services.hangouts import resolve_hangout_id
    canonical_id = resolve_hangout_id(db, hangout_id)

    total_bytes = 0
    resolved_files = []
    for f in files:
        content_type = f.content_type
        if not content_type or content_type == "application/octet-stream":
            guessed, _ = mimetypes.guess_type(f.filename)
            if guessed:
                content_type = guessed

        if content_type not in ALLOWED_MIME_TYPES:
            raise BadRequestError(
                f"Unsupported file type '{content_type}' for '{f.filename}'. Allowed types are photos ({', '.join(ALLOWED_IMAGE_MIME_TYPES)}) and videos ({', '.join(ALLOWED_VIDEO_MIME_TYPES)})."
            )

        total_bytes += f.file_size_bytes
        resolved_files.append((f, content_type))

    check_storage_quota(db, user_id, total_bytes)

    items = []
    for f, content_type in resolved_files:
        safe_filename = f.filename.replace(" ", "_") if f.filename else "file"
        media_uuid = str(uuid.uuid4())
        object_key = f"{settings.ENVIRONMENT}/hng_{canonical_id}/med_{media_uuid}_{safe_filename}"
        upload_url = generate_presigned_upload_url(
            bucket=settings.R2_BUCKET_MEDIA,
            key=object_key,
            content_type=content_type,
            expires_in=600,
        )
        items.append({
            "upload_url": upload_url,
            "object_key": object_key,
            "filename": f.filename,
            "content_type": content_type,
            "file_size_bytes": f.file_size_bytes,
        })

    return {"items": items}


def confirm_direct_media_uploads(
    db: Session,
    hangout_id: str,
    user_id: str,
    items: List[DirectMediaConfirmItem],
) -> List[Dict[str, Any]]:
    """Confirm client-side uploaded files and insert media records into DB."""
    if not items:
        raise BadRequestError("No items provided for confirmation.")

    from app.services.hangouts import resolve_hangout_id
    canonical_id = resolve_hangout_id(db, hangout_id)
    h_uuid = uuid.UUID(canonical_id)
    u_uuid = uuid.UUID(str(user_id))

    expected_prefix = f"{settings.ENVIRONMENT}/hng_{canonical_id}/"
    for item in items:
        if not item.object_key.startswith(expected_prefix):
            raise ForbiddenError(f"Invalid object key '{item.object_key}'.")

    uploader = db.get(Profile, u_uuid)
    uploader_profile = {
        "id": str(uploader.id),
        "username": uploader.username,
        "email": uploader.email,
        "avatar_url": uploader.avatar_url,
        "created_at": uploader.created_at.isoformat(),
        "updated_at": uploader.updated_at.isoformat(),
    } if uploader else None

    inserted_objects = []
    cover_item = next((item for item in items if item.is_cover), None)

    for item in items:
        content_type = item.content_type
        if not content_type or content_type == "application/octet-stream":
            guessed, _ = mimetypes.guess_type(item.object_key)
            if guessed:
                content_type = guessed

        media_type = "video" if content_type in ALLOWED_VIDEO_MIME_TYPES else "photo"
        m = Media(
            hangout_id=h_uuid,
            uploaded_by=u_uuid,
            url=item.object_key,
            thumbnail_url=item.object_key,
            caption=item.caption,
            media_type=media_type,
            favorites_count=0,
            file_size_bytes=item.file_size_bytes,
            is_shared=item.is_shared,
            is_cover=item.is_cover,
        )
        db.add(m)
        inserted_objects.append(m)

    if cover_item:
        hangout = db.get(Hangout, h_uuid)
        if hangout:
            hangout.cover_photo_url = cover_item.object_key

    db.flush()

    results = []
    for m in inserted_objects:
        d = _media_to_dict(m, is_favorited=False, uploader_profile=uploader_profile)
        results.append(_sign_media_item(d))

    return results
