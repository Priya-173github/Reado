import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_V1_STR: str = "/v1"
    PROJECT_NAME: str = "Reado Backend"

    DATABASE_URL: str | None = None
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "reado_user"
    POSTGRES_PASSWORD: str = "reado_password"
    POSTGRES_DB: str = "reado_dev"
    POSTGRES_PORT: str = "5432"

    SECRET_KEY: str = "supersecretkey_change_in_production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    REDIS_URL: str = "redis://localhost:6379/0"
    
    SENDGRID_API_KEY: str | None = None
    SENDGRID_FROM_EMAIL: str = "noreply@reado.com"

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    class Config:
        env_file = ".env"

settings = Settings()
