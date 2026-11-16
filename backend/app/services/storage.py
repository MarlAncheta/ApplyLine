"""Pluggable private object-storage abstraction.

Two providers are provided:
  * LocalStorageBackend  — filesystem storage for local development/tests only.
  * S3StorageBackend     — any S3-compatible private bucket (production).

Swap providers via STORAGE_PROVIDER; application code only depends on the
`StorageBackend` protocol, so no rewrite is required to change vendors.
"""

from __future__ import annotations

import asyncio
import uuid
from pathlib import Path
from typing import Protocol, cast

from app.core.config import settings


class StorageBackend(Protocol):
    async def put(self, key: str, data: bytes, content_type: str) -> None: ...

    async def get(self, key: str) -> bytes: ...

    async def delete(self, key: str) -> None: ...

    async def signed_url(self, key: str, filename: str, expires_in: int) -> str: ...


class LocalStorageBackend:
    """Dev/test filesystem backend. Never use as permanent production storage."""

    def __init__(self, root: str | None = None) -> None:
        self.root = Path(root or settings.storage_local_path).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, key: str) -> Path:
        target = (self.root / key).resolve()
        if not str(target).startswith(str(self.root)):
            raise ValueError("Invalid storage key")
        return target

    async def put(self, key: str, data: bytes, content_type: str) -> None:
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

    async def get(self, key: str) -> bytes:
        return self._path(key).read_bytes()

    async def delete(self, key: str) -> None:
        path = self._path(key)
        if path.exists():
            path.unlink()

    async def signed_url(self, key: str, filename: str, expires_in: int) -> str:
        # Local dev: a direct authenticated streaming endpoint with a token query param.
        from urllib.parse import quote

        return f"/api/documents/{quote(key, safe='/')}/content?token=local&expires={expires_in}"

    def stream_path(self, key: str) -> Path:
        return self._path(key)


class S3StorageBackend:
    """S3-compatible private bucket backend using boto3 (imported lazily)."""

    def __init__(self) -> None:
        import boto3  # noqa: PLC0415

        self.client = boto3.client(
            "s3",
            endpoint_url=settings.storage_endpoint_url or None,
            region_name=settings.storage_region,
            aws_access_key_id=settings.storage_access_key,
            aws_secret_access_key=settings.storage_secret_key,
        )
        self.bucket = settings.storage_bucket

    async def put(self, key: str, data: bytes, content_type: str) -> None:
        await asyncio.to_thread(
            self.client.put_object,
            Bucket=self.bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )

    async def get(self, key: str) -> bytes:
        def _read() -> bytes:
            obj = self.client.get_object(Bucket=self.bucket, Key=key)
            return cast(bytes, obj["Body"].read())

        return await asyncio.to_thread(_read)

    async def delete(self, key: str) -> None:
        await asyncio.to_thread(
            self.client.delete_object, Bucket=self.bucket, Key=key
        )

    async def signed_url(self, key: str, filename: str, expires_in: int) -> str:
        from urllib.parse import quote  # noqa: PLC0415

        def _sign() -> str:
            return cast(
                str,
                self.client.generate_presigned_url(
                    "get_object",
                    Params={
                        "Bucket": self.bucket,
                        "Key": key,
                        "ResponseContentDisposition": f'attachment; filename="{quote(filename)}"',
                    },
                    ExpiresIn=expires_in,
                ),
            )

        return await asyncio.to_thread(_sign)


_backend: StorageBackend | None = None


def get_storage() -> StorageBackend:
    global _backend  # noqa: PLW0603
    if _backend is None:
        if settings.storage_provider == "s3":
            _backend = S3StorageBackend()
        else:
            _backend = LocalStorageBackend()
    return _backend


def set_storage(backend: StorageBackend) -> None:
    """Override storage backend (used in tests)."""
    global _backend  # noqa: PLW0603
    _backend = backend


def build_storage_key(user_id: str, filename: str) -> str:
    safe = Path(filename).name.replace(" ", "_")
    return f"users/{user_id}/{uuid.uuid4().hex}/{safe}"


ALLOWED_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".txt", ".rtf", ".odt",
    ".png", ".jpg", ".jpeg", ".webp",
}
ALLOWED_MIME_PREFIXES = (
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.oasis.opendocument.text",
    "text/plain",
    "text/rtf",
    "image/png",
    "image/jpeg",
    "image/webp",
)


def validate_upload(filename: str, content_type: str, size: int) -> None:
    from pathlib import Path

    from app.core.errors import ValidationError

    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(f"Unsupported file extension: {ext or '(none)'}")
    if content_type not in ALLOWED_MIME_PREFIXES:
        raise ValidationError(f"Unsupported file type: {content_type}")
    if size <= 0:
        raise ValidationError("File is empty.")
    if size > settings.max_upload_bytes:
        raise ValidationError(f"File exceeds the {settings.document_max_size_mb} MB limit.")
