import logging
from typing import Optional, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

_s3_client: Optional[Any] = None


def get_s3_client() -> Optional[Any]:
    """Retrieve or initialize the S3 client for Cloudflare R2."""
    global _s3_client
    if _s3_client is not None:
        return _s3_client

    if not (settings.R2_ACCOUNT_ID and settings.R2_ACCESS_KEY_ID and settings.R2_SECRET_ACCESS_KEY):
        return None

    try:
        import boto3
        from botocore.config import Config

        r2_endpoint = f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
        _s3_client = boto3.client(
            "s3",
            endpoint_url=r2_endpoint,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name="auto",
            config=Config(signature_version="s3v4"),
        )
        return _s3_client
    except Exception as e:
        logger.error(f"Failed to initialize R2 S3 client: {e}")
        return None


from fastapi import HTTPException, status


def upload_file_bytes(bucket: str, key: str, file_bytes: bytes, content_type: str) -> None:
    """Upload raw binary bytes to the specified R2 bucket."""
    s3 = get_s3_client()
    if not s3:
        logger.warning(f"R2 client not configured; skipping upload for key '{key}'")
        return

    try:
        s3.put_object(
            Bucket=bucket,
            Key=key,
            Body=file_bytes,
            ContentType=content_type,
        )
    except Exception as e:
        logger.error(f"Failed to upload to R2 bucket '{bucket}', key '{key}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Storage upload failed for bucket '{bucket}': {str(e)}",
        )


def generate_presigned_download_url(bucket: str, key: str, expires_in: Optional[int] = None) -> str:
    """Generate a time-limited presigned GET URL for a private object.
    
    If the key is already a full URL (e.g. legacy external link or local SVG asset), it is returned directly.
    """
    if not key:
        return ""

    if key.startswith("http://") or key.startswith("https://") or key.startswith("/"):
        return key

    s3 = get_s3_client()
    if not s3:
        # Fallback when R2 is not configured (e.g. offline testing)
        return f"https://r2.mock.local/{bucket}/{key}"

    ttl = expires_in or settings.R2_PRESIGNED_EXPIRATION_SECONDS
    try:
        url = s3.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=ttl,
        )
        return url
    except Exception as e:
        logger.error(f"Failed to generate presigned GET URL for key '{key}': {e}")
        return f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/{bucket}/{key}"


def generate_presigned_upload_url(bucket: str, key: str, content_type: str, expires_in: int = 300) -> str:
    """Generate a presigned PUT URL allowing clients to upload directly to R2."""
    s3 = get_s3_client()
    if not s3:
        return f"https://r2.mock.local/{bucket}/{key}"

    return s3.generate_presigned_url(
        ClientMethod="put_object",
        Params={
            "Bucket": bucket,
            "Key": key,
            "ContentType": content_type,
        },
        ExpiresIn=expires_in,
    )


def delete_file_object(bucket: str, key: str) -> None:
    """Delete an object from the specified R2 bucket."""
    if not key or key.startswith("http://") or key.startswith("https://") or key.startswith("/"):
        return

    s3 = get_s3_client()
    if not s3:
        return

    try:
        s3.delete_object(Bucket=bucket, Key=key)
    except Exception as e:
        logger.error(f"Failed to delete R2 object '{key}' in bucket '{bucket}': {e}")


def get_public_url(bucket: str, key: str) -> str:
    """Construct a permanent public CDN URL for an asset in a public bucket."""
    if not key:
        return ""
    if key.startswith("http://") or key.startswith("https://") or key.startswith("/"):
        return key

    if bucket == settings.R2_BUCKET_AVATARS and settings.R2_AVATARS_PUBLIC_URL:
        return f"{settings.R2_AVATARS_PUBLIC_URL.rstrip('/')}/{key}"

    if settings.R2_ACCOUNT_ID:
        return f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/{bucket}/{key}"

    return f"https://r2.mock.local/{bucket}/{key}"


def get_avatar_public_url(key: str) -> str:
    """Construct the permanent public CDN URL for an avatar asset."""
    return get_public_url(settings.R2_BUCKET_AVATARS, key)

