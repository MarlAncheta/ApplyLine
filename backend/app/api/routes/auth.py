"""Authentication and profile endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Header, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_current_user, get_refresh_token, verify_csrf
from app.core.errors import UnauthorizedError
from app.core.rate_limit import enforce_rate_limit
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    PasswordChangedResponse,
    RegisterRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserRead,
)
from app.schemas.common import MessageResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["authentication"])


def _set_auth_cookies(response: Response, refresh_token: str, csrf_token: str) -> None:
    response.set_cookie(
        "refresh_token",
        refresh_token,
        max_age=settings.refresh_token_expire_days * 24 * 3600,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path="/api/auth",
        domain=settings.cookie_domain,
    )
    response.set_cookie(
        "csrf_token",
        csrf_token,
        max_age=settings.refresh_token_expire_days * 24 * 3600,
        httponly=False,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path="/",
        domain=settings.cookie_domain,
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("refresh_token", path="/api/auth", domain=settings.cookie_domain)
    response.delete_cookie("csrf_token", path="/", domain=settings.cookie_domain)


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(
    payload: RegisterRequest,
    response: Response,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    enforce_rate_limit(request, "register")
    user = await auth_service.register(db, payload)
    tokens = await auth_service.issue_tokens(db, user)
    await db.commit()
    _set_auth_cookies(response, tokens["refresh_token"], tokens["csrf_token"])
    return TokenResponse(
        access_token=tokens["access_token"],
        expires_in=tokens["expires_in"],
        csrf_token=tokens["csrf_token"],
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    response: Response,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    enforce_rate_limit(request, "login")
    user = await auth_service.authenticate(db, payload.email, payload.password)
    tokens = await auth_service.issue_tokens(db, user)
    await db.commit()
    _set_auth_cookies(response, tokens["refresh_token"], tokens["csrf_token"])
    return TokenResponse(
        access_token=tokens["access_token"],
        expires_in=tokens["expires_in"],
        csrf_token=tokens["csrf_token"],
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    response: Response,
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_csrf_token: str | None = Header(default=None),
) -> TokenResponse:
    verify_csrf(request, x_csrf_token)
    raw_refresh = get_refresh_token(request)
    if not raw_refresh:
        raise UnauthorizedError("Missing refresh token.")
    tokens = await auth_service.refresh_tokens(db, raw_refresh, x_csrf_token or "")
    await db.commit()
    _set_auth_cookies(response, tokens["refresh_token"], tokens["csrf_token"])
    return TokenResponse(
        access_token=tokens["access_token"],
        expires_in=tokens["expires_in"],
        csrf_token=tokens["csrf_token"],
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    response: Response,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await auth_service.logout(db, get_refresh_token(request))
    await db.commit()
    _clear_auth_cookies(response)
    return MessageResponse(message="Logged out successfully.")


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.patch("/me", response_model=UserRead)
async def update_me(
    payload: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(current_user, field, value)
    await db.commit()
    return current_user


@router.post("/change-password", response_model=PasswordChangedResponse)
async def change_password(
    payload: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PasswordChangedResponse:
    await auth_service.change_password(db, current_user, payload)
    await db.commit()
    return PasswordChangedResponse()


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(payload: ForgotPasswordRequest) -> MessageResponse:
    # Foundation only: deliberately returns the same message whether or not the
    # account exists to avoid user enumeration. Email delivery is not configured.
    return MessageResponse(
        message="If an account exists for that email, password reset instructions will be sent."
    )
