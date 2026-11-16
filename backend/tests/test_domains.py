"""Company, interview, reminder, document, and analytics tests."""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta

import pytest


@pytest.mark.asyncio
async def test_company_crud_and_duplicate(auth_client):
    r = await auth_client.post(
        "/api/companies", json={"name": "Acme", "industry": "Tech", "website": "https://acme.com"}
    )
    assert r.status_code == 201, r.text
    cid = r.json()["id"]
    assert r.json()["application_count"] == 0

    dup = await auth_client.post("/api/companies", json={"name": "acme"})
    assert dup.status_code == 409

    upd = await auth_client.patch(f"/api/companies/{cid}", json={"industry": "Finance"})
    assert upd.status_code == 200
    assert upd.json()["industry"] == "Finance"

    assert (await auth_client.delete(f"/api/companies/{cid}")).status_code == 200


@pytest.mark.asyncio
async def test_company_application_count(auth_client):
    c = await auth_client.post("/api/companies", json={"name": "Count Corp"})
    cid = c.json()["id"]
    await auth_client.post(
        "/api/applications", json={"position_title": "Role 1", "company_id": cid}
    )
    await auth_client.post(
        "/api/applications", json={"position_title": "Role 2", "company_id": cid}
    )
    listing = await auth_client.get("/api/companies")
    target = next(x for x in listing.json()["items"] if x["id"] == cid)
    assert target["application_count"] == 2


@pytest.mark.asyncio
async def test_interview_lifecycle(auth_client):
    app = await auth_client.post("/api/applications", json={"position_title": "Interview Role"})
    app_id = app.json()["id"]
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    r = await auth_client.post(
        "/api/interviews",
        json={
            "application_id": app_id,
            "title": "Technical Screen",
            "interview_date": tomorrow,
            "start_time": "10:00:00",
            "timezone": "UTC",
            "interview_type": "technical",
        },
    )
    assert r.status_code == 201, r.text
    iid = r.json()["id"]
    assert r.json()["company_name"] is None
    assert r.json()["application_position"] == "Interview Role"

    upcoming = await auth_client.get("/api/interviews?upcoming_only=true")
    assert upcoming.json()["total"] == 1

    patch = await auth_client.patch(f"/api/interviews/{iid}", json={"outcome": "passed"})
    assert patch.status_code == 200
    assert patch.json()["outcome"] == "passed"

    assert (await auth_client.delete(f"/api/interviews/{iid}")).status_code == 200


@pytest.mark.asyncio
async def test_reminder_and_duplicate(auth_client):
    due = (datetime.now(UTC) + timedelta(days=2)).isoformat()
    payload = {"title": "Follow up", "due_at": due, "category": "follow_up"}
    r = await auth_client.post("/api/reminders", json=payload)
    assert r.status_code == 201, r.text
    rid = r.json()["id"]

    dup = await auth_client.post("/api/reminders", json=payload)
    assert dup.status_code == 409

    done = await auth_client.patch(f"/api/reminders/{rid}", json={"completed": True})
    assert done.status_code == 200
    assert done.json()["completed"] is True

    assert (await auth_client.delete(f"/api/reminders/{rid}")).status_code == 200


@pytest.mark.asyncio
async def test_document_upload_and_download(auth_client):
    r = await auth_client.post(
        "/api/documents",
        data={"category": "resume", "description": "My CV"},
        files={"file": ("resume.txt", b"resume bytes", "text/plain")},
    )
    assert r.status_code == 201, r.text
    doc_id = r.json()["id"]
    assert r.json()["size_bytes"] == len(b"resume bytes")

    content = await auth_client.get(f"/api/documents/{doc_id}/content")
    assert content.status_code == 200
    assert content.content == b"resume bytes"
    assert "attachment" in content.headers["content-disposition"]

    rename = await auth_client.patch(
        f"/api/documents/{doc_id}", json={"original_filename": "cv-final.txt"}
    )
    assert rename.json()["original_filename"] == "cv-final.txt"

    assert (await auth_client.delete(f"/api/documents/{doc_id}")).status_code == 200


@pytest.mark.asyncio
async def test_document_rejects_bad_extension(auth_client):
    r = await auth_client.post(
        "/api/documents",
        files={"file": ("malware.exe", b"bad", "application/octet-stream")},
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_document_association(auth_client):
    app = await auth_client.post("/api/applications", json={"position_title": "Linked"})
    app_id = app.json()["id"]
    r = await auth_client.post(
        "/api/documents",
        data={"category": "cover_letter", "application_ids": f'["{app_id}"]'},
        files={"file": ("cover.txt", b"cover", "text/plain")},
    )
    assert r.status_code == 201, r.text
    assert app_id in r.json()["application_ids"]


@pytest.mark.asyncio
async def test_analytics_uses_real_data(auth_client):
    empty = await auth_client.get("/api/analytics")
    assert empty.status_code == 200
    assert empty.json()["total_applications"] == 0
    assert empty.json()["insufficient_data"] is True
    assert empty.json()["interview_conversion"]["rate"] is None

    for i in range(3):
        await auth_client.post(
            "/api/applications",
            json={"position_title": f"Role {i}", "status": ["applied", "interview", "offer"][i]},
        )
    result = await auth_client.get("/api/analytics")
    assert result.json()["total_applications"] == 3
    assert result.json()["insufficient_data"] is False
    assert result.json()["interview_conversion"]["rate"] is not None
    assert result.json()["offer_conversion"]["value"] == 1

    dashboard = await auth_client.get("/api/dashboard")
    d = dashboard.json()
    assert d["total_applications"] == 3
    assert d["offers"] == 1
    assert len(d["recent_activity"]) > 0
