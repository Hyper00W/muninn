from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "MUNINN"
    app_version: str = "0.1.0"
    debug: bool = True

    database_url: str = "postgresql://postgres:9654@localhost:5432/muninn"

    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"

    embedding_model: str = "all-MiniLM-L6-v2"

    chunk_size: int = 800
    chunk_overlap: int = 100
    retrieval_top_k: int = 5


settings = Settings()