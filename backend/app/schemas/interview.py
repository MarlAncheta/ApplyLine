"""Interview schemas."""

from __future__ import annotations

from datetime import date, datetime, time

from pydantic import BaseModel, Field, HttpUrl

from app.models.enums import InterviewOutcome, InterviewType
from app.schemas.common import ORMModel


class InterviewBase(BaseModel):
    application_id: str | None = None
    title: str = Field(min_length=1, max_length=200)
    interview_date: date
    start_time: time | None = None
    timezone: str = "UTC"
    interview_type: InterviewType = InterviewType.VIDEO
    location: HttpUrl | str | None = None
    interviewer: str | None = Field(default=None, max_length=200)
    preparation_notes: str | None = None
    outcome: InterviewOutcome = InterviewOutcome.PENDING
    feedback: str | None = None
    cancelled: bool = False


class InterviewCreate(InterviewBase):
    pass


class InterviewUpdate(BaseModel):
    application_id: str | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    interview_date: date | None = None
    start_time: time | None = None
    timezone: str | None = None
    interview_type: InterviewType | None = None
    location: HttpUrl | str | None = None
    interviewer: str | None = None
    preparation_notes: str | None = None
    outcome: InterviewOutcome | None = None
    feedback: str | None = None
    cancelled: bool | None = None


class InterviewRead(ORMModel):
    id: str
    owner_id: str
    application_id: str | None
    title: str
    interview_date: date
    start_time: time | None
    timezone: str
    interview_type: str
    location: str | None
    interviewer: str | None
    preparation_notes: str | None
    outcome: str
    feedback: str | None
    cancelled: bool
    created_at: datetime
    updated_at: datetime
    application_position: str | None = None
    company_name: str | None = None
