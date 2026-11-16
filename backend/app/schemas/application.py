"""Application schemas."""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, Field, HttpUrl

from app.models.enums import (
    ApplicationStatus,
    EmploymentType,
    Priority,
    WorkArrangement,
)
from app.schemas.common import ORMModel


class ApplicationBase(BaseModel):
    company_id: str | None = None
    position_title: str = Field(min_length=1, max_length=200)
    job_description: str | None = None
    job_posting_url: HttpUrl | str | None = None
    employment_type: EmploymentType = EmploymentType.FULL_TIME
    work_arrangement: WorkArrangement = WorkArrangement.REMOTE
    location: str | None = Field(default=None, max_length=200)
    salary: str | None = Field(default=None, max_length=200)
    date_discovered: date | None = None
    date_applied: date | None = None
    status: ApplicationStatus = ApplicationStatus.INTERESTED
    priority: Priority = Priority.MEDIUM
    notes: str | None = None
    follow_up_date: date | None = None
    document_ids: list[str] = Field(default_factory=list)


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationUpdate(BaseModel):
    company_id: str | None = None
    position_title: str | None = Field(default=None, min_length=1, max_length=200)
    job_description: str | None = None
    job_posting_url: HttpUrl | str | None = None
    employment_type: EmploymentType | None = None
    work_arrangement: WorkArrangement | None = None
    location: str | None = None
    salary: str | None = None
    date_discovered: date | None = None
    date_applied: date | None = None
    status: ApplicationStatus | None = None
    priority: Priority | None = None
    notes: str | None = None
    follow_up_date: date | None = None
    document_ids: list[str] | None = None
    archived: bool | None = None


class StatusChangeRequest(BaseModel):
    status: ApplicationStatus


class CompanyBrief(ORMModel):
    id: str
    name: str
    industry: str | None = None
    location: str | None = None


class DocumentBrief(ORMModel):
    id: str
    original_filename: str
    category: str


class ApplicationRead(ORMModel):
    id: str
    owner_id: str
    company_id: str | None
    position_title: str
    job_description: str | None
    job_posting_url: str | None
    employment_type: str
    work_arrangement: str
    location: str | None
    salary: str | None
    date_discovered: date | None
    date_applied: date | None
    status: str
    priority: str
    notes: str | None
    follow_up_date: date | None
    archived: bool
    created_at: datetime
    updated_at: datetime
    company: CompanyBrief | None = None
    documents: list[DocumentBrief] = Field(default_factory=list)
