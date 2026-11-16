"""Authentication and authorization tests."""

from __future__ import annotations

import pytest

from app.core.security import generate_csrf_token, hash_token
from app.models.user import RefreshToken


def test_generated_tokens_fit_database_columns():
    """SQLite ignores VARCHAR length; PostgreSQL does not. Guard the real limit."""
    assert len(generate_csrf_token()) <= RefreshToken.__table__.c.family_id.type.length
    assert len(hash_token("sample")) <= RefreshToken.__table__.c.token_hash.type.length


@pytest.mark.asyncio
async def test_health(client):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_register_success(client):
    r = await client.post(
        "/api/auth/register",
        json={"email": "new@example.com", "full_name": "New User", "password": "Password123!"},
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["access_token"]
    assert body["csrf_token"]
    assert "refresh_token" in r.cookies


@pytest.mark.asyncio
async def test_register_duplicate_email(client, registered):
    r = await client.post(
        "/api/auth/register",
        json={"email": "user@example.com", "full_name": "Dup", "password": "Password123!"},
    )
    assert r.status_code == 409


@pytest.mark.asyncio
async def test_login_success_and_failure(client, registered):
    r = await client.post(
        "/api/auth/login",
        json={"email": "user@example.com", "password": "Password123!"},
    )
    assert r.status_code == 200
    assert r.json()["access_token"]

    bad = await client.post(
        "/api/auth/login",
        json={"email": "user@example.com", "password": "WrongPassword1"},
    )
    assert bad.status_code == 401


@pytest.mark.asyncio
async def test_me_requires_auth(client):
    r = await client.get("/api/auth/me")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_me_returns_user(auth_client):
    r = await auth_client.get("/api/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == "user@example.com"


@pytest.mark.asyncio
async def test_refresh_flow(client, registered):
    csrf = registered["csrf_token"]
    r = await client.post(
        "/api/auth/refresh", headers={"X-CSRF-Token": csrf}
    )
    assert r.status_code == 200, r.text
    assert r.json()["access_token"]


@pytest.mark.asyncio
async def test_refresh_rejects_missing_csrf(client, registered):
    r = await client.post("/api/auth/refresh")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_logout(client, registered):
    r = await client.post("/api/auth/logout")
    assert r.status_code == 200
    # Refresh token is revoked; further refresh should fail.
    r2 = await client.post(
        "/api/auth/refresh", headers={"X-CSRF-Token": registered["csrf_token"]}
    )
    assert r2.status_code == 401


@pytest.mark.asyncio
async def test_change_password(auth_client):
    r = await auth_client.post(
        "/api/auth/change-password",
        json={"current_password": "Password123!", "new_password": "NewPassword456!"},
    )
    assert r.status_code == 200

    bad = await auth_client.post(
        "/api/auth/login",
        json={"email": "user@example.com", "password": "Password123!"},
    )
    assert bad.status_code == 401

    good = await auth_client.post(
        "/api/auth/login",
        json={"email": "user@example.com", "password": "NewPassword456!"},
    )
    assert good.status_code == 200


@pytest.mark.asyncio
async def test_profile_update(auth_client):
    r = await auth_client.patch(
        "/api/auth/me", json={"full_name": "Renamed User", "timezone": "America/New_York"}
    )
    assert r.status_code == 200
    assert r.json()["full_name"] == "Renamed User"
    assert r.json()["timezone"] == "America/New_York"
