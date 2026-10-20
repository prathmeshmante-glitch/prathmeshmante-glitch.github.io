import httpx
import base64
import time
import re
from typing import List, Dict, Any, Optional
from app.config import settings
from app.schemas import RepositorySummary, RepositoryDetail

class GitHubService:
    def __init__(self):
        self.cache: Dict[str, Any] = {}
        self.cache_ttl = 300  # 5 minutes
        self.last_sync_time: Optional[float] = None
        self.rate_limit_remaining = 60
        self.headers = {
            "User-Agent": "VERA-Engineering-System/1.0",
            "Accept": "application/vnd.github.v3+json"
        }
        if settings.GITHUB_TOKEN:
            self.headers["Authorization"] = f"token {settings.GITHUB_TOKEN}"

    async def list_repositories(self, username: Optional[str] = None) -> List[RepositorySummary]:
        user = username or settings.GITHUB_USERNAME
        cache_key = f"repos_{user}"
        now = time.time()

        if cache_key in self.cache and (now - self.cache[cache_key]["timestamp"]) < self.cache_ttl:
            return self.cache[cache_key]["data"]

        url = f"https://api.github.com/users/{user}/repos?per_page=100&sort=updated"
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(url, headers=self.headers)
                self.rate_limit_remaining = int(resp.headers.get("x-ratelimit-remaining", self.rate_limit_remaining))
                if resp.status_code == 200:
                    data = resp.json()
                    repos = []
                    for r in data:
                        if r.get("fork"):
                            continue
                        repos.append(RepositorySummary(
                            name=r.get("name"),
                            full_name=r.get("full_name"),
                            description=r.get("description"),
                            language=r.get("language"),
                            stars=r.get("stargazers_count", 0),
                            forks=r.get("forks_count", 0),
                            open_issues=r.get("open_issues_count", 0),
                            updated_at=r.get("updated_at", ""),
                            html_url=r.get("html_url", ""),
                            homepage=r.get("homepage"),
                            topics=r.get("topics", [])
                        ))
                    self.cache[cache_key] = {"data": repos, "timestamp": now}
                    self.last_sync_time = now
                    return repos
                else:
                    # Return cached if available, else empty list
                    if cache_key in self.cache:
                        return self.cache[cache_key]["data"]
                    return []
            except Exception as e:
                if cache_key in self.cache:
                    return self.cache[cache_key]["data"]
                return []

    async def get_repository_detail(self, owner: str, repo: str) -> Optional[RepositoryDetail]:
        cache_key = f"repo_detail_{owner}_{repo}"
        now = time.time()
        if cache_key in self.cache and (now - self.cache[cache_key]["timestamp"]) < self.cache_ttl:
            return self.cache[cache_key]["data"]

        summary = None
        repos = await self.list_repositories(owner)
        for r in repos:
            if r.name.lower() == repo.lower():
                summary = r
                break

        if not summary:
            # Fallback direct fetch
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"https://api.github.com/repos/{owner}/{repo}", headers=self.headers)
                if resp.status_code == 200:
                    r = resp.json()
                    summary = RepositorySummary(
                        name=r.get("name"),
                        full_name=r.get("full_name"),
                        description=r.get("description"),
                        language=r.get("language"),
                        stars=r.get("stargazers_count", 0),
                        forks=r.get("forks_count", 0),
                        open_issues=r.get("open_issues_count", 0),
                        updated_at=r.get("updated_at", ""),
                        html_url=r.get("html_url", ""),
                        homepage=r.get("homepage"),
                        topics=r.get("topics", [])
                    )

        if not summary:
            return None

        # Fetch README and Manifests
        readme_content = await self.fetch_readme(owner, repo)
        manifest_tech = await self.detect_manifest_technologies(owner, repo)
        architecture = self.generate_architecture_nodes(summary, manifest_tech, readme_content)

        detail = RepositoryDetail(
            **summary.model_dump(),
            readme=readme_content,
            manifest_technologies=manifest_tech,
            architecture_nodes=architecture
        )
        self.cache[cache_key] = {"data": detail, "timestamp": now}
        return detail

    async def fetch_readme(self, owner: str, repo: str) -> Optional[str]:
        # Try raw user content first for speed
        raw_urls = [
            f"https://raw.githubusercontent.com/{owner}/{repo}/main/README.md",
            f"https://raw.githubusercontent.com/{owner}/{repo}/master/README.md"
        ]
        async with httpx.AsyncClient(timeout=8.0) as client:
            for url in raw_urls:
                try:
                    resp = await client.get(url, headers=self.headers)
                    if resp.status_code == 200:
                        return resp.text
                except Exception:
                    pass

            # Fallback to GitHub API endpoint
            try:
                resp = await client.get(f"https://api.github.com/repos/{owner}/{repo}/readme", headers=self.headers)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data.get("content", "")
                    encoding = data.get("encoding", "")
                    if encoding == "base64":
                        return base64.b64decode(content).decode("utf-8", errors="ignore")
                    return content
            except Exception:
                pass
        return None

    async def detect_manifest_technologies(self, owner: str, repo: str) -> List[str]:
        technologies = set()
        manifest_files = [
            "package.json", "requirements.txt", "pyproject.toml", "Cargo.toml", "go.mod"
        ]
        aliases = {
            "react": "React",
            "react-dom": "React",
            "react-native": "React Native",
            "next": "Next.js",
            "fastapi": "FastAPI",
            "uvicorn": "Uvicorn",
            "langgraph": "LangGraph",
            "langchain": "LangChain",
            "supabase": "Supabase",
            "@supabase/supabase-js": "Supabase",
            "typescript": "TypeScript",
            "tailwindcss": "Tailwind CSS",
            "vite": "Vite",
            "express": "Express",
            "pydantic": "Pydantic",
            "openai": "OpenAI SDK",
            "pytest": "Pytest",
            "docker": "Docker"
        }

        async with httpx.AsyncClient(timeout=8.0) as client:
            for m in manifest_files:
                try:
                    url = f"https://raw.githubusercontent.com/{owner}/{repo}/main/{m}"
                    resp = await client.get(url, headers=self.headers)
                    if resp.status_code != 200:
                        url = f"https://raw.githubusercontent.com/{owner}/{repo}/master/{m}"
                        resp = await client.get(url, headers=self.headers)
                    
                    if resp.status_code == 200:
                        content = resp.text.lower()
                        for alias_key, pretty_name in aliases.items():
                            if alias_key in content:
                                technologies.add(pretty_name)
                except Exception:
                    continue

        return sorted(list(technologies))

    def generate_architecture_nodes(self, summary: RepositorySummary, tech: List[str], readme: Optional[str]) -> List[Dict[str, Any]]:
        nodes = []
        name = summary.name.lower()
        
        # Determine Frontend node
        if any(t in tech for t in ["Next.js", "React", "TypeScript", "Vite"]) or (summary.language in ["TypeScript", "JavaScript", "HTML"]):
            fe_tech = [t for t in tech if t in ["Next.js", "React", "TypeScript", "Tailwind CSS"]] or [summary.language or "Web UI"]
            nodes.append({
                "id": "fe",
                "label": f"Client / Interface ({', '.join(fe_tech)})",
                "type": "frontend",
                "status": "verified"
            })
            
        # Determine Backend / API node
        if any(t in tech for t in ["FastAPI", "Express", "LangGraph", "Uvicorn", "Python"]) or (summary.language in ["Python"]):
            be_tech = [t for t in tech if t in ["FastAPI", "LangGraph", "Express", "Python"]] or ["API Service"]
            nodes.append({
                "id": "be",
                "label": f"Service Engine ({', '.join(be_tech)})",
                "type": "backend",
                "status": "verified"
            })
            
        # Determine Data / Storage / External services
        if "Supabase" in tech or (readme and "supabase" in readme.lower()):
            nodes.append({
                "id": "db",
                "label": "Supabase (PostgreSQL & Vector Store)",
                "type": "database",
                "status": "verified"
            })
            
        if any(t in tech for t in ["LangGraph", "OpenAI SDK", "LangChain"]) or (readme and ("agent" in readme.lower() or "model" in readme.lower())):
            nodes.append({
                "id": "ai",
                "label": "Agentic Reasoning Pipeline",
                "type": "ai_engine",
                "status": "verified"
            })

        if not nodes:
            nodes.append({
                "id": "core",
                "label": f"{summary.name} Core ({summary.language or 'Codebase'})",
                "type": "monolith",
                "status": "verified"
            })

        return nodes

github_service = GitHubService()
