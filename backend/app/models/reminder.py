"""Reminder model."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPkMixin

if TYPE_CHECKING:
    from app.models.application import Application
    from app.models.user import User


class Reminder(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "reminders"
    __table_args__ = (
        Index("ix_reminders_owner_due", "owner_id", "due_at"),
        Index("ix_reminders_owner_completed", "owner_id", "completed"),
    )

    owner_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    application_id: Mapped[str | None] = mapped_column(
        ForeignKey("applications.id", ondelete="SET NULL"), index=True, nullable=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(32), default="other", nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    dedupe_key: Mapped[str | None] = mapped_column(String(200), nullable=True, index=True)

    owner: Mapped[User] = relationship(back_populates="reminders")  # noqa: F821
    application: Mapped[Application | None] = relationship()  # noqa: F821
