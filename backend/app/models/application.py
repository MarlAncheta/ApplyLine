"""Application model and its document association table."""

from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Column, Date, ForeignKey, Index, String, Table, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPkMixin

if TYPE_CHECKING:
    from app.models.activity import Activity
    from app.models.company import Company
    from app.models.document import Document
    from app.models.interview import Interview
    from app.models.user import User

application_documents = Table(
    "application_documents",
    Base.metadata,
    Column(
        "application_id",
        String(36),
        ForeignKey("applications.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "document_id",
        String(36),
        ForeignKey("documents.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Application(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "applications"
    __table_args__ = (
        Index("ix_applications_owner_status", "owner_id", "status"),
        Index("ix_applications_owner_created", "owner_id", "created_at"),
        Index("ix_applications_owner_archived", "owner_id", "archived"),
    )

    owner_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    company_id: Mapped[str | None] = mapped_column(
        ForeignKey("companies.id", ondelete="SET NULL"), index=True, nullable=True
    )

    position_title: Mapped[str] = mapped_column(String(200), nullable=False)
    job_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    job_posting_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    employment_type: Mapped[str] = mapped_column(String(32), default="full_time", nullable=False)
    work_arrangement: Mapped[str] = mapped_column(String(32), default="remote", nullable=False)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    salary: Mapped[str | None] = mapped_column(String(200), nullable=True)
    date_discovered: Mapped[date | None] = mapped_column(Date, nullable=True)
    date_applied: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), default="interested", index=True, nullable=False
    )
    priority: Mapped[str] = mapped_column(String(16), default="medium", nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    follow_up_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    owner: Mapped[User] = relationship(back_populates="applications")  # noqa: F821
    company: Mapped[Company | None] = relationship(back_populates="applications")  # noqa: F821
    documents: Mapped[list[Document]] = relationship(  # noqa: F821
        secondary=application_documents, back_populates="applications", lazy="raise"
    )
    interviews: Mapped[list[Interview]] = relationship(  # noqa: F821
        back_populates="application", cascade="all, delete-orphan", lazy="raise"
    )
    activities: Mapped[list[Activity]] = relationship(  # noqa: F821
        back_populates="application", lazy="raise"
    )
