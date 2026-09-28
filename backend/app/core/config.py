from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
	database_url: str
	secret_key: str
	algorithm: str = "HS256"
	access_token_expire_minutes: int = 1440
	groq_base_url: str = Field(
		"https://api.groq.com/openai/v1",
		validation_alias=AliasChoices("GROQ_BASE_URL", "DEFAULT_AI_BASE_URL"),
	)
	groq_api_key: str = Field("", validation_alias=AliasChoices("GROQ_API_KEY", "DEFAULT_AI_API_KEY"))
	groq_model: str = Field(
		"llama-3.3-70b-versatile",
		validation_alias=AliasChoices("GROQ_MODEL", "DEFAULT_AI_MODEL"),
	)

	model_config = SettingsConfigDict(
		env_file=Path(__file__).resolve().parents[2] / ".env",
		env_file_encoding="utf-8",
		extra="ignore",
	)

	@property
	def async_database_url(self) -> str:
		if self.database_url.startswith("postgresql://"):
			return self.database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
		return self.database_url


settings = Settings()
