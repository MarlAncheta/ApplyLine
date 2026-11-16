"""Reminder business logic with duplicate prevention."""

from __future__ import annotations

import hashlib

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import ConflictError, NotFoundError, ValidationError
from app.models.application import Application
from app.models.enums import ActivityType
from app.models.reminder import Reminder
from app.schemas.reminder import ReminderCreate, ReminderUpdate
from app.services import activity_service


def _dedupe_key(owner_id: str, title: str, due_at: str, application_id: str | None) -> str:
    raw = f"{owner_id}|{title.strip().lower()}|{due_at}|{application_id or ''}"
    return hashlib.sha256(raw.encode()).hexdigest()


async def _verify_application(db: AsyncSession, owner_id: str, app_id: str | None) -> None:
    if not app_id:
        return
    result = await db.execute(
        select(Application.id).where(Application.id == app_id, Application.owner_id == owner_id)
    )
    if result.scalar_one_or_none() is None:
        raise ValidationError("Application not found or not owned by you.")


def _loader(query):  # type: ignore[no-untyped-def]
    return query.options(selectinload(Reminder.application))


def _to_dict(reminder: Reminder) -> dict:
    return {
        "id": reminder.id,
        "owner_id": reminder.owner_id,
        "application_id": reminder.application_id,
        "title": reminder.title,
        "description": reminder.description,
        "due_at": reminder.due_at,
        "category": reminder.category,
        "completed": reminder.completed,
        "created_at": reminder.created_at,
        "updated_at": reminder.updated_at,
        "application_position": (
            reminder.application.position_title if reminder.application else None
        ),
    }


async def list_reminders(
    db: AsyncSession,
    owner_id: str,
    *,
    completed: bool | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[dict], int]:
    conditions = [Reminder.owner_id == owner_id]
    if completed is not None:
        conditions.append(Reminder.completed == completed)
    total = (
        await db.execute(select(func.count()).select_from(Reminder).where(*conditions))
    ).scalar_one()
    rows = await db.execute(
        _loader(select(Reminder).where(*conditions))
        .order_by(Reminder.due_at)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return [_to_dict(r) for r in rows.scalars().unique().all()], total


async def get_reminder(db: AsyncSession, owner_id: str, reminder_id: str) -> dict:
    result = await db.execute(
        _loader(
            select(Reminder).where(Reminder.id == reminder_id, Reminder.owner_id == owner_id)
        )
    )
    reminder = result.scalar_one_or_none()
    if not reminder:
        raise NotFoundError("Reminder not found.")
    return _to_dict(reminder)


async def create_reminder(db: AsyncSession, owner_id: str, data: ReminderCreate) -> dict:
    await _verify_application(db, owner_id, data.application_id)
    dedupe = _dedupe_key(owner_id, data.title, data.due_at.isoformat(), data.application_id)
    existing = await db.execute(
        select(Reminder.id).where(
            Reminder.owner_id == owner_id, Reminder.dedupe_key == dedupe
        )
    )
    if existing.scalar_one_or_none():
        raise ConflictError("An identical reminder already exists.")

    reminder = Reminder(
        owner_id=owner_id,
        dedupe_key=dedupe,
        **data.model_dump(exclude_none=True),
    )
    db.add(reminder)
    await db.flush()
    await activity_service.log_activity(
        db,
        owner_id=owner_id,
        type=ActivityType.REMINDER_CREATED,
        title=f"Reminder created: {reminder.title}",
        application_id=reminder.application_id,
        meta={"reminder_id": reminder.id},
    )
    await db.flush()
    return await get_reminder(db, owner_id, reminder.id)


async def update_reminder(
    db: AsyncSession, owner_id: str, reminder_id: str, data: ReminderUpdate
) -> dict:
    result = await db.execute(
        select(Reminder).where(Reminder.id == reminder_id, Reminder.owner_id == owner_id)
    )
    reminder = result.scalar_one_or_none()
    if not reminder:
        raise NotFoundError("Reminder not found.")

    payload = data.model_dump(exclude_unset=True)
    if "application_id" in payload:
        await _verify_application(db, owner_id, payload["application_id"])
    for field, value in payload.items():
        setattr(reminder, field, value)
    # Recompute dedupe key when identity-defining fields change.
    reminder.dedupe_key = _dedupe_key(
        owner_id, reminder.title, reminder.due_at.isoformat(), reminder.application_id
    )
    await db.flush()
    return await get_reminder(db, owner_id, reminder.id)


async def delete_reminder(db: AsyncSession, owner_id: str, reminder_id: str) -> None:
    result = await db.execute(
        select(Reminder).where(Reminder.id == reminder_id, Reminder.owner_id == owner_id)
    )
    reminder = result.scalar_one_or_none()
    if not reminder:
        raise NotFoundError("Reminder not found.")
    await db.delete(reminder)
