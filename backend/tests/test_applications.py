"""Application CRUD, filtering, Kanban transitions, and activity logging."""

from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_application_crud(auth_client):
    create = await auth_client.post(
        "/api/applications",
        json={
            "position_title": "Software Engineer",
            "status": "interested",
            "priority": "high",
            "employment_type": "full_time",
            "work_arrangement": "hybrid",
            "location": "Remote",
            "salary": "$100k",
        },
    )
    assert create.status_code == 201, create.text
    app_id = create.json()["id"]
    assert create.json()["status"] == "interested"

    read = await auth_client.get(f"/api/applications/{app_id}")
    assert read.status_code == 200
    assert read.json()["position_title"] == "Software Engineer"

    update = await auth_client.patch(
        f"/api/applications/{app_id}", json={"notes": "Great company", "priority": "low"}
    )
    assert update.status_code == 200
    assert update.json()["notes"] == "Great company"
    assert update.json()["priority"] == "low"

    delete = await auth_client.delete(f"/api/applications/{app_id}")
    assert delete.status_code == 200
    assert (await auth_client.get(f"/api/applications/{app_id}")).status_code == 404


@pytest.mark.asyncio
async def test_status_change_logs_activity_once(auth_client):
    created = await auth_client.post(
        "/api/applications", json={"position_title": "Kanban Role"}
    )
    app_id = created.json()["id"]

    first = await auth_client.post(
        f"/api/applications/{app_id}/status", json={"status": "applied"}
    )
    assert first.status_code == 200
    assert first.json()["status"] == "applied"

    # Repeating the same status must not create another activity record.
    second = await auth_client.post(
        f"/api/applications/{app_id}/status", json={"status": "applied"}
    )
    assert second.status_code == 200

    activities = await auth_client.get("/api/activities")
    status_changes = [
        a for a in activities.json()["items"] if a["type"] == "status_changed"
    ]
    assert len(status_changes) == 1


@pytest.mark.asyncio
async def test_archive_and_filtering(auth_client):
    a = await auth_client.post("/api/applications", json={"position_title": "One"})
    b = await auth_client.post(
        "/api/applications", json={"position_title": "Two", "status": "offer"}
    )
    assert a.status_code == 201 and b.status_code == 201

    offer = await auth_client.get("/api/applications?status=offer")
    assert offer.json()["total"] == 1
    assert offer.json()["items"][0]["position_title"] == "Two"

    search = await auth_client.get("/api/applications?search=One")
    assert search.json()["total"] == 1

    await auth_client.post(f"/api/applications/{a.json()['id']}/archive")
    archived = await auth_client.get("/api/applications?archived=true")
    assert archived.json()["total"] == 1
    active = await auth_client.get("/api/applications")
    assert active.json()["total"] == 1


@pytest.mark.asyncio
async def test_board_endpoint(auth_client):
    await auth_client.post("/api/applications", json={"position_title": "Board A"})
    await auth_client.post(
        "/api/applications", json={"position_title": "Board B", "status": "interview"}
    )
    r = await auth_client.get("/api/applications/board")
    assert r.status_code == 200
    assert len(r.json()) == 2


@pytest.mark.asyncio
async def test_validation_rejects_bad_status(auth_client):
    r = await auth_client.post(
        "/api/applications", json={"position_title": "Bad", "status": "not_a_status"}
    )
    assert r.status_code == 422
