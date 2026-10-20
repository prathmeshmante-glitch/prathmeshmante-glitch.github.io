from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class RepositorySummary(BaseModel):
    name: str
    full_name: str
    description: Optional[str] = None
    language: Optional[str] = None
    stars: int = 0
    forks: int = 0
    open_issues: int = 0
    updated_at: str
    html_url: str
    homepage: Optional[str] = None
    topics: List[str] = []

class RepositoryDetail(RepositorySummary):
    readme: Optional[str] = None
    manifest_technologies: List[str] = []
    architecture_nodes: List[Dict[str, Any]] = []

class ChatMessage(BaseModel):
    role: str = Field(..., description="user or assistant or system")
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    current_repo: Optional[str] = None
    caller_role: str = "guest"  # guest or owner
    concise: bool = True

class ChatResponse(BaseModel):
    spoken_reply: str
    display_reply: str
    title: str
    mode: str = "ai"  # ai or degraded_deterministic
    source_links: List[Dict[str, str]] = []
    detected_intent: Optional[str] = None
    conduct_flag: Optional[str] = None
    comparison_repos: Optional[List[str]] = None
    system_state: str = "ready"

class MemoryEntry(BaseModel):
    id: str
    key: str
    value: Any
    updated_at: str
    scope: str = "visitor"  # visitor or owner

class MemoryState(BaseModel):
    enabled: bool = True
    storage_type: str = "local_and_backend"
    entries: List[MemoryEntry] = []

class SystemDiagnostics(BaseModel):
    status: str
    backend_version: str
    ai_provider_configured: bool
    ai_model: str
    github_api_status: str
    rate_limit_remaining: int
    total_public_repos: int
    last_sync_timestamp: Optional[str] = None
    operator: str
    github_user: str
