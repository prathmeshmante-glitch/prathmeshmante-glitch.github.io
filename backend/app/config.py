import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "V.E.R.A. Backend"
    APP_VERSION: str = "1.0.0"
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    
    # Operator Config
    OPERATOR_NAME: str = "Prathmesh Mante"
    GITHUB_USERNAME: str = "prathmeshmante-glitch"
    VERA_PASSPHRASE: str = "Open the command deck"
    
    # AI Provider Config
    AI_API_KEY: Optional[str] = None
    AI_MODEL: str = "gpt-4o-mini"
    AI_BASE_URL: Optional[str] = None  # e.g. https://api.openai.com/v1 or custom OpenAI-compatible endpoint
    GEMINI_API_KEY: Optional[str] = None
    
    # GitHub Token (Optional, increases rate limit from 60 to 5000 req/hr)
    GITHUB_TOKEN: Optional[str] = None
    
    # Security & CORS
    FRONTEND_ORIGIN: str = "*"
    SESSION_SECRET: str = "vera-secret-session-key-change-in-prod"
    
    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
