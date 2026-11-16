"""FastAPI dependencies for authentication."""

from __future__ import annotations

import jwt
from fastapi import Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import UnauthorizedError
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User
from app.services import auth_service


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
    authorization: str | None = Header(default=None),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise UnauthorizedError("Authentication required.")
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = decode_token(token, "access")
    except jwt.PyJWTError as exc:
        raise UnauthorizedError("Invalid or expired access token.") from exc
    user = await auth_service.get_by_id(db, payload["sub"])
    if not user or not user.is_active:
        raise UnauthorizedError("User account is unavailable.")
    return user


def get_refresh_token(request: Request) -> str | None:
    return request.cookies.get("refresh_token")


def verify_csrf(request: Request, x_csrf_token: str | None = Header(default=None)) -> str | None:
    """Double-submit CSRF check: header must match the readable csrf cookie."""
    cookie_csrf = request.cookies.get("csrf_token")
    if not cookie_csrf or not x_csrf_token or cookie_csrf != x_csrf_token:
        raise UnauthorizedError("CSRF validation failed.")
    return x_csrf_token
