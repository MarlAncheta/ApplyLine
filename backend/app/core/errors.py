"""Consistent application error types and response helpers."""

from __future__ import annotations

from typing import Any

from fastapi import Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    """Base error carrying an HTTP status code and a safe, user-facing message."""

    status_code = 400
    detail = "An error occurred."

    def __init__(self, detail: str | None = None, status_code: int | None = None):
        if detail is not None:
            self.detail = detail
        if status_code is not None:
            self.status_code = status_code
        super().__init__(self.detail)


class NotFoundError(AppError):
    status_code = 404
    detail = "Resource not found."


class UnauthorizedError(AppError):
    status_code = 401
    detail = "Not authenticated."


class ForbiddenError(AppError):
    status_code = 403
    detail = "You do not have access to this resource."


class ConflictError(AppError):
    status_code = 409
    detail = "A resource with this value already exists."


class ValidationError(AppError):
    status_code = 422
    detail = "Validation failed."


class RateLimitError(AppError):
    status_code = 429
    detail = "Too many requests. Please try again later."


def ok(data: Any, message: str | None = None, status_code: int = 200) -> JSONResponse:
    """Standard success envelope. Kept optional so endpoints can return typed models."""
    body: dict[str, Any] = {"data": data, "success": True}
    if message:
        body["message"] = message
    return JSONResponse(content=body, status_code=status_code)


async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "success": False},
    )
