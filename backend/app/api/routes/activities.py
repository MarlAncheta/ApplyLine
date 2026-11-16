"""Activity timeline endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.activity import Activity
from app.models.user import User
from app.schemas.activity import ActivityRead
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/activities", tags=["activities"])


@router.get("", response_model=PaginatedResponse[ActivityRead])
async def list_activities(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    application_id: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> PaginatedResponse[ActivityRead]:
    from sqlalchemy import func

    conditions = [Activity.owner_id == current_user.id]
    if application_id:
        conditions.append(Activity.application_id == application_id)
    total = (
        await db.execute(select(func.count()).select_from(Activity).where(*conditions))
    ).scalar_one()
    rows = await db.execute(
        select(Activity)
        .where(*conditions)
        .order_by(Activity.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = [ActivityRead.model_validate(a) for a in rows.scalars().all()]
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
    )
