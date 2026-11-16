"""Application CRUD, filtering, Kanban status changes, and archiving."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.enums import ApplicationStatus
from app.models.user import User
from app.schemas.application import (
    ApplicationCreate,
    ApplicationRead,
    ApplicationUpdate,
    StatusChangeRequest,
)
from app.schemas.common import MessageResponse, PaginatedResponse
from app.services import application_service

router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("", response_model=PaginatedResponse[ApplicationRead])
async def list_applications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: str | None = None,
    status: ApplicationStatus | None = None,
    priority: str | None = None,
    employment_type: str | None = None,
    work_arrangement: str | None = None,
    company_id: str | None = None,
    archived: bool = False,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> PaginatedResponse[ApplicationRead]:
    items, total = await application_service.list_applications(
        db,
        current_user.id,
        search=search,
        status=status,
        priority=priority,
        employment_type=employment_type,
        work_arrangement=work_arrangement,
        company_id=company_id,
        archived=archived,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    return PaginatedResponse(
        items=[ApplicationRead.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
    )


@router.get("/board", response_model=list[ApplicationRead])
async def board(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ApplicationRead]:
    items, _ = await application_service.list_applications(
        db, current_user.id, page=1, page_size=500
    )
    return [ApplicationRead.model_validate(i) for i in items]


@router.get("/{app_id}", response_model=ApplicationRead)
async def get_application(
    app_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApplicationRead:
    app = await application_service.get_application(db, current_user.id, app_id)
    await db.commit()
    return ApplicationRead.model_validate(app)


@router.post("", response_model=ApplicationRead, status_code=201)
async def create_application(
    payload: ApplicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApplicationRead:
    app = await application_service.create_application(db, current_user.id, payload)
    await db.commit()
    return ApplicationRead.model_validate(app)


@router.patch("/{app_id}", response_model=ApplicationRead)
async def update_application(
    app_id: str,
    payload: ApplicationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApplicationRead:
    app = await application_service.update_application(db, current_user.id, app_id, payload)
    await db.commit()
    return ApplicationRead.model_validate(app)


@router.post("/{app_id}/status", response_model=ApplicationRead)
async def change_status(
    app_id: str,
    payload: StatusChangeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApplicationRead:
    app = await application_service.change_status(db, current_user.id, app_id, payload.status)
    await db.commit()
    return ApplicationRead.model_validate(app)


@router.post("/{app_id}/archive", response_model=ApplicationRead)
async def archive(
    app_id: str,
    archived: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApplicationRead:
    app = await application_service.set_archived(db, current_user.id, app_id, archived)
    await db.commit()
    return ApplicationRead.model_validate(app)


@router.delete("/{app_id}", response_model=MessageResponse)
async def delete_application(
    app_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    await application_service.delete_application(db, current_user.id, app_id)
    await db.commit()
    return MessageResponse(message="Application deleted.")
