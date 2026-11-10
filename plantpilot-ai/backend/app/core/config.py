from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "PlantPilot AI"
    PLANT_NAME: str = "Kaveri Precision Components"
    PLANT_LOCATION: str = "Hosur Plant"
    
    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parents[2]
    DOCUMENTS_DIR: Path = BASE_DIR / "documents"
    CHROMA_DIR: Path = BASE_DIR / "chroma_db"
    
    # LLM Settings
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    # RAG Settings
    SIMILARITY_THRESHOLD: float = 0.35
    TOP_K_CHUNKS: int = 5
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

    class Config:
        env_file = (
            ".env",
            str(Path(__file__).resolve().parents[2] / ".env"),
            str(Path(__file__).resolve().parents[3] / ".env")
        )
        extra = "allow"

settings = Settings()
