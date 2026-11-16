"""Interview endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.interview import InterviewCreate, InterviewRead, InterviewUpdate
from app.services import interview_service

router = APIRouter(prefix="/interviews", tags=["interviews"])


@router.get("", response_model=PaginatedResponse[InterviewRead])
async def list_interviews(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    upcoming_only: bool = False,
    application_id: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> PaginatedResponse[InterviewRead]:
    items, total = await interview_service.list_interviews(
        db,
        current_user.id,
        upcoming_only=upcoming_only,
        application_id=application_id,
        page=page,
        page_size=page_size,
    )
    return PaginatedResponse(
        items=[InterviewRead.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
    )


@router.get("/{interview_id}", response_model=InterviewRead)
async def get_interview(
    interview_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InterviewRead:
    return InterviewRead.model_validate(
        await interview_service.get_interview(db, current_user.id, interview_id)
    )


@router.post("", response_model=InterviewRead, status_code=201)
async def create_interview(
    payload: InterviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InterviewRead:
    result = await interview_service.create_interview(db, current_user.id, payload)
    await db.commit()
    return InterviewRead.model_validate(result)


@router.patch("/{interview_id}", response_model=InterviewRead)
async def update_interview(
    interview_id: str,
    payload: InterviewUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InterviewRead:
    result = await interview_service.update_interview(db, current_user.id, interview_id, payload)
    await db.commit()
    return InterviewRead.model_validate(result)


@router.delete("/{interview_id}", response_model=MessageResponse)
async def delete_interview(
    interview_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    await interview_service.delete_interview(db, current_user.id, interview_id)
    await db.commit()
    return MessageResponse(message="Interview deleted.")
