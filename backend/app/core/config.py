"""Application configuration loaded from environment variables."""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration object. All secrets come from the environment."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "ApplyLine"
    environment: Literal["development", "production", "testing"] = "development"
    debug: bool = True
    api_v1_prefix: str = "/api"

    secret_key: str = "dev-only-secret-change-me-please-32chars-minimum"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30
    cookie_secure: bool = False
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    cookie_domain: str | None = None

    database_url: str = "sqlite+aiosqlite:///./applyline.db"

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    storage_provider: Literal["local", "s3"] = "local"
    storage_local_path: str = "./uploads"
    storage_bucket: str = "applyline-documents"
    storage_endpoint_url: str | None = None
    storage_region: str = "us-east-1"
    storage_access_key: str | None = None
    storage_secret_key: str | None = None
    document_max_size_mb: int = 10
    document_signed_url_expire_seconds: int = 300

    rate_limit_per_minute: int = 10

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def max_upload_bytes(self) -> int:
        return self.document_max_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
