"""Document metadata model (file bytes live in object storage)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPkMixin

if TYPE_CHECKING:
    from app.models.application import Application
    from app.models.user import User


class Document(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "documents"
    __table_args__ = (
        Index("ix_documents_owner_category", "owner_id", "category"),
    )

    owner_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    original_filename: Mapped[str] = mapped_column(String(300), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(600), unique=True, nullable=False)
    content_type: Mapped[str] = mapped_column(String(150), nullable=False)
    size_bytes: Mapped[int] = mapped_column(nullable=False)
    category: Mapped[str] = mapped_column(String(32), default="other", nullable=False)
    checksum: Mapped[str | None] = mapped_column(String(64), nullable=True)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)

    owner: Mapped[User] = relationship(back_populates="documents")  # noqa: F821
    applications: Mapped[list[Application]] = relationship(  # noqa: F821
        "Application",
        secondary="application_documents",
        back_populates="documents",
        lazy="raise",
    )
