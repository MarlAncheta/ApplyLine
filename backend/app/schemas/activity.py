"""Activity and analytics schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMModel


class ActivityRead(ORMModel):
    id: str
    application_id: str | None
    type: str
    title: str
    description: str | None
    meta: dict
    created_at: datetime


class DashboardSummary(BaseModel):
    total_applications: int
    active_applications: int
    interviews: int
    offers: int
    rejections: int
    upcoming_deadlines: int
    upcoming_interviews: int
    recent_activity: list[ActivityRead]


class TimeSeriesPoint(BaseModel):
    label: str
    value: int


class StatusCount(BaseModel):
    status: str
    count: int


class FunnelStep(BaseModel):
    label: str
    value: int
    rate: float | None = None


class AnalyticsResponse(BaseModel):
    applications_over_time: list[TimeSeriesPoint]
    applications_by_status: list[StatusCount]
    interview_conversion: FunnelStep
    offer_conversion: FunnelStep
    rejection_rate: FunnelStep
    average_response_days: float | None
    total_applications: int
    insufficient_data: bool
