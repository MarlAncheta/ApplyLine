"""Document upload, management, and secure download endpoints."""

from __future__ import annotations

import json

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.enums import DocumentCategory
from app.models.user import User
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.document import DocumentRead, DocumentUpdate, DownloadUrlResponse
from app.services import document_service

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("", response_model=PaginatedResponse[DocumentRead])
async def list_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> PaginatedResponse[DocumentRead]:
    items, total = await document_service.list_documents(
        db, current_user.id, page=page, page_size=page_size
    )
    return PaginatedResponse(
        items=[DocumentRead.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
    )


@router.post("", response_model=DocumentRead, status_code=201)
async def upload_document(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    file: UploadFile = File(...),
    category: DocumentCategory = Form(default=DocumentCategory.OTHER),
    description: str | None = Form(default=None),
    application_ids: str | None = Form(default=None),
) -> DocumentRead:
    content = await file.read()
    app_ids: list[str] = []
    if application_ids:
        try:
            parsed = json.loads(application_ids)
            if isinstance(parsed, list):
                app_ids = [str(x) for x in parsed]
        except json.JSONDecodeError:
            app_ids = []
    result = await document_service.upload_document(
        db,
        current_user.id,
        filename=file.filename or "untitled",
        content_type=file.content_type or "application/octet-stream",
        data=content,
        category=category.value,
        description=description,
        application_ids=app_ids,
    )
    await db.commit()
    return DocumentRead.model_validate(result)


@router.get("/{doc_id}", response_model=DocumentRead)
async def get_document(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DocumentRead:
    return DocumentRead.model_validate(
        await document_service.get_document(db, current_user.id, doc_id)
    )


@router.patch("/{doc_id}", response_model=DocumentRead)
async def update_document(
    doc_id: str,
    payload: DocumentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DocumentRead:
    result = await document_service.update_document(db, current_user.id, doc_id, payload)
    await db.commit()
    return DocumentRead.model_validate(result)


@router.delete("/{doc_id}", response_model=MessageResponse)
async def delete_document(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    await document_service.delete_document(db, current_user.id, doc_id)
    await db.commit()
    return MessageResponse(message="Document deleted.")


@router.get("/{doc_id}/download", response_model=DownloadUrlResponse)
async def download_url(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DownloadUrlResponse:
    doc, url = await document_service.get_download_info(db, current_user.id, doc_id)
    return DownloadUrlResponse(
        url=url,
        expires_in=settings.document_signed_url_expire_seconds,
        filename=doc.original_filename,
    )


@router.get("/{doc_id}/content")
async def download_content(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    """Authenticated byte stream. Always verifies ownership before reading storage."""
    doc, data = await document_service.read_content(db, current_user.id, doc_id)
    return Response(
        content=data,
        media_type=doc.content_type,
        headers={
            "Content-Disposition": f'attachment; filename="{doc.original_filename}"',
            "Cache-Control": "no-store",
        },
    )
