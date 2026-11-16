"""Cross-user data isolation (IDOR prevention) tests."""

from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_cannot_read_others_application(auth_client, other_client):
    created = await auth_client.post(
        "/api/applications", json={"position_title": "Private Role"}
    )
    assert created.status_code == 201
    app_id = created.json()["id"]

    r = await other_client.get(f"/api/applications/{app_id}")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_cannot_update_or_delete_others_application(auth_client, other_client):
    created = await auth_client.post(
        "/api/applications", json={"position_title": "Secret Role"}
    )
    app_id = created.json()["id"]

    r = await other_client.patch(f"/api/applications/{app_id}", json={"position_title": "Hacked"})
    assert r.status_code == 404

    d = await other_client.delete(f"/api/applications/{app_id}")
    assert d.status_code == 404


@pytest.mark.asyncio
async def test_cannot_access_others_company(auth_client, other_client):
    created = await auth_client.post("/api/companies", json={"name": "Secret Corp"})
    company_id = created.json()["id"]
    r = await other_client.get(f"/api/companies/{company_id}")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_cannot_use_others_company_on_application(auth_client, other_client):
    created = await other_client.post("/api/companies", json={"name": "Other Corp"})
    company_id = created.json()["id"]
    r = await auth_client.post(
        "/api/applications",
        json={"position_title": "Role", "company_id": company_id},
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_cannot_access_others_document(auth_client, other_client):
    created = await auth_client.post(
        "/api/documents",
        data={"category": "resume"},
        files={"file": ("cv.txt", b"resume content", "text/plain")},
    )
    assert created.status_code == 201, created.text
    doc_id = created.json()["id"]

    r = await other_client.get(f"/api/documents/{doc_id}/content")
    assert r.status_code == 404

    d = await other_client.delete(f"/api/documents/{doc_id}")
    assert d.status_code == 404


@pytest.mark.asyncio
async def test_lists_are_scoped(auth_client, other_client):
    await auth_client.post("/api/applications", json={"position_title": "Mine"})
    await other_client.post("/api/applications", json={"position_title": "Theirs"})

    mine = await auth_client.get("/api/applications")
    theirs = await other_client.get("/api/applications")
    assert mine.json()["total"] == 1
    assert theirs.json()["total"] == 1
    assert mine.json()["items"][0]["position_title"] == "Mine"
