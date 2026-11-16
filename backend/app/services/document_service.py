"""Document metadata + storage orchestration with strict ownership checks."""

from __future__ import annotations

import hashlib

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.errors import NotFoundError, ValidationError
from app.models.application import Application
from app.models.document import Document
from app.models.enums import ActivityType
from app.schemas.document import DocumentUpdate
from app.services import activity_service, storage
from app.services.storage import build_storage_key, validate_upload


def _to_dict(doc: Document) -> dict:
    return {
        "id": doc.id,
        "owner_id": doc.owner_id,
        "original_filename": doc.original_filename,
        "content_type": doc.content_type,
        "size_bytes": doc.size_bytes,
        "category": doc.category,
        "description": doc.description,
        "created_at": doc.created_at,
        "updated_at": doc.updated_at,
        "application_ids": [a.id for a in doc.applications],
    }


async def list_documents(
    db: AsyncSession, owner_id: str, *, page: int = 1, page_size: int = 20
) -> tuple[list[dict], int]:
    total = (
        await db.execute(
            select(func.count()).select_from(Document).where(Document.owner_id == owner_id)
        )
    ).scalar_one()
    rows = await db.execute(
        select(Document)
        .options(selectinload(Document.applications))
        .where(Document.owner_id == owner_id)
        .order_by(Document.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return [_to_dict(d) for d in rows.scalars().unique().all()], total


async def get_document(db: AsyncSession, owner_id: str, doc_id: str) -> Document:
    result = await db.execute(
        select(Document)
        .options(selectinload(Document.applications))
        .where(Document.id == doc_id, Document.owner_id == owner_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise NotFoundError("Document not found.")
    return doc


async def upload_document(
    db: AsyncSession,
    owner_id: str,
    *,
    filename: str,
    content_type: str,
    data: bytes,
    category: str = "other",
    description: str | None = None,
    application_ids: list[str] | None = None,
) -> dict:
    validate_upload(filename, content_type, len(data))
    apps: list[Application] = []
    if application_ids:
        result = await db.execute(
            select(Application).where(
                Application.id.in_(application_ids), Application.owner_id == owner_id
            )
        )
        apps = list(result.scalars().all())
        if len(apps) != len(set(application_ids)):
            raise ValidationError("One or more applications were not found.")

    key = build_storage_key(owner_id, filename)
    backend = storage.get_storage()
    await backend.put(key, data, content_type)
    doc = Document(
        owner_id=owner_id,
        original_filename=filename,
        storage_key=key,
        content_type=content_type,
        size_bytes=len(data),
        category=category,
        checksum=hashlib.sha256(data).hexdigest(),
        description=description,
        applications=apps,
    )
    db.add(doc)
    await db.flush()
    await activity_service.log_activity(
        db,
        owner_id=owner_id,
        type=ActivityType.DOCUMENT_UPLOADED,
        title=f"Document uploaded: {filename}",
        meta={"document_id": doc.id, "category": category},
    )
    await db.flush()
    return _to_dict(await get_document(db, owner_id, doc.id))


async def update_document(
    db: AsyncSession, owner_id: str, doc_id: str, data: DocumentUpdate
) -> dict:
    doc = await get_document(db, owner_id, doc_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(doc, field, value.value if hasattr(value, "value") else value)
    await db.flush()
    return _to_dict(await get_document(db, owner_id, doc.id))


async def delete_document(db: AsyncSession, owner_id: str, doc_id: str) -> None:
    doc = await get_document(db, owner_id, doc_id)
    backend = storage.get_storage()
    await backend.delete(doc.storage_key)
    await db.delete(doc)


async def get_download_info(db: AsyncSession, owner_id: str, doc_id: str) -> tuple[Document, str]:
    doc = await get_document(db, owner_id, doc_id)
    backend = storage.get_storage()
    url = await backend.signed_url(
        doc.storage_key,
        doc.original_filename,
        settings.document_signed_url_expire_seconds,
    )
    return doc, url


async def read_content(db: AsyncSession, owner_id: str, doc_id: str) -> tuple[Document, bytes]:
    """Authenticated stream for local dev storage. Verifies ownership first."""
    doc = await get_document(db, owner_id, doc_id)
    backend = storage.get_storage()
    if isinstance(backend, storage.LocalStorageBackend):
        return doc, await backend.get(doc.storage_key)
    return doc, await backend.get(doc.storage_key)
