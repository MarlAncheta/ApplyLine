"""Lightweight in-memory rate limiter for sensitive endpoints.

Suitable for a single-instance free-tier deployment. For multi-instance
deployments, swap this for a shared store (e.g. Redis) — the interface is
intentionally small.
"""

from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import Request

from app.core.config import settings
from app.core.errors import RateLimitError

_hits: dict[str, deque[float]] = defaultdict(deque)


def enforce_rate_limit(request: Request, key: str | None = None) -> None:
    """Sliding-window rate limiter keyed by client IP + logical endpoint key."""
    client = request.client.host if request.client else "unknown"
    bucket = f"{client}:{key or request.url.path}"
    now = time.monotonic()
    window = 60.0
    limit = settings.rate_limit_per_minute

    queue = _hits[bucket]
    while queue and queue[0] <= now - window:
        queue.popleft()
    if len(queue) >= limit:
        raise RateLimitError()
    queue.append(now)


def reset_rate_limits() -> None:
    """Test helper."""
    _hits.clear()
