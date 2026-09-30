from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_DB_PATH = PROJECT_ROOT / "agriguide.db"
DEFAULT_METTA_RULES = PROJECT_ROOT / "metta" / "irrigation" / "rules.metta"
DEFAULT_METTA_KNOWLEDGE = PROJECT_ROOT / "metta" / "knowledge" / "agriculture.metta"
DEFAULT_OMEGA_SKILL = PROJECT_ROOT / "omega" / "skills" / "agriguide.metta"

class Settings(BaseSettings):
    app_name: str = "AgriGuide"
    environment: str = "development"
    database_url: str = f"sqlite:///{DEFAULT_DB_PATH}"
    api_prefix: str = "/api"
    cors_origins: str = "http://localhost:5173"
    weather_provider: str = "mock"
    llm_provider: str = "mock"
    omega_mode: str = "local"
    omega_url: str = ""
    metta_binary: str = "metta"
    metta_rules_path: str = str(DEFAULT_METTA_RULES)
    metta_knowledge_path: str = str(DEFAULT_METTA_KNOWLEDGE)
    omega_skill_path: str = str(DEFAULT_OMEGA_SKILL)
    secret_key: str = "change-me-in-production"
    # SingularityNET / ASI Cloud OpenAI-compatible API
    asi_cloud_key: str = ""
    asi_cloud_url: str = "https://llm.c.singularitynet.io/v1"
    asi_cloud_model: str = "minimax/minimax-m3"
    openai_api_key: str = ""
    model_config = SettingsConfigDict(
        env_file=(str(PROJECT_ROOT / ".env"), ".env"),
        extra="ignore"
    )

    @property
    def resolved_database_url(self) -> str:
        if self.database_url.startswith("sqlite:////"):
            return self.database_url
        if self.database_url.startswith("sqlite:///./") or self.database_url == "sqlite:///agriguide.db":
            return f"sqlite:///{PROJECT_ROOT / 'agriguide.db'}"
        return self.database_url

settings = Settings()

