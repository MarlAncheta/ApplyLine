"""Application business logic, filtering, and status transitions."""

from __future__ import annotations

from typing import cast

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import NotFoundError, ValidationError
from app.models.application import Application
from app.models.company import Company
from app.models.document import Document
from app.models.enums import ActivityType, ApplicationStatus
from app.schemas.application import ApplicationCreate, ApplicationUpdate
from app.services import activity_service

SORT_FIELDS = {
    "created_at": Application.created_at,
    "updated_at": Application.updated_at,
    "position_title": Application.position_title,
    "date_applied": Application.date_applied,
    "status": Application.status,
    "priority": Application.priority,
}


def _loader(query):  # type: ignore[no-untyped-def]
    return query.options(
        selectinload(Application.company),
        selectinload(Application.documents),
    )


async def _verify_company(db: AsyncSession, owner_id: str, company_id: str | None) -> None:
    if not company_id:
        return
    res = await db.execute(
        select(Company.id).where(Company.id == company_id, Company.owner_id == owner_id)
    )
    if res.scalar_one_or_none() is None:
        raise ValidationError("Company not found or not owned by you.")


async def _verify_documents(
    db: AsyncSession, owner_id: str, document_ids: list[str]
) -> list[Document]:
    if not document_ids:
        return []
    result = await db.execute(
        select(Document).where(Document.id.in_(document_ids), Document.owner_id == owner_id)
    )
    docs = list(result.scalars().all())
    if len(docs) != len(set(document_ids)):
        raise ValidationError("One or more documents were not found.")
    return docs


async def list_applications(
    db: AsyncSession,
    owner_id: str,
    *,
    search: str | None = None,
    status: ApplicationStatus | None = None,
    priority: str | None = None,
    employment_type: str | None = None,
    work_arrangement: str | None = None,
    company_id: str | None = None,
    archived: bool = False,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Application], int]:
    conditions = [Application.owner_id == owner_id, Application.archived == archived]
    if search:
        pattern = f"%{search}%"
        conditions.append(
            func.lower(Application.position_title).like(pattern.lower())
            | func.lower(func.coalesce(Application.notes, "")).like(pattern.lower())
        )
    if status:
        conditions.append(Application.status == status.value)
    if priority:
        conditions.append(Application.priority == priority)
    if employment_type:
        conditions.append(Application.employment_type == employment_type)
    if work_arrangement:
        conditions.append(Application.work_arrangement == work_arrangement)
    if company_id:
        conditions.append(Application.company_id == company_id)

    total = (
        await db.execute(
            select(func.count()).select_from(Application).where(*conditions)
        )
    ).scalar_one()

    sort_col = SORT_FIELDS.get(sort_by, Application.created_at)
    order = sort_col.asc() if sort_order == "asc" else sort_col.desc()

    query = _loader(
        select(Application).where(*conditions).order_by(order, Application.id)
    ).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    return list(result.scalars().unique().all()), total


async def get_application(db: AsyncSession, owner_id: str, app_id: str) -> Application:
    result = await db.execute(
        _loader(
            select(Application).where(Application.id == app_id, Application.owner_id == owner_id)
        )
    )
    app = result.scalar_one_or_none()
    if not app:
        raise NotFoundError("Application not found.")
    return cast(Application, app)


async def create_application(
    db: AsyncSession, owner_id: str, data: ApplicationCreate
) -> Application:
    await _verify_company(db, owner_id, data.company_id)
    docs = await _verify_documents(db, owner_id, data.document_ids)

    payload = data.model_dump(exclude_none=True, exclude={"document_ids"})
    if payload.get("job_posting_url") is not None:
        payload["job_posting_url"] = str(payload["job_posting_url"])
    app = Application(owner_id=owner_id, documents=docs, **payload)
    db.add(app)
    await db.flush()
    await activity_service.log_activity(
        db,
        owner_id=owner_id,
        type=ActivityType.APPLICATION_CREATED,
        title=f"Application created: {app.position_title}",
        application_id=app.id,
        meta={"status": app.status},
    )
    await db.flush()
    return await get_application(db, owner_id, app.id)


async def update_application(
    db: AsyncSession, owner_id: str, app_id: str, data: ApplicationUpdate
) -> Application:
    app = await get_application(db, owner_id, app_id)
    payload = data.model_dump(exclude_unset=True, exclude={"document_ids"})

    if "company_id" in payload:
        await _verify_company(db, owner_id, payload["company_id"])
    if payload.get("job_posting_url") is not None:
        payload["job_posting_url"] = str(payload["job_posting_url"])

    old_status = app.status
    new_status = payload.get("status")
    new_status_value = new_status.value if new_status is not None else None

    for field, value in payload.items():
        setattr(app, field, value)

    if data.document_ids is not None:
        app.documents = await _verify_documents(db, owner_id, data.document_ids)

    if new_status_value and new_status_value != old_status:
        await activity_service.log_activity(
            db,
            owner_id=owner_id,
            type=ActivityType.STATUS_CHANGED,
            title=f"Status changed: {app.position_title}",
            description=f"{old_status} → {new_status_value}",
            application_id=app.id,
            meta={"from": old_status, "to": new_status_value},
        )
    else:
        await activity_service.log_activity(
            db,
            owner_id=owner_id,
            type=ActivityType.APPLICATION_UPDATED,
            title=f"Application updated: {app.position_title}",
            application_id=app.id,
        )
    await db.flush()
    return await get_application(db, owner_id, app.id)


async def change_status(
    db: AsyncSession, owner_id: str, app_id: str, new_status: ApplicationStatus
) -> Application:
    """Used by the Kanban drag/drop. Idempotent: no activity when status is unchanged."""
    app = await get_application(db, owner_id, app_id)
    if app.status == new_status.value:
        return app
    old_status = app.status
    app.status = new_status.value
    await activity_service.log_activity(
        db,
        owner_id=owner_id,
        type=ActivityType.STATUS_CHANGED,
        title=f"Status changed: {app.position_title}",
        description=f"{old_status} → {new_status.value}",
        application_id=app.id,
        meta={"from": old_status, "to": new_status.value},
    )
    await db.flush()
    return await get_application(db, owner_id, app.id)


async def set_archived(
    db: AsyncSession, owner_id: str, app_id: str, archived: bool
) -> Application:
    app = await get_application(db, owner_id, app_id)
    if app.archived == archived:
        return app
    app.archived = archived
    await activity_service.log_activity(
        db,
        owner_id=owner_id,
        type=ActivityType.APPLICATION_ARCHIVED,
        title=("Archived" if archived else "Restored") + f": {app.position_title}",
        application_id=app.id,
        meta={"archived": archived},
    )
    await db.flush()
    return await get_application(db, owner_id, app.id)


async def delete_application(db: AsyncSession, owner_id: str, app_id: str) -> None:
    app = await get_application(db, owner_id, app_id)
    await db.delete(app)
