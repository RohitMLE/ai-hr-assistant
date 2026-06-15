from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI HRMS Platform"
    jwt_secret_key: str = Field(default="change-this-secret-for-local-dev")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    database_url: str = Field(default="postgresql://hr_user:hr_password@localhost:5434/hrms")
    test_database_url: str = Field(default="postgresql://hr_user:hr_password@localhost:5433/hrms_test")
    auto_create_tables: bool = Field(default=False)
    debug_errors: bool = Field(default=False)
    anthropic_api_key: str = Field(default="")
    chroma_db_path: str = Field(default="./chroma_db")
    policy_upload_dir: str = Field(default="uploads/policies")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
