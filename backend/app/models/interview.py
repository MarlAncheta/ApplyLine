"""Interview model."""

from __future__ import annotations

from datetime import date, time
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, ForeignKey, Index, String, Text, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPkMixin

if TYPE_CHECKING:
    from app.models.application import Application
    from app.models.user import User


class Interview(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "interviews"
    __table_args__ = (
        Index("ix_interviews_owner_datetime", "owner_id", "interview_date", "start_time"),
    )

    owner_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    application_id: Mapped[str | None] = mapped_column(
        ForeignKey("applications.id", ondelete="SET NULL"), index=True, nullable=True
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    interview_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    timezone: Mapped[str] = mapped_column(String(64), default="UTC", nullable=False)
    interview_type: Mapped[str] = mapped_column(String(32), default="video", nullable=False)
    location: Mapped[str | None] = mapped_column(String(500), nullable=True)
    interviewer: Mapped[str | None] = mapped_column(String(200), nullable=True)
    preparation_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    outcome: Mapped[str] = mapped_column(String(32), default="pending", nullable=False)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    cancelled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    owner: Mapped[User] = relationship(back_populates="interviews")  # noqa: F821
    application: Mapped[Application | None] = relationship(  # noqa: F821
        back_populates="interviews"
    )
