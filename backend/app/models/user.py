"""User account and refresh token models."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPkMixin

if TYPE_CHECKING:
    from app.models.activity import Activity
    from app.models.application import Application
    from app.models.company import Company
    from app.models.document import Document
    from app.models.interview import Interview
    from app.models.reminder import Reminder


class User(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    timezone: Mapped[str] = mapped_column(String(64), default="UTC", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    companies: Mapped[list[Company]] = relationship(  # noqa: F821
        back_populates="owner", cascade="all, delete-orphan", lazy="raise"
    )
    applications: Mapped[list[Application]] = relationship(  # noqa: F821
        back_populates="owner", cascade="all, delete-orphan", lazy="raise"
    )
    interviews: Mapped[list[Interview]] = relationship(  # noqa: F821
        back_populates="owner", cascade="all, delete-orphan", lazy="raise"
    )
    documents: Mapped[list[Document]] = relationship(  # noqa: F821
        back_populates="owner", cascade="all, delete-orphan", lazy="raise"
    )
    activities: Mapped[list[Activity]] = relationship(  # noqa: F821
        back_populates="owner", cascade="all, delete-orphan", lazy="raise"
    )
    reminders: Mapped[list[Reminder]] = relationship(  # noqa: F821
        back_populates="owner", cascade="all, delete-orphan", lazy="raise"
    )
    refresh_tokens: Mapped[list[RefreshToken]] = relationship(
        back_populates="user", cascade="all, delete-orphan", lazy="raise"
    )


class RefreshToken(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "refresh_tokens"

    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    family_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped[User] = relationship(back_populates="refresh_tokens")
