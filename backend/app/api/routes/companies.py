"""Company directory endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.company import CompanyCreate, CompanyRead, CompanyUpdate
from app.services import company_service

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("", response_model=PaginatedResponse[CompanyRead])
async def list_companies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> PaginatedResponse[CompanyRead]:
    items, total = await company_service.list_companies(
        db, current_user.id, search=search, page=page, page_size=page_size
    )
    return PaginatedResponse(
        items=[CompanyRead.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size,
    )


@router.get("/{company_id}", response_model=CompanyRead)
async def get_company(
    company_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CompanyRead:
    company = await company_service.get_company(db, current_user.id, company_id)
    return CompanyRead.model_validate(company)


@router.post("", response_model=CompanyRead, status_code=201)
async def create_company(
    payload: CompanyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CompanyRead:
    company = await company_service.create_company(db, current_user.id, payload)
    await db.commit()
    return CompanyRead.model_validate(company)


@router.patch("/{company_id}", response_model=CompanyRead)
async def update_company(
    company_id: str,
    payload: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CompanyRead:
    company = await company_service.update_company(db, current_user.id, company_id, payload)
    await db.commit()
    return CompanyRead.model_validate(company)


@router.delete("/{company_id}", response_model=MessageResponse)
async def delete_company(
    company_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    await company_service.delete_company(db, current_user.id, company_id)
    await db.commit()
    return MessageResponse(message="Company deleted.")
