"""Company business logic with strict ownership enforcement."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, NotFoundError
from app.models.application import Application
from app.models.company import Company
from app.schemas.company import CompanyCreate, CompanyUpdate


async def list_companies(
    db: AsyncSession,
    owner_id: str,
    *,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[dict], int]:
    base = select(Company).where(Company.owner_id == owner_id)
    count_q = select(func.count()).select_from(Company).where(Company.owner_id == owner_id)
    if search:
        pattern = f"%{search}%"
        base = base.where(
            func.lower(Company.name).like(pattern.lower())
            | func.lower(func.coalesce(Company.industry, "")).like(pattern.lower())
        )
        count_q = count_q.where(
            func.lower(Company.name).like(pattern.lower())
            | func.lower(func.coalesce(Company.industry, "")).like(pattern.lower())
        )
    total = (await db.execute(count_q)).scalar_one()

    rows = (
        await db.execute(
            base.add_columns(func.count(Application.id).label("app_count"))
            .outerjoin(Application, Application.company_id == Company.id)
            .group_by(Company.id)
            .order_by(func.lower(Company.name))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    )
    results = []
    for company, app_count in rows.all():
        results.append(
            {
                "id": company.id,
                "name": company.name,
                "website": company.website,
                "industry": company.industry,
                "location": company.location,
                "contact_person": company.contact_person,
                "contact_email": company.contact_email,
                "notes": company.notes,
                "created_at": company.created_at,
                "updated_at": company.updated_at,
                "application_count": app_count,
            }
        )
    return results, total


async def get_company(db: AsyncSession, owner_id: str, company_id: str) -> Company:
    result = await db.execute(
        select(Company).where(Company.id == company_id, Company.owner_id == owner_id)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise NotFoundError("Company not found.")
    return company


async def create_company(db: AsyncSession, owner_id: str, data: CompanyCreate) -> Company:
    duplicate = await db.execute(
        select(Company).where(
            Company.owner_id == owner_id,
            func.lower(Company.name) == data.name.lower(),
        )
    )
    if duplicate.scalar_one_or_none():
        raise ConflictError("You already have a company with this name.")

    payload = data.model_dump(exclude_none=True)
    if "website" in payload and payload["website"] is not None:
        payload["website"] = str(payload["website"])
    company = Company(owner_id=owner_id, **payload)
    db.add(company)
    await db.flush()
    return company


async def update_company(
    db: AsyncSession, owner_id: str, company_id: str, data: CompanyUpdate
) -> Company:
    company = await get_company(db, owner_id, company_id)
    payload = data.model_dump(exclude_unset=True)
    if "website" in payload and payload["website"] is not None:
        payload["website"] = str(payload["website"])
    for field, value in payload.items():
        setattr(company, field, value)
    await db.flush()
    return company


async def delete_company(db: AsyncSession, owner_id: str, company_id: str) -> None:
    company = await get_company(db, owner_id, company_id)
    await db.delete(company)
