from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    token_secret: str
    backend_public_url: str = "http://localhost:8000"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()  # pyright: ignore[reportCallIssue]
