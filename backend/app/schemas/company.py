"""Company schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, HttpUrl

from app.schemas.common import ORMModel


class CompanyBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    website: HttpUrl | str | None = None
    industry: str | None = Field(default=None, max_length=120)
    location: str | None = Field(default=None, max_length=200)
    contact_person: str | None = Field(default=None, max_length=120)
    contact_email: EmailStr | str | None = None
    notes: str | None = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    website: HttpUrl | str | None = None
    industry: str | None = None
    location: str | None = None
    contact_person: str | None = None
    contact_email: EmailStr | str | None = None
    notes: str | None = None


class CompanyRead(ORMModel):
    id: str
    name: str
    website: str | None
    industry: str | None
    location: str | None
    contact_person: str | None
    contact_email: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
    application_count: int = 0
