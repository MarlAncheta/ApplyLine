"""Interview business logic with ownership enforcement and activity logging."""

from __future__ import annotations

from datetime import UTC, date, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import NotFoundError, ValidationError
from app.models.application import Application
from app.models.enums import ActivityType
from app.models.interview import Interview
from app.schemas.interview import InterviewCreate, InterviewUpdate
from app.services import activity_service


async def _verify_application(db: AsyncSession, owner_id: str, app_id: str | None) -> None:
    if not app_id:
        return
    result = await db.execute(
        select(Application.id).where(Application.id == app_id, Application.owner_id == owner_id)
    )
    if result.scalar_one_or_none() is None:
        raise ValidationError("Application not found or not owned by you.")


def _loader(query):  # type: ignore[no-untyped-def]
    return query.options(
        selectinload(Interview.application).selectinload(Application.company)
    )


async def list_interviews(
    db: AsyncSession,
    owner_id: str,
    *,
    upcoming_only: bool = False,
    application_id: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[dict], int]:
    today = datetime.now(UTC).date()
    conditions = [Interview.owner_id == owner_id]
    if upcoming_only:
        conditions.append(Interview.interview_date >= today)
        conditions.append(Interview.cancelled.is_(False))
    if application_id:
        conditions.append(Interview.application_id == application_id)

    total = (
        await db.execute(select(func.count()).select_from(Interview).where(*conditions))
    ).scalar_one()
    rows = await db.execute(
        _loader(select(Interview).where(*conditions))
        .order_by(Interview.interview_date, Interview.start_time)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return [_to_dict(i) for i in rows.scalars().unique().all()], total


def _to_dict(interview: Interview) -> dict:
    app = interview.application
    return {
        "id": interview.id,
        "owner_id": interview.owner_id,
        "application_id": interview.application_id,
        "title": interview.title,
        "interview_date": interview.interview_date,
        "start_time": interview.start_time,
        "timezone": interview.timezone,
        "interview_type": interview.interview_type,
        "location": interview.location,
        "interviewer": interview.interviewer,
        "preparation_notes": interview.preparation_notes,
        "outcome": interview.outcome,
        "feedback": interview.feedback,
        "cancelled": interview.cancelled,
        "created_at": interview.created_at,
        "updated_at": interview.updated_at,
        "application_position": app.position_title if app else None,
        "company_name": app.company.name if app and app.company else None,
    }


async def get_interview(db: AsyncSession, owner_id: str, interview_id: str) -> dict:
    result = await db.execute(
        _loader(
            select(Interview).where(
                Interview.id == interview_id, Interview.owner_id == owner_id
            )
        )
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise NotFoundError("Interview not found.")
    return _to_dict(interview)


async def create_interview(
    db: AsyncSession, owner_id: str, data: InterviewCreate
) -> dict:
    await _verify_application(db, owner_id, data.application_id)
    payload = data.model_dump(exclude_none=True)
    if payload.get("location") is not None:
        payload["location"] = str(payload["location"])
    interview = Interview(owner_id=owner_id, **payload)
    db.add(interview)
    await db.flush()
    await activity_service.log_activity(
        db,
        owner_id=owner_id,
        type=ActivityType.INTERVIEW_SCHEDULED,
        title=f"Interview scheduled: {interview.title}",
        description=str(interview.interview_date),
        application_id=interview.application_id,
        meta={"interview_id": interview.id},
    )
    await db.flush()
    return await get_interview(db, owner_id, interview.id)


async def update_interview(
    db: AsyncSession, owner_id: str, interview_id: str, data: InterviewUpdate
) -> dict:
    result = await db.execute(
        select(Interview).where(Interview.id == interview_id, Interview.owner_id == owner_id)
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise NotFoundError("Interview not found.")

    payload = data.model_dump(exclude_unset=True)
    if "application_id" in payload:
        await _verify_application(db, owner_id, payload["application_id"])
    if payload.get("location") is not None:
        payload["location"] = str(payload["location"])
    for field, value in payload.items():
        setattr(interview, field, value)
    await activity_service.log_activity(
        db,
        owner_id=owner_id,
        type=ActivityType.INTERVIEW_UPDATED,
        title=f"Interview updated: {interview.title}",
        application_id=interview.application_id,
        meta={"interview_id": interview.id},
    )
    await db.flush()
    return await get_interview(db, owner_id, interview.id)


async def delete_interview(db: AsyncSession, owner_id: str, interview_id: str) -> None:
    result = await db.execute(
        select(Interview).where(Interview.id == interview_id, Interview.owner_id == owner_id)
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise NotFoundError("Interview not found.")
    await db.delete(interview)


async def upcoming_count(db: AsyncSession, owner_id: str) -> int:
    today: date = datetime.now(UTC).date()
    result = await db.execute(
        select(func.count()).select_from(Interview).where(
            Interview.owner_id == owner_id,
            Interview.interview_date >= today,
            Interview.cancelled.is_(False),
        )
    )
    return result.scalar_one()
