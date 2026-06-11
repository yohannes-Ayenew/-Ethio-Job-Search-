from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    BOT_TOKEN: str
    MINI_APP_URL: str
    DATABASE_URL: str
    UPSTASH_REDIS_REST_URL: str
    UPSTASH_REDIS_REST_TOKEN: str
    SECRET_KEY: str
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"

settings = Settings()
