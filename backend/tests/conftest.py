"""Shared pytest fixtures. Environment is configured before app import."""

from __future__ import annotations

import os
import tempfile

_TEST_DIR = tempfile.mkdtemp(prefix="applyline-tests-")
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{os.path.join(_TEST_DIR, 'test.db')}"
os.environ["ENVIRONMENT"] = "testing"
os.environ["DEBUG"] = "false"
os.environ["STORAGE_PROVIDER"] = "local"
os.environ["STORAGE_LOCAL_PATH"] = os.path.join(_TEST_DIR, "uploads")
os.environ["SECRET_KEY"] = "test-secret-key-for-unit-tests-only-1234567890"

import httpx  # noqa: E402
import pytest  # noqa: E402
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine  # noqa: E402

from app.core.rate_limit import reset_rate_limits  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import get_db  # noqa: E402
from app.main import app  # noqa: E402

engine = create_async_engine(
    os.environ["DATABASE_URL"], connect_args={"check_same_thread": False}
)
TestSession = async_sessionmaker(engine, expire_on_commit=False, autoflush=False)


async def _override_get_db():  # type: ignore[no-untyped-def]
    async with TestSession() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture(autouse=True)
async def setup_database():
    reset_rate_limits()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def registered(client):
    response = await client.post(
        "/api/auth/register",
        json={
            "email": "user@example.com",
            "full_name": "Test User",
            "password": "Password123!",
            "timezone": "UTC",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


@pytest.fixture
async def auth_client(client, registered):
    client.headers["Authorization"] = f"Bearer {registered['access_token']}"
    return client


@pytest.fixture
async def other_client(client):
    response = await client.post(
        "/api/auth/register",
        json={
            "email": "other@example.com",
            "full_name": "Other User",
            "password": "Password123!",
        },
    )
    assert response.status_code == 201
    # Use a separate client so cookies/headers do not collide.
    transport = httpx.ASGITransport(app=app)
    ac = httpx.AsyncClient(transport=transport, base_url="http://test")
    ac.headers["Authorization"] = f"Bearer {response.json()['access_token']}"
    yield ac
    await ac.aclose()
