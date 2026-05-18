from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Mock Darwinbox-like HRMS Backend"
    jwt_secret_key: str = Field(default="change-this-secret-for-local-dev")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    database_url: str = f"sqlite:///{Path(__file__).resolve().parents[2] / 'hrms.db'}"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()

