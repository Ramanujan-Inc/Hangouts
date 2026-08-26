import pytest
from unittest.mock import MagicMock, patch
from app.core.config import settings
from app.core.storage import (
    get_public_url,
    get_avatar_public_url,
    generate_presigned_download_url,
    generate_presigned_upload_url,
    upload_file_bytes,
    delete_file_object,
)


def test_get_public_url_with_existing_urls():
    """Existing full URLs and root-relative paths should not be modified."""
    assert get_public_url("avatars", "https://cdn.example.com/pic.jpg") == "https://cdn.example.com/pic.jpg"
    assert get_public_url("avatars", "http://example.com/pic.jpg") == "http://example.com/pic.jpg"
    assert get_public_url("avatars", "/avatars/mika.svg") == "/avatars/mika.svg"
    assert get_public_url("avatars", "") == ""


def test_get_avatar_public_url_with_custom_cdn(monkeypatch: pytest.MonkeyPatch):
    """When R2_AVATARS_PUBLIC_URL is configured, keys use the public CDN domain."""
    monkeypatch.setattr(settings, "R2_AVATARS_PUBLIC_URL", "https://avatars.hangouts.dev")
    url = get_avatar_public_url("development/usr_123_456.jpg")
    assert url == "https://avatars.hangouts.dev/development/usr_123_456.jpg"


def test_get_public_url_fallback_with_account_id(monkeypatch: pytest.MonkeyPatch):
    """When no custom public URL is set, falls back to R2 cloudflarestorage endpoint."""
    monkeypatch.setattr(settings, "R2_AVATARS_PUBLIC_URL", None)
    monkeypatch.setattr(settings, "R2_ACCOUNT_ID", "acc_xyz")
    monkeypatch.setattr(settings, "R2_BUCKET_AVATARS", "avatars")
    url = get_public_url("avatars", "development/covers/grp_1.jpg")
    assert url == "https://acc_xyz.r2.cloudflarestorage.com/avatars/development/covers/grp_1.jpg"


def test_generate_presigned_download_url_existing_urls():
    """Presigned download URL generator returns full URLs as-is."""
    assert generate_presigned_download_url("hangout-media", "/avatars/dave.svg") == "/avatars/dave.svg"
    assert generate_presigned_download_url("hangout-media", "https://example.com/img.jpg") == "https://example.com/img.jpg"
    assert generate_presigned_download_url("hangout-media", "") == ""


def test_generate_presigned_download_url_with_s3_mock():
    """S3 presigned URL generator correctly calls boto3 generate_presigned_url."""
    mock_s3 = MagicMock()
    mock_s3.generate_presigned_url.return_value = "https://r2.endpoint.com/signed?X-Amz=123"

    with patch("app.core.storage.get_s3_client", return_value=mock_s3):
        url = generate_presigned_download_url("hangout-media", "development/hng_1/med_1.jpg", expires_in=1800)
        assert url == "https://r2.endpoint.com/signed?X-Amz=123"
        mock_s3.generate_presigned_url.assert_called_once_with(
            ClientMethod="get_object",
            Params={"Bucket": "hangout-media", "Key": "development/hng_1/med_1.jpg"},
            ExpiresIn=1800,
        )


def test_generate_presigned_upload_url_with_s3_mock():
    """Presigned upload URL generator correctly calls put_object with content type."""
    mock_s3 = MagicMock()
    mock_s3.generate_presigned_url.return_value = "https://r2.endpoint.com/upload-signed"

    with patch("app.core.storage.get_s3_client", return_value=mock_s3):
        url = generate_presigned_upload_url("hangout-media", "development/hng_1/med_1.jpg", "image/jpeg", expires_in=600)
        assert url == "https://r2.endpoint.com/upload-signed"
        mock_s3.generate_presigned_url.assert_called_once_with(
            ClientMethod="put_object",
            Params={"Bucket": "hangout-media", "Key": "development/hng_1/med_1.jpg", "ContentType": "image/jpeg"},
            ExpiresIn=600,
        )


def test_upload_and_delete_file_object():
    """Upload and delete helper methods pass correct Bucket and Key to S3."""
    mock_s3 = MagicMock()

    with patch("app.core.storage.get_s3_client", return_value=mock_s3):
        # Upload
        upload_file_bytes("hangout-media", "dev/test.jpg", b"fake_bytes", "image/jpeg")
        mock_s3.put_object.assert_called_once_with(
            Bucket="hangout-media",
            Key="dev/test.jpg",
            Body=b"fake_bytes",
            ContentType="image/jpeg",
        )

        # Delete relative key
        delete_file_object("hangout-media", "dev/test.jpg")
        mock_s3.delete_object.assert_called_once_with(
            Bucket="hangout-media",
            Key="dev/test.jpg",
        )

        # Delete full URL is ignored
        mock_s3.reset_mock()
        delete_file_object("hangout-media", "https://cdn.example.com/asset.jpg")
        mock_s3.delete_object.assert_not_called()
