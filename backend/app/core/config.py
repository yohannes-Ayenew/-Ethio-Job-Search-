from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    BOT_TOKEN: str
    MINI_APP_URL: str
    ADMIN_ID: str
    DATABASE_URL: str
    UPSTASH_REDIS_REST_URL: str
    UPSTASH_REDIS_REST_TOKEN: str
    SECRET_KEY: str
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        extra="ignore"
    )

settings = Settings()
