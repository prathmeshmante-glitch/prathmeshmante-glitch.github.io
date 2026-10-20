import time
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

from app.config import settings
from app.schemas import (
    RepositorySummary, RepositoryDetail, ChatRequest, ChatResponse,
    MemoryState, SystemDiagnostics
)
from app.github_service import github_service
from app.assistant import assistant_engine
from app.memory_service import memory_service

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="V.E.R.A. Voice-Enabled Reconnaissance & Assistance API"
)

# CORS Middleware
origins = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "https://prathmeshmante-glitch.github.io"
]
if settings.FRONTEND_ORIGIN and settings.FRONTEND_ORIGIN != "*":
    origins.append(settings.FRONTEND_ORIGIN)
else:
    origins.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for local preview and GitHub Pages
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "V.E.R.A. Core",
        "timestamp": time.time(),
        "version": settings.APP_VERSION
    }

@app.get("/api/system/diagnostics", response_model=SystemDiagnostics)
async def get_diagnostics():
    repos = await github_service.list_repositories()
    return SystemDiagnostics(
        status="nominal",
        backend_version=settings.APP_VERSION,
        ai_provider_configured=bool(assistant_engine.client),
        ai_model=getattr(assistant_engine, "active_model", None) or settings.AI_MODEL,
        github_api_status="connected" if github_service.rate_limit_remaining > 0 else "rate_limited",
        rate_limit_remaining=github_service.rate_limit_remaining,
        total_public_repos=len(repos),
        last_sync_timestamp=time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(github_service.last_sync_time)) if github_service.last_sync_time else None,
        operator=settings.OPERATOR_NAME,
        github_user=settings.GITHUB_USERNAME
    )

@app.get("/api/github/repos", response_model=List[RepositorySummary])
async def get_repositories():
    return await github_service.list_repositories()

@app.get("/api/github/repos/{owner}/{repo}", response_model=RepositoryDetail)
async def get_repository_detail(owner: str, repo: str):
    detail = await github_service.get_repository_detail(owner, repo)
    if not detail:
        raise HTTPException(status_code=404, detail="Repository not found in public index.")
    return detail

@app.post("/api/assistant/chat", response_model=ChatResponse)
async def chat_with_assistant(request: ChatRequest):
    if not request.message or len(request.message.strip()) == 0:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    if len(request.message) > 2000:
        raise HTTPException(status_code=400, detail="Message exceeds maximum token length.")
    return await assistant_engine.process_chat(request)

@app.get("/api/assistant/briefing")
async def get_situational_briefing():
    repos = await github_service.list_repositories()
    sync_str = time.strftime('%H:%M:%S', time.localtime(github_service.last_sync_time)) if github_service.last_sync_time else "recent"
    repo_names = [r.name for r in repos[:3]]
    spoken = (
        f"All systems nominal. Vera indexed {len(repos)} public repositories. "
        f"Featured projects include {', '.join(repo_names)}. Standing by for instructions."
    )
    return {
        "title": "Situational Briefing",
        "spoken": spoken,
        "repo_count": len(repos),
        "recent_repos": repo_names,
        "last_sync": sync_str
    }

@app.get("/api/assistant/wake-acknowledgement")
async def get_wake_acknowledgement(caller_role: str = "guest"):
    from app.personality import WAKE_ACKNOWLEDGEMENTS_OPERATOR, WAKE_ACKNOWLEDGEMENTS_VISITOR
    if caller_role == "owner":
        ack = WAKE_ACKNOWLEDGEMENTS_OPERATOR[0]  # "Yes, Boss?"
    else:
        ack = WAKE_ACKNOWLEDGEMENTS_VISITOR[0]   # "Yes? I'm listening."
    return {"acknowledgement": ack, "caller_role": caller_role}

@app.get("/api/memory", response_model=MemoryState)
async def get_memory(scope: str = "visitor"):
    return memory_service.get_state(scope)

@app.post("/api/memory")
async def update_memory(entry: dict):
    key = entry.get("key")
    value = entry.get("value")
    scope = entry.get("scope", "visitor")
    if not key:
        raise HTTPException(status_code=400, detail="Missing key.")
    success = memory_service.set_preference(key, value, scope)
    return {"success": success}

@app.delete("/api/memory")
async def clear_memory(scope: str = "visitor"):
    success = memory_service.clear_all(scope)
    return {"success": success}
