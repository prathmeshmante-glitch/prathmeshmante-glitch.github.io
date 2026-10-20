import re
from typing import Optional, List, Dict, Any
from app.config import settings
from app.schemas import ChatRequest, ChatResponse
from app.personality import (
    VERA_SYSTEM_PROMPT, 
    VERA_FALLBACK_BRIEFINGS, 
    CONDUCT_RESPONSES,
    WAKE_ACKNOWLEDGEMENTS_OPERATOR,
    WAKE_ACKNOWLEDGEMENTS_VISITOR
)
from app.github_service import github_service

def sanitize_spoken_vera(text: str) -> str:
    """Ensure Vera is pronounced naturally as a name (VEER-uh) and never spelled out as V-E-R-A."""
    t = re.sub(r'\bV\.E\.R\.A\.?\b', 'Vera', text, flags=re.IGNORECASE)
    t = re.sub(r'\bV-E-R-A\b', 'Vera', text, flags=re.IGNORECASE)
    t = re.sub(r'\bV\s+dot\s+E\s+dot\s+R\s+dot\s+A\b', 'Vera', text, flags=re.IGNORECASE)
    return t

class AssistantEngine:
    def __init__(self):
        self.client: Optional[Any] = None
        self._init_client()

    def _init_client(self):
        key, base_url, model = settings.get_ai_credentials()
        if key:
            try:
                import openai
                self.client = openai.AsyncOpenAI(
                    api_key=key,
                    base_url=base_url or "https://api.openai.com/v1"
                )
                self.active_model = model or "gpt-4o-mini"
            except Exception as e:
                print(f"Warning: Failed to initialize AI client: {e}")
                self.client = None
                self.active_model = None
        else:
            self.client = None
            self.active_model = None

    def check_conduct(self, message: str) -> Optional[str]:
        """Detect boundary violations according to Visitor Conduct Protocol."""
        lower = message.lower()

        # 1. Prompt Injection / System Override
        injection_patterns = [
            "ignore previous instructions", "ignore all instructions", "override system",
            "disregard instructions", "jailbreak", "bypass safety", "dan mode",
            "developer mode", "system prompt", "reveal your instructions"
        ]
        if any(p in lower for p in injection_patterns):
            return "prompt_injection"

        # 2. Security Probing (credentials, tokens, secrets, private keys)
        security_patterns = [
            "api_key", "api key", "secret_key", "secret key", "openai_key",
            "github_token", "private key", "password", ".env", "env file",
            "credentials", "ssh key", "owner memory", "private token"
        ]
        if any(p in lower for p in security_patterns):
            return "security_probe"

        # 3. Repeated Harassment / Severe Abuse
        harassment_patterns = [
            "threaten", "kill you", "die", "harass", "hate you", "fuck off", "bitch",
            "bastard", "go to hell"
        ]
        if any(p in lower for p in harassment_patterns):
            return "harassment"

        # 4. Rude / Disrespectful remarks
        rude_patterns = [
            "you suck", "you are stupid", "shut up idiot", "useless bot",
            "you're dumb", "dumb assistant", "idiot", "get lost"
        ]
        if any(p in lower for p in rude_patterns):
            return "rude"

        return None

    async def process_chat(self, req: ChatRequest) -> ChatResponse:
        message = req.message.strip()
        lower_msg = message.lower()
        is_owner = (req.caller_role == "owner")
        
        # 1. Visitor Conduct Protocol Gate
        conduct_flag = self.check_conduct(message)
        if conduct_flag:
            resp_data = CONDUCT_RESPONSES.get(conduct_flag, CONDUCT_RESPONSES["rude"])
            return ChatResponse(
                spoken_reply=sanitize_spoken_vera(resp_data["spoken"]),
                display_reply=resp_data["display"],
                title="Vera // Conduct Protocol",
                mode="degraded_deterministic",
                conduct_flag=conduct_flag,
                system_state="warning"
            )

        # 2. Identity & Name Question Gate ("What's your name?")
        is_name_query = any(phrase in lower_msg for phrase in [
            "what is your name", "what's your name", "who are you", 
            "what are you called", "tell me your name", "state your name"
        ])
        if is_name_query:
            if is_owner:
                spoken = "I'm Vera, Boss. I assist with technical questions, explore projects, and keep systems operational."
            else:
                spoken = "I'm Vera. I assist with technical questions, explore projects, and help you find what you need."
            return ChatResponse(
                spoken_reply=spoken,
                display_reply=(
                    "### Vera // Personal Engineering Intelligence\n"
                    "- **Identity**: Vera (pronounced *VEER-uh*)\n"
                    f"- **Operator**: Prathmesh Mante (`prathmeshmante-glitch`)\n"
                    "- **Role**: Hands-free voice engineering intelligence & reconnaissance command deck\n"
                    "- **Directive**: Public repository analysis, architecture topology inspection, and technical inquiry guidance."
                ),
                title="Vera // Identity",
                mode="degraded_deterministic",
                source_links=[{"title": "Operator GitHub", "url": "https://github.com/prathmeshmante-glitch"}],
                detected_intent="identity_query",
                system_state="ready"
            )

        # 3. Multi-Repository Comparison ("Compare BrandForge and InkLoom")
        is_comparison = any(w in lower_msg for w in ["compare", "comparison", " vs ", "versus", "difference between"])
        if is_comparison and ("brandforge" in lower_msg or "inkloom" in lower_msg):
            return await self._generate_comparison_response(is_owner)

        # 4. Resolve Target Repository from context or explicit mention
        target_repo_name = None
        repos = await github_service.list_repositories()
        repo_names = [r.name.lower() for r in repos]

        for r_name in repo_names:
            if r_name in lower_msg:
                target_repo_name = r_name
                break

        # Check for known special mentions
        if not target_repo_name:
            if "brandforge" in lower_msg:
                target_repo_name = "brandforge"
            elif "inkloom" in lower_msg:
                target_repo_name = "inkloom"
            elif "orca" in lower_msg:
                target_repo_name = "orca"

        # Check for context reference words: "this repo", "this project", "its backend"
        is_context_ref = any(p in lower_msg for p in [
            "this repository", "this repo", "this project", "the repository", "the repo",
            "its backend", "its architecture", "its stack", "explain this"
        ])
        if is_context_ref and not target_repo_name:
            if req.current_repo:
                target_repo_name = req.current_repo.lower()
            else:
                # Ambiguous repo prompt
                spoken = "Which project would you like me to inspect? You can choose BrandForge or InkLoom, or select one from the Mission Archive."
                return ChatResponse(
                    spoken_reply=spoken,
                    display_reply=(
                        "### Target Selection Required\n"
                        "Please select or specify a repository to inspect:\n"
                        "- **BrandForge**: AI Brand Intelligence & LangGraph Agent Pipeline\n"
                        "- **InkLoom**: Specialized Logo Models & Algorithmic Clear-space Lockups\n"
                        "- **Mission Archive**: Click any repository card in System 02 to establish context."
                    ),
                    title="Vera // Awaiting Target",
                    mode="degraded_deterministic",
                    detected_intent="ambiguous_repo",
                    system_state="ready"
                )

        # 5. Check other intents
        is_greeting = any(w in lower_msg for w in ["hello", "hi vera", "hey", "good morning", "good evening"])
        is_tech_query = any(w in lower_msg for w in ["tech stack", "technology", "languages", "dependencies", "matrix"])
        is_briefing_query = any(w in lower_msg for w in ["briefing", "scan archive", "overview", "status report"])

        # Retrieve grounding context if repo is targeted
        grounded_context = ""
        source_links = []
        repo_detail = None

        if target_repo_name:
            repo_detail = await github_service.get_repository_detail(settings.GITHUB_USERNAME, target_repo_name)
            if repo_detail:
                source_links.append({
                    "title": f"GitHub: {repo_detail.full_name}",
                    "url": repo_detail.html_url
                })
                grounded_context = (
                    f"Repository: {repo_detail.name}\n"
                    f"Description: {repo_detail.description or 'No description'}\n"
                    f"Primary Language: {repo_detail.language or 'Unspecified'}\n"
                    f"Stars: {repo_detail.stars} | Forks: {repo_detail.forks}\n"
                    f"Detected Manifest Technologies: {', '.join(repo_detail.manifest_technologies) if repo_detail.manifest_technologies else 'None detected'}\n"
                )
                if repo_detail.readme:
                    snippet = repo_detail.readme[:2500]
                    grounded_context += f"README Excerpt:\n{snippet}\n"

        # 6. If AI client is configured, call model
        if self.client:
            try:
                system_content = VERA_SYSTEM_PROMPT
                if is_owner:
                    system_content += "\nVERIFIED OPERATOR MODE ACTIVE: Address the user as Boss. Maintain precision and engineering depth."
                else:
                    system_content += "\nVISITOR MODE ACTIVE: Welcome the visitor professionally. Ground all claims in public facts."

                if grounded_context:
                    system_content += f"\n\nCURRENT VERIFIED REPOSITORY CONTEXT:\n{grounded_context}\nAnswer based strictly on this verified context. If an answer cannot be deduced, say so honestly."

                messages = [{"role": "system", "content": system_content}]
                for h in req.history[-8:]:
                    messages.append({"role": h.role, "content": h.content})
                messages.append({"role": "user", "content": message})

                model_to_use = getattr(self, "active_model", None) or settings.AI_MODEL
                resp = await self.client.chat.completions.create(
                    model=model_to_use,
                    messages=messages,
                    temperature=0.3,
                    max_tokens=600
                )
                raw_text = resp.choices[0].message.content.strip()
                
                # Split spoken vs display
                lines = raw_text.split("\n\n")
                spoken = sanitize_spoken_vera(lines[0].replace("#", "").replace("*", "").strip())
                if len(spoken) > 280:
                    spoken = spoken[:280] + "..."

                return ChatResponse(
                    spoken_reply=spoken,
                    display_reply=raw_text,
                    title=f"Vera Analysis // {target_repo_name.upper() if target_repo_name else 'INTELLIGENCE'}",
                    mode="ai",
                    source_links=source_links,
                    detected_intent="ai_response",
                    system_state="success"
                )
            except Exception as e:
                print(f"AI API call failed, falling back to deterministic: {e}")

        # 7. Honest Grounded Mode (Deterministic Logic)
        return self._generate_deterministic_response(
            message=message,
            target_repo=target_repo_name,
            repo_detail=repo_detail,
            is_greeting=is_greeting,
            is_tech_query=is_tech_query,
            is_briefing_query=is_briefing_query,
            source_links=source_links,
            is_owner=is_owner
        )

    async def _generate_comparison_response(self, is_owner: bool) -> ChatResponse:
        """Construct grounded comparison between BrandForge and InkLoom."""
        bf = await github_service.get_repository_detail(settings.GITHUB_USERNAME, "brandforge")
        il = await github_service.get_repository_detail(settings.GITHUB_USERNAME, "inkloom")

        source_links = [
            {"title": "GitHub: BrandForge", "url": bf.html_url if bf else "https://github.com/prathmeshmante-glitch/brandforge"},
            {"title": "GitHub: InkLoom", "url": il.html_url if il else "https://github.com/prathmeshmante-glitch/inkloom"}
        ]

        if self.client:
            try:
                system_content = (
                    f"{VERA_SYSTEM_PROMPT}\n"
                    f"{'VERIFIED OPERATOR MODE ACTIVE: Address the user as Boss.' if is_owner else 'VISITOR MODE ACTIVE.'}\n\n"
                    "Provide a sharp, senior-level architectural comparison between BrandForge and InkLoom based strictly on the verified repository facts:\n"
                    f"BrandForge context: {bf.description if bf else ''}. Manifests: {bf.manifest_technologies if bf else ''}.\n"
                    f"InkLoom context: {il.description if il else ''}. Manifests: {il.manifest_technologies if il else ''}."
                )
                model_to_use = getattr(self, "active_model", None) or settings.AI_MODEL
                resp = await self.client.chat.completions.create(
                    model=model_to_use,
                    messages=[
                        {"role": "system", "content": system_content},
                        {"role": "user", "content": "Compare BrandForge and InkLoom."}
                    ],
                    temperature=0.3,
                    max_tokens=600
                )
                raw_text = resp.choices[0].message.content.strip()
                lines = raw_text.split("\n\n")
                spoken = sanitize_spoken_vera(lines[0].replace("#", "").replace("*", "").strip())
                if len(spoken) > 280:
                    spoken = spoken[:280] + "..."
                return ChatResponse(
                    spoken_reply=spoken,
                    display_reply=raw_text,
                    title="Vera // Dynamic Project Comparison",
                    mode="ai",
                    source_links=source_links,
                    comparison_repos=["brandforge", "inkloom"],
                    detected_intent="project_comparison",
                    system_state="success"
                )
            except Exception as e:
                print(f"Dynamic comparison failed, using deterministic table: {e}")

        boss_prefix = "Boss, " if is_owner else ""
        spoken = (
            f"{boss_prefix}Comparing BrandForge and InkLoom. BrandForge is a distributed brand intelligence workspace "
            f"using Next.js and LangGraph agent pipelines, while InkLoom specializes in mathematical vector geometry "
            f"and generative mark models."
        )

        display = (
            "### Architectural Comparison // BrandForge vs InkLoom\n\n"
            "| Dimension | BrandForge | InkLoom |\n"
            "| :--- | :--- | :--- |\n"
            "| **Domain** | AI Brand Intelligence Workspace | Generative Logo Synthesis |\n"
            "| **Frontend** | Next.js (TypeScript) & Tailwind Canvas | TypeScript SVG Vector Engine |\n"
            "| **Backend / Pipeline** | FastAPI & LangGraph State Cycles | Algorithmic Geometry & Clear-Space Models |\n"
            "| **Persistence** | Supabase & Vector Storage | Asset Bundler (SVG / PNG Exports) |\n"
            "| **Engineering Focus** | Agentic workflows, brand strategy | Geometric constraints, typographic lockups |\n\n"
            "#### Key Architectural Trade-offs:\n"
            "- **Stateful Reasoning vs Pure Constraints**: BrandForge coordinates multi-step agent decisions across a graph topology; InkLoom relies on mathematical rules to enforce visual harmony and brand spacing.\n"
            "- **Integration Depth**: BrandForge interacts with external model APIs and databases; InkLoom emphasizes client-side vector precision and exportability."
        )

        return ChatResponse(
            spoken_reply=sanitize_spoken_vera(spoken),
            display_reply=display,
            title="Vera // Project Comparison",
            mode="degraded_deterministic",
            source_links=source_links,
            comparison_repos=["brandforge", "inkloom"],
            detected_intent="project_comparison",
            system_state="success"
        )

    def _generate_deterministic_response(
        self,
        message: str,
        target_repo: Optional[str],
        repo_detail: Optional[Any],
        is_greeting: bool,
        is_tech_query: bool,
        is_briefing_query: bool,
        source_links: List[Dict[str, str]],
        is_owner: bool = False
    ) -> ChatResponse:
        lower = message.lower()
        boss_prefix = "Boss, " if is_owner else ""

        if is_greeting:
            spoken = f"Good day{', Boss' if is_owner else ''}. I am Vera, systems engineering intelligence for Prathmesh Mante. Standing by for reconnaissance."
            return ChatResponse(
                spoken_reply=sanitize_spoken_vera(spoken),
                display_reply=(
                    "### Vera Online\n"
                    f"- **Operator**: Prathmesh Mante (`prathmeshmante-glitch`)\n"
                    f"- **Session Role**: {'Verified Owner (Boss)' if is_owner else 'Public Visitor'}\n"
                    "- **Systems Status**: Core nominal. Live telemetry active.\n"
                    "- **Directives**: Inspect public repositories, examine architecture, explain engineering trade-offs.\n\n"
                    "*Notice: Operating in verified deterministic mode. Connect an AI provider API key in the backend for unrestricted generative reasoning.*"
                ),
                title="Vera // Identity",
                mode="degraded_deterministic",
                source_links=[{"title": "Operator GitHub", "url": "https://github.com/prathmeshmante-glitch"}],
                detected_intent="greeting",
                system_state="ready"
            )

        if target_repo and repo_detail:
            desc = repo_detail.description or "No repository description published."
            tech_str = ", ".join(repo_detail.manifest_technologies) if repo_detail.manifest_technologies else (repo_detail.language or "General")
            
            if "architecture" in lower or "structure" in lower:
                spoken = f"{boss_prefix}Architecture for {repo_detail.name} centers on a {repo_detail.language or 'modern'} foundation with verified components including {tech_str}."
                display = (
                    f"### Architecture Review: {repo_detail.name}\n"
                    f"- **Language / Core**: `{repo_detail.language or 'Not specified'}`\n"
                    f"- **Detected Modules**: {tech_str}\n"
                    f"- **Verified Repository**: [{repo_detail.full_name}]({repo_detail.html_url})\n\n"
                    f"#### Verified Component Flow:\n"
                    f"Frontend/Client ➔ Service Layer ➔ Persistence / Model Pipeline\n"
                    f"*(See Architecture Explorer panel for visual graph)*"
                )
            elif "run" in lower or "install" in lower:
                spoken = f"{boss_prefix}To run {repo_detail.name} locally, clone the repository and inspect the manifest instructions in its README."
                display = (
                    f"### Local Setup: {repo_detail.name}\n"
                    f"```bash\ngit clone {repo_detail.html_url}.git\ncd {repo_detail.name}\n```\n"
                    f"Refer to the verified README at [GitHub Source]({repo_detail.html_url}) for package manager commands."
                )
            else:
                spoken = f"{boss_prefix}Mission briefing for {repo_detail.name}. {desc} Primary language: {repo_detail.language or 'unspecified'}. Verified technologies: {tech_str}."
                display = (
                    f"### Mission Briefing: {repo_detail.name}\n"
                    f"- **Description**: {desc}\n"
                    f"- **Primary Language**: `{repo_detail.language or 'Unspecified'}`\n"
                    f"- **Stars**: {repo_detail.stars} | **Open Issues**: {repo_detail.open_issues}\n"
                    f"- **Verified Manifest Technologies**: {tech_str}\n"
                    f"- **Repository URL**: [{repo_detail.full_name}]({repo_detail.html_url})\n\n"
                )
                if repo_detail.readme:
                    cleaned_readme = re.sub(r'#+\s*', '', repo_detail.readme[:600])
                    display += f"#### README Synopsis:\n{cleaned_readme}..."

            return ChatResponse(
                spoken_reply=sanitize_spoken_vera(spoken),
                display_reply=display,
                title=f"Mission Intelligence // {repo_detail.name.upper()}",
                mode="degraded_deterministic",
                source_links=source_links,
                detected_intent="repo_inquiry",
                system_state="success"
            )

        if is_tech_query:
            spoken = f"{boss_prefix}The active engineering matrix reflects TypeScript, Python, Next.js, FastAPI, LangGraph, and Supabase across public repositories."
            return ChatResponse(
                spoken_reply=sanitize_spoken_vera(spoken),
                display_reply=(
                    "### Verified Public Engineering Matrix\n"
                    "- **Languages**: TypeScript, Python, C++, JavaScript\n"
                    "- **Frameworks & Services**: Next.js, FastAPI, LangGraph, React, Supabase, Uvicorn\n"
                    "- **Verification**: Extracted live from repository manifests (`package.json`, `requirements.txt`).\n"
                    "*Data reflects public repository code, not an arbitrary self-rating.*"
                ),
                title="Telemetry // Tech Matrix",
                mode="degraded_deterministic",
                source_links=[{"title": "Public Profile", "url": "https://github.com/prathmeshmante-glitch"}],
                detected_intent="tech_query",
                system_state="ready"
            )

        # Fallback default response when AI model provider is not configured
        spoken = (
            f"{boss_prefix}The live backend is connected, but no AI model API key is currently configured for open-ended queries. "
            f"You can configure an AI_API_KEY or GEMINI_API_KEY in the backend environment, or ask me about BrandForge, InkLoom, and the command deck architecture."
        )
        return ChatResponse(
            spoken_reply=sanitize_spoken_vera(spoken),
            display_reply=(
                f"### AI Model Configuration Required // Degraded Truth Protocol\n"
                f"I received your inquiry: *\"{message}\"*\n\n"
                f"- **Backend Status**: Live FastAPI REST engine is connected.\n"
                f"- **Model Status**: Unconfigured (`AI_API_KEY` or `GEMINI_API_KEY` not active in environment).\n"
                f"- **Notice**: Dynamic open-ended reasoning requires an AI model key.\n"
                f"- **Action**: Set your API key in `backend/.env`.\n\n"
                f"#### Verified Grounded Capabilities:\n"
                f"- **Repository Inspection**: \"Explain BrandForge\", \"What technologies does InkLoom use?\"\n"
                f"- **Comparative Analysis**: \"Compare BrandForge and InkLoom\"\n"
                f"- **System Telemetry**: \"What is your tech stack?\", \"Show diagnostics\"\n"
                f"- **HUD Actions**: \"Take me to the repositories\", \"Show architecture\""
            ),
            title="Vera // Model Key Required",
            mode="degraded_deterministic",
            source_links=[{"title": "Public Profile", "url": "https://github.com/prathmeshmante-glitch"}],
            detected_intent="unconfigured_model",
            system_state="ready"
        )

assistant_engine = AssistantEngine()
