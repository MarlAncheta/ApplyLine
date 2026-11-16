"""Activity timeline model."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import JSON, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPkMixin

if TYPE_CHECKING:
    from app.models.application import Application
    from app.models.user import User


class Activity(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "activities"
    __table_args__ = (
        Index("ix_activities_owner_created", "owner_id", "created_at"),
    )

    owner_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    application_id: Mapped[str | None] = mapped_column(
        ForeignKey("applications.id", ondelete="SET NULL"), index=True, nullable=True
    )
    type: Mapped[str] = mapped_column(String(48), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    meta: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    owner: Mapped[User] = relationship(back_populates="activities")  # noqa: F821
    application: Mapped[Application | None] = relationship(  # noqa: F821
        back_populates="activities"
    )
