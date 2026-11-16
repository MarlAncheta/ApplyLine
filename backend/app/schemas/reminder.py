"""Reminder schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import ReminderCategory
from app.schemas.common import ORMModel


class ReminderBase(BaseModel):
    application_id: str | None = None
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    due_at: datetime
    category: ReminderCategory = ReminderCategory.OTHER


class ReminderCreate(ReminderBase):
    pass


class ReminderUpdate(BaseModel):
    application_id: str | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    due_at: datetime | None = None
    category: ReminderCategory | None = None
    completed: bool | None = None


class ReminderRead(ORMModel):
    id: str
    owner_id: str
    application_id: str | None
    title: str
    description: str | None
    due_at: datetime
    category: str
    completed: bool
    created_at: datetime
    updated_at: datetime
    application_position: str | None = None
