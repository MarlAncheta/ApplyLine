"""Authentication business logic: registration, login, token rotation, passwords."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import security
from app.core.config import settings
from app.core.errors import ConflictError, UnauthorizedError
from app.models.user import RefreshToken, User
from app.schemas.auth import ChangePasswordRequest, RegisterRequest


async def get_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email.lower()))
    return result.scalar_one_or_none()


async def get_by_id(db: AsyncSession, user_id: str) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def register(db: AsyncSession, data: RegisterRequest) -> User:
    email = data.email.lower()
    if await get_by_email(db, email):
        raise ConflictError("An account with this email already exists.")
    user = User(
        email=email,
        full_name=data.full_name.strip(),
        hashed_password=security.hash_password(data.password),
        timezone=data.timezone or "UTC",
    )
    db.add(user)
    await db.flush()
    return user


async def authenticate(db: AsyncSession, email: str, password: str) -> User:
    user = await get_by_email(db, email.lower())
    if not user or not user.is_active:
        # Perform a dummy verify to reduce timing-based user enumeration.
        security.verify_password(password, _DUMMY_HASH)
        raise UnauthorizedError("Incorrect email or password.")
    if not security.verify_password(password, user.hashed_password):
        raise UnauthorizedError("Incorrect email or password.")
    if security.needs_rehash(user.hashed_password):
        user.hashed_password = security.hash_password(password)
    return user


_DUMMY_HASH = security.hash_password("not-a-real-password")


async def issue_tokens(db: AsyncSession, user: User, family_id: str | None = None) -> dict:
    """Create a fresh access/refresh token pair and persist the refresh token."""
    family = family_id or security.generate_csrf_token()
    access = security.create_token(user.id, "access")
    refresh = security.create_token(user.id, "refresh")
    db.add(
        RefreshToken(
            token_hash=security.hash_token(refresh),
            user_id=user.id,
            family_id=family,
            expires_at=datetime.now(UTC)
            + timedelta(days=settings.refresh_token_expire_days),
        )
    )
    return {
        "access_token": access,
        "refresh_token": refresh,
        "csrf_token": security.generate_csrf_token(),
        "expires_in": settings.access_token_expire_minutes * 60,
        "family_id": family,
    }


async def refresh_tokens(db: AsyncSession, raw_refresh: str, csrf_token: str) -> dict:
    """Validate and rotate a refresh token. Reuses revoke the entire family."""
    import jwt

    token_hash = security.hash_token(raw_refresh)
    result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    record = result.scalar_one_or_none()
    if record is None:
        raise UnauthorizedError("Invalid refresh token.")

    if record.revoked:
        # The token was already rotated — possible theft. Revoke the whole family.
        await revoke_family(db, record.family_id)
        raise UnauthorizedError("Refresh token has already been used.")

    try:
        payload = security.decode_token(raw_refresh, "refresh")
    except jwt.PyJWTError as exc:
        raise UnauthorizedError("Invalid or expired refresh token.") from exc

    user = await get_by_id(db, payload["sub"])
    if not user or not user.is_active:
        raise UnauthorizedError("User account is unavailable.")

    record.revoked = True
    return await issue_tokens(db, user, family_id=record.family_id)


async def revoke_family(db: AsyncSession, family_id: str) -> None:
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.family_id == family_id)
    )
    for token in result.scalars().all():
        token.revoked = True


async def logout(db: AsyncSession, raw_refresh: str | None) -> None:
    if not raw_refresh:
        return
    token_hash = security.hash_token(raw_refresh)
    result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    record = result.scalar_one_or_none()
    if record:
        await revoke_family(db, record.family_id)


async def change_password(db: AsyncSession, user: User, data: ChangePasswordRequest) -> None:
    if not security.verify_password(data.current_password, user.hashed_password):
        raise UnauthorizedError("Current password is incorrect.")
    user.hashed_password = security.hash_password(data.new_password)
    # Changing password invalidates all existing sessions.
    result = await db.execute(select(RefreshToken).where(RefreshToken.user_id == user.id))
    for token in result.scalars().all():
        token.revoked = True
