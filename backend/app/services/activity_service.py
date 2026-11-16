"""Activity logging used by all domain services."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import Activity
from app.models.enums import ActivityType


async def log_activity(
    db: AsyncSession,
    *,
    owner_id: str,
    type: ActivityType,
    title: str,
    description: str | None = None,
    application_id: str | None = None,
    meta: dict | None = None,
) -> Activity:
    activity = Activity(
        owner_id=owner_id,
        type=type.value,
        title=title,
        description=description,
        application_id=application_id,
        meta=meta or {},
    )
    db.add(activity)
    return activity
