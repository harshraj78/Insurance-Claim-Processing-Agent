import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    DATABASE_URL: str = Field(
        default="postgresql://claims_user:claims_password@localhost:5432/claims_db",
        validation_alias="DATABASE_URL"
    )
    QDRANT_URL: str = Field(
        default="http://localhost:6333",
        validation_alias="QDRANT_URL"
    )
    GEMINI_API_KEY: str = Field(
        default="",
        validation_alias="GEMINI_API_KEY"
    )
    MODEL_PROVIDER: str = Field(
        default="google",
        validation_alias="MODEL_PROVIDER"
    )
    MODEL_NAME: str = Field(
        default="gemini-2.5-flash",
        validation_alias="MODEL_NAME"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
