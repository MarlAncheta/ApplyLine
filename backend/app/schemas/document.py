"""Document schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import DocumentCategory
from app.schemas.common import ORMModel


class DocumentRead(ORMModel):
    id: str
    owner_id: str
    original_filename: str
    content_type: str
    size_bytes: int
    category: str
    description: str | None
    created_at: datetime
    updated_at: datetime
    application_ids: list[str] = Field(default_factory=list)


class DocumentUpdate(BaseModel):
    original_filename: str | None = Field(default=None, min_length=1, max_length=300)
    category: DocumentCategory | None = None
    description: str | None = None


class DownloadUrlResponse(BaseModel):
    url: str
    expires_in: int
    filename: str
