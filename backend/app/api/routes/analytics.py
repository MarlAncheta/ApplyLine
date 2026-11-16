"""Dashboard and analytics endpoints (computed from real data)."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.activity import AnalyticsResponse, DashboardSummary
from app.services import analytics_service

router = APIRouter(tags=["analytics"])


@router.get("/dashboard", response_model=DashboardSummary)
async def dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardSummary:
    return await analytics_service.get_dashboard(db, current_user.id)


@router.get("/analytics", response_model=AnalyticsResponse)
async def analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AnalyticsResponse:
    return await analytics_service.get_analytics(db, current_user.id)
