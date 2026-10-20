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
    
    # AI Provider Config (supports OpenAI, Gemini, Groq, OpenRouter, Ollama)
    AI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    AI_MODEL: str = "gpt-4o-mini"
    AI_BASE_URL: Optional[str] = None  # e.g. https://api.openai.com/v1 or custom OpenAI-compatible endpoint
    
    # GitHub Token (Optional, increases rate limit from 60 to 5000 req/hr)
    GITHUB_TOKEN: Optional[str] = None
    
    # Security & CORS
    FRONTEND_ORIGIN: str = "*"
    SESSION_SECRET: str = "vera-secret-session-key-change-in-prod"
    
    model_config = {
        "env_file": (".env", "backend/.env", "../.env"),
        "extra": "ignore"
    }

    def get_ai_credentials(self):
        """Resolve active AI provider API key, base URL, and model."""
        key = (
            self.AI_API_KEY 
            or self.OPENAI_API_KEY 
            or self.GEMINI_API_KEY 
            or self.GROQ_API_KEY
            or os.getenv("AI_API_KEY")
            or os.getenv("OPENAI_API_KEY")
            or os.getenv("GEMINI_API_KEY")
            or os.getenv("GROQ_API_KEY")
        )
        if not key:
            return None, None, None

        base_url = self.AI_BASE_URL or os.getenv("AI_BASE_URL")
        model = self.AI_MODEL or os.getenv("AI_MODEL", "gpt-4o-mini")

        # Auto-configure Google Gemini OpenAI-compatible endpoint
        if (self.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")) and not (self.AI_API_KEY or self.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")):
            if not base_url:
                base_url = "https://generativelanguage.googleapis.com/v1beta/openai/"
            if model == "gpt-4o-mini":
                model = "gemini-1.5-flash"

        # Auto-configure Groq endpoint
        elif (self.GROQ_API_KEY or os.getenv("GROQ_API_KEY")) and not (self.AI_API_KEY or self.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")):
            if not base_url:
                base_url = "https://api.groq.com/openai/v1"
            if model == "gpt-4o-mini":
                model = "llama-3.3-70b-versatile"

        return key, base_url, model

settings = Settings()
