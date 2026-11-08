from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    token_secret: str

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    vapid_claim_sub: str


settings = Settings()  # pyright: ignore[reportCallIssue]
