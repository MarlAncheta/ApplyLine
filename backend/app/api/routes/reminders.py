"""Reminder endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.reminder import ReminderCreate, ReminderRead, ReminderUpdate
from app.services import reminder_service

router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.get("", response_model=PaginatedResponse[ReminderRead])
async def list_reminders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    completed: bool | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> PaginatedResponse[ReminderRead]:
    items, total = await reminder_service.list_reminders(
        db, current_user.id, completed=completed, page=page, page_size=page_size
    )
    return PaginatedResponse(
        items=[ReminderRead.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
    )


@router.get("/{reminder_id}", response_model=ReminderRead)
async def get_reminder(
    reminder_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReminderRead:
    return ReminderRead.model_validate(
        await reminder_service.get_reminder(db, current_user.id, reminder_id)
    )


@router.post("", response_model=ReminderRead, status_code=201)
async def create_reminder(
    payload: ReminderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReminderRead:
    result = await reminder_service.create_reminder(db, current_user.id, payload)
    await db.commit()
    return ReminderRead.model_validate(result)


@router.patch("/{reminder_id}", response_model=ReminderRead)
async def update_reminder(
    reminder_id: str,
    payload: ReminderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReminderRead:
    result = await reminder_service.update_reminder(db, current_user.id, reminder_id, payload)
    await db.commit()
    return ReminderRead.model_validate(result)


@router.delete("/{reminder_id}", response_model=MessageResponse)
async def delete_reminder(
    reminder_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    await reminder_service.delete_reminder(db, current_user.id, reminder_id)
    await db.commit()
    return MessageResponse(message="Reminder deleted.")
