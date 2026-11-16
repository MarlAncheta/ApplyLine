"""Real-time metrics derived from database records. No hardcoded statistics."""

from __future__ import annotations

from collections import defaultdict
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.activity import Activity
from app.models.application import Application
from app.models.enums import ActivityType, ApplicationStatus
from app.models.interview import Interview
from app.models.reminder import Reminder
from app.schemas.activity import (
    ActivityRead,
    AnalyticsResponse,
    DashboardSummary,
    FunnelStep,
    StatusCount,
    TimeSeriesPoint,
)

ACTIVE_STATUSES = {
    ApplicationStatus.INTERESTED.value,
    ApplicationStatus.APPLIED.value,
    ApplicationStatus.UNDER_REVIEW.value,
    ApplicationStatus.ASSESSMENT.value,
    ApplicationStatus.INTERVIEW.value,
}


def _activity_read(a: Activity) -> ActivityRead:
    return ActivityRead(
        id=a.id,
        application_id=a.application_id,
        type=a.type,
        title=a.title,
        description=a.description,
        meta=a.meta or {},
        created_at=a.created_at,
    )


async def get_dashboard(db: AsyncSession, owner_id: str) -> DashboardSummary:
    today = datetime.now(UTC).date()
    in_30 = today + timedelta(days=30)

    def count_query(model, *conditions):
        return select(func.count()).select_from(model).where(
            model.owner_id == owner_id, *conditions
        )

    total = (
        await db.execute(count_query(Application, Application.archived.is_(False)))
    ).scalar_one()
    active = (
        await db.execute(
            count_query(
                Application,
                Application.archived.is_(False),
                Application.status.in_(list(ACTIVE_STATUSES)),
            )
        )
    ).scalar_one()
    interviews = (
        await db.execute(
            count_query(Interview, Interview.cancelled.is_(False))
        )
    ).scalar_one()
    offers = (
        await db.execute(
            count_query(Application, Application.status == ApplicationStatus.OFFER.value)
        )
    ).scalar_one()
    rejections = (
        await db.execute(
            count_query(Application, Application.status == ApplicationStatus.REJECTED.value)
        )
    ).scalar_one()
    upcoming_interviews = (
        await db.execute(
            count_query(
                Interview,
                Interview.cancelled.is_(False),
                Interview.interview_date >= today,
            )
        )
    ).scalar_one()
    followups = (
        await db.execute(
            count_query(
                Application,
                Application.archived.is_(False),
                Application.follow_up_date >= today,
                Application.follow_up_date <= in_30,
            )
        )
    ).scalar_one()
    reminders = (
        await db.execute(
            count_query(
                Reminder,
                Reminder.completed.is_(False),
                func.date(Reminder.due_at) >= today,
                func.date(Reminder.due_at) <= in_30,
            )
        )
    ).scalar_one()

    recent_q = (
        select(Activity)
        .where(Activity.owner_id == owner_id)
        .order_by(Activity.created_at.desc())
        .limit(10)
    )
    recent = (await db.execute(recent_q)).scalars().all()

    return DashboardSummary(
        total_applications=total,
        active_applications=active,
        interviews=interviews,
        offers=offers,
        rejections=rejections,
        upcoming_deadlines=followups + reminders,
        upcoming_interviews=upcoming_interviews,
        recent_activity=[_activity_read(a) for a in recent],
    )


async def get_analytics(db: AsyncSession, owner_id: str) -> AnalyticsResponse:
    apps = (
        await db.execute(
            select(Application)
            .options(selectinload(Application.interviews))
            .where(Application.owner_id == owner_id)
        )
    ).scalars().unique().all()

    total = len(apps)
    insufficient = total < 3

    # Applications over time — last 6 months, grouped in Python for DB portability.
    now = datetime.now(UTC)
    month_keys = []
    cursor = now.replace(day=1)
    for _ in range(6):
        month_keys.append((cursor.year, cursor.month))
        cursor = (cursor - timedelta(days=1)).replace(day=1)
    month_keys.reverse()
    buckets: dict[tuple[int, int], int] = defaultdict(int)
    for app in apps:
        if app.created_at:
            buckets[(app.created_at.year, app.created_at.month)] += 1
    series = [
        TimeSeriesPoint(
            label=date(year, month, 1).strftime("%b %Y"),
            value=buckets[(year, month)],
        )
        for year, month in month_keys
    ]

    status_counts: dict[str, int] = defaultdict(int)
    for app in apps:
        status_counts[app.status] += 1
    by_status = [
        StatusCount(status=status, count=count)
        for status, count in sorted(status_counts.items(), key=lambda x: -x[1])
    ]

    interview_count = sum(
        1 for a in apps if a.status == ApplicationStatus.INTERVIEW.value or len(a.interviews) > 0
    )
    offer_count = sum(1 for a in apps if a.status == ApplicationStatus.OFFER.value)
    rejection_count = sum(1 for a in apps if a.status == ApplicationStatus.REJECTED.value)

    def rate(value: int) -> float | None:
        return None if insufficient or total == 0 else round(value / total * 100, 1)

    # Average response time: days from date_applied to first 'applied' status change.
    status_activities = (
        await db.execute(
            select(Activity, Application.date_applied)
            .join(Application, Activity.application_id == Application.id)
            .where(
                Activity.owner_id == owner_id,
                Activity.type == ActivityType.STATUS_CHANGED.value,
            )
        )
    ).all()
    response_days: list[int] = []
    for activity, applied_on in status_activities:
        meta = activity.meta or {}
        if meta.get("from") == ApplicationStatus.APPLIED.value and applied_on:
            delta = (activity.created_at.date() - applied_on).days
            if 0 <= delta <= 365:
                response_days.append(delta)
    avg_response = (
        round(sum(response_days) / len(response_days), 1)
        if len(response_days) >= 3
        else None
    )

    return AnalyticsResponse(
        applications_over_time=series,
        applications_by_status=by_status,
        interview_conversion=FunnelStep(
            label="Interview conversion", value=interview_count, rate=rate(interview_count)
        ),
        offer_conversion=FunnelStep(
            label="Offer conversion", value=offer_count, rate=rate(offer_count)
        ),
        rejection_rate=FunnelStep(
            label="Rejection rate", value=rejection_count, rate=rate(rejection_count)
        ),
        average_response_days=avg_response,
        total_applications=total,
        insufficient_data=insufficient,
    )
