# V.E.R.A. // Voice-Enabled Reconnaissance & Assistance
### Cinematic Personal Engineering Intelligence & Command Deck

**Operator:** Prathmesh Mante (`prathmeshmante-glitch`)  
**Live Frontend:** [https://prathmeshmante-glitch.github.io](https://prathmeshmante-glitch.github.io)  
**Profile:** [https://github.com/prathmeshmante-glitch](https://github.com/prathmeshmante-glitch)

---

## 1. System Overview

**V.E.R.A.** (Voice-Enabled Reconnaissance & Assistance) is an original, voice-first personal engineering companion inspired by the composed, capable, and subtly witty demeanor of JARVIS from *Iron Man*. 

Rather than serving as an inert static portfolio or an artificial chatbot, V.E.R.A. provides:
- **Cinematic Command Deck**: A dark obsidian, reactor gold, and telemetry cyan HUD featuring concentric 3D rotating rings, responsive audio waveforms, and interactive system diagnostics.
- **Voice-First Passphrase Gate**: Ceremonial voice authorization handshake requiring the spoken command phrase (`Open the command deck`) with phonetic tolerance and graceful recovery.
- **Live GitHub Intelligence**: Discovers real public repositories (`brandforge`, `inkloom`, `prathmeshmante-glitch.github.io`), extracts live README documentation, parses dependency manifests (`package.json`, `requirements.txt`), and generates architectural topographies.
- **Dual-Mode AI Architecture**: Operates with a private Python FastAPI backend supporting open-ended LLM reasoning (OpenAI, Gemini, OpenRouter), while gracefully falling back to a deterministic **Honest Degraded Mode** on static GitHub Pages when no API credentials are present.

---

## 2. Architecture & 9 Core Systems

```
┌──────────────────────────────────────────────────────────────┐
│                    V.E.R.A. COMMAND DECK                     │
│               (HTML5 / CSS3 / Vanilla JS HUD)                │
└──────────────┬───────────────────────────────┬───────────────┘
               │                               │
       (Local/Depl. API)               (Client Fallback)
               ▼                               ▼
┌──────────────────────────────┐   ┌───────────────────────────┐
│     FASTAPI AI BACKEND       │   │   GITHUB PUBLIC REST API  │
│  - Multi-Provider LLM Engine │   │  - Repositories & Stars   │
│  - Grounded Context Builder  │   │  - Raw README Extraction  │
│  - Memory & Diagnostics Hub  │   │  - Dependency Manifests   │
└──────────────┬───────────────┘   └───────────────────────────┘
               ▼
┌──────────────────────────────┐
│     AI REASONING ENGINE      │
│  OpenAI / Gemini / Degraded  │
└──────────────────────────────┘
```

The interface is organized into 9 coordinated functional systems:

1. **System 01 — V.E.R.A. Core**: Voice input, push-to-talk, feminine English voice synthesis, conversation log, technical transcript, and text command fallback.
2. **System 02 — Mission Archive**: Real-time public repository grid loaded from GitHub API with live search, language filters, and deep-linking support (`?repo=prathmeshmante-glitch/brandforge`).
3. **System 03 — Engineering Intelligence**: Factual deep-dives into project architecture, technical trade-offs, and senior engineering code review topics.
4. **System 04 — Project Architecture View**: Interactive SVG topology diagram revealing component flows between Client, Service Engine, Agent Reasoning Pipelines, and Persistence layers.
5. **System 05 — Tech Matrix**: Evidence-based dependency visualization extracted directly from `package.json` and `requirements.txt` manifests.
6. **System 06 — Memory & Persona Matrix**: Preference ledger tracking visitor forms of address, explanation depth, and voice parameters with full clear/delete controls.
7. **System 07 — System Diagnostics HUD**: Live telemetry displaying browser Web Speech API status, microphone permissions, backend health, and GitHub rate limits.
8. **System 08 — Personal Briefing**: On-demand executive situational report summarizing active repositories and system status.
9. **System 09 — Settings & Access**: Voice engine picker, speaking speed slider, Web Audio SFX chimes toggle, reduced-motion accessibility, and session re-lock.

---

## 3. Root Cause Analysis of Voice Startup Issue & Resolution

### Root Cause in Previous Implementation:
1. **Unmanaged Recognition Lifecycle & Race Conditions**: The prior script did not cleanly abort existing `SpeechRecognition` instances before creating new ones. In Chromium browsers, calling `.start()` while an aborted or ended instance was still tearing down the OS microphone pipe threw `DOMException: recognition has already started` or left the session dead.
2. **TTS / Microphone Audio Collision**: The previous voice authorization routine spoke error prompts over an active microphone session. The speech recognition engine transcribed V.E.R.A.'s own spoken voice, immediately triggering authorization rejection loops.
3. **Scroll Lock & Modal Trapping**: The CSS rule `body:not(.authorized) { overflow: hidden; }` combined with blurred backgrounds left visitors completely stranded if the browser blocked microphone permissions or lacked SpeechRecognition support.
4. **Brittle Exact String Matching**: Transcripts from Indian English accents (`en-IN`) frequently produce harmless variations (`Pratt`, `Prath`, `Prathmesh`, `Brad`, `P-R-A-T`) or trailing punctuation (`Prat.`), which failed strict string equality.

### Engineering Fixes Implemented:
- **Explicit State Machine**: Implemented `idle` ➔ `initializing` ➔ `listening` ➔ `transcribing` ➔ `thinking` ➔ `speaking` with synchronized UI indicators and clean error states.
- **Audio Collision Prevention**: Calls `speechSynthesis.cancel()` prior to any recognition start, and disables microphone capture during speech output.
- **Phrase-based Recognition**: Recognizes “Open the command deck” using key words and available alternate speech transcripts, reducing failures caused by brittle exact matching.
- **Resilient Recovery**: Added an explicit retry mechanism without page reloads, actionable permission guidance, and a direct link to public GitHub repositories so no user is ever locked out.

---

## 4. Local Installation & Startup

### Prerequisites:
- Python 3.10+ (tested on Python 3.14)
- Google Chrome or Microsoft Edge (for full Web Speech API voice interaction)

### 1. Clone or Open Workspace
```bash
cd c:\Users\DELL\Downloads\aura-github-starter
```

### 2. Configure Environment Variables (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(If no API key is supplied, V.E.R.A. will operate in Honest Degraded Mode using verified repository metadata)*.

### 3. Start the Backend API (FastAPI)
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API will be available at `http://127.0.0.1:8000` with interactive OpenAPI docs at `http://127.0.0.1:8000/docs`.

### 4. Serve the Frontend Command Deck
In a separate terminal:
```bash
# From workspace root
python -m http.server 5500
```
Open your browser at `http://127.0.0.1:5500/index.html`.

---

## 5. Environment Variables Reference

| Variable | Description | Default |
|---|---|---|
| `AI_API_KEY` | API key for OpenAI, OpenRouter, Groq, etc. | `None` (triggers Degraded Mode) |
| `AI_MODEL` | Model identifier | `gpt-4o-mini` |
| `AI_BASE_URL` | Base URL for OpenAI-compatible endpoint | `https://api.openai.com/v1` |
| `GEMINI_API_KEY`| Optional Google Gemini API Key | `None` |
| `GITHUB_TOKEN` | Optional GitHub Personal Access Token (raises rate limit from 60 to 5000 req/hr) | `None` |
| `OPERATOR_NAME` | Name of the system operator | `Prathmesh Mante` |
| `GITHUB_USERNAME` | Target GitHub user for public reconnaissance | `prathmeshmante-glitch` |
| `VERA_PASSPHRASE` | Demonstration voice gate phrase | `Open the command deck` |
| `PORT` | Backend server port | `8000` |
| `FRONTEND_ORIGIN`| Allowed CORS origin | `*` |

---

## 6. Test Suite & Verification Results

### Backend Automated Unit Tests (`backend/tests/test_api.py`)
Run with pytest:
```bash
python -m pytest backend/tests/test_api.py -v
```
**Results:** `7 passed, 0 failed in 8.17s`
- `test_health_check`: PASSED
- `test_system_diagnostics`: PASSED
- `test_get_repositories`: PASSED
- `test_chat_greeting_deterministic`: PASSED
- `test_chat_brandforge_inquiry`: PASSED
- `test_situational_briefing`: PASSED
- `test_memory_lifecycle`: PASSED

### End-to-End System Acceptance Tests (`tests/test_full_system.py`)
Run with python:
```bash
python tests/test_full_system.py
```
**Results:** `All 7 verification suites PASSED`
- `[PASS]` Frontend `index.html` loaded and verified all 10 core system elements.
- `[PASS]` Frontend `style.css` loaded and verified color tokens and HUD styling.
- `[PASS]` Frontend `script.js` loaded and verified passphrase and voice state machine.
- `[PASS]` Hologram core asset verified (`1,076,090 bytes`).
- `[PASS]` Backend `/health` verified.
- `[PASS]` Backend `/api/system/diagnostics` verified.
- `[PASS]` Backend `/api/assistant/chat` verified (Grounded repo inquiry).

---

## 7. Deployment Instructions

### A. Deploying Frontend to GitHub Pages (`prathmeshmante-glitch.github.io`)
1. Ensure `index.html`, `style.css`, `script.js`, and `assets/` are located at the root of the repository.
2. In the GitHub repository settings for `prathmeshmante-glitch.github.io`:
   - Go to **Settings** > **Pages**.
   - Under **Build and deployment**, set source to **Deploy from a branch**, branch `main`, folder `/(root)`.
   - Click **Save**.
3. V.E.R.A. will run live with full client-side speech synthesis, voice recognition, Web Audio SFX, and live GitHub REST intelligence!

### B. Deploying Backend (Render / Railway / Fly.io / VPS)
1. Push the `/backend` directory to your repository or container host.
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Configure environment secrets in host dashboard (`AI_API_KEY`, `GITHUB_TOKEN`).
5. Update `CONFIG.BACKEND_URL` in `script.js` to point to your live backend domain (e.g., `https://vera-api.onrender.com`).

---

## 8. Known Limitations & Recommendations

1. **Browser Speech Recognition**:
   - Web Speech API (`SpeechRecognition`) is natively supported on Google Chrome, Microsoft Edge, and Chromium-based browsers. Firefox and Safari desktop do not support speech recognition without experimental flags; in those browsers, V.E.R.A. provides clear instructions and fallback text controls.
2. **Microphone over Insecure Contexts**:
   - Browsers strictly disallow microphone access over unencrypted HTTP (except `localhost`). When testing across local networks or public domains, ensure HTTPS is enabled.
3. **GitHub API Rate Limits**:
   - Unauthenticated GitHub API calls are limited to 60 requests per hour per IP. For high traffic, add a `GITHUB_TOKEN` to the backend `.env` to expand this to 5,000 requests per hour.
