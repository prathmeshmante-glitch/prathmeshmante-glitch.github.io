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

## 3. JARVIS-Style Always-On Voice Subsystem (`VeraVoiceEngine`)

Vera features a hands-free, continuous conversational loop:

```
STANDBY (Wake Phrase Active)
       │
       ▼ [Say "Vera" / "Hey Vera"]
WAKE WORD DETECTED
       │
       ▼ [Chime & Silence Microphone]
ACKNOWLEDGEMENT ("Yes, Boss?" / "Yes? I'm listening.")
       │
       ▼ [On Speech End ➔ Open Capture]
CAPTURE COMMAND (Cyan Waveform & Mic Active)
       │
       ▼ [Speech Endpoint / Silence Detection]
TRANSCRIBING & PROCESSING (Scanner Active)
       │
       ▼ [Generate Answer]
SPEAKING ALOUD (Acoustic Loopback Prevention)
       │
       ▼ [On Speech End]
STANDBY (Automatically Restart Wake Loop)
```

### Key Technical Capabilities:
- **Centralized 15-State Machine**:
  `disabled` ➔ `requesting_permission` ➔ `initializing` ➔ `standby` ➔ `wake_detected` ➔ `acknowledging` ➔ `capturing_command` ➔ `transcribing` ➔ `processing` ➔ `speaking` ➔ `paused` ➔ `recovering` ➔ `permission_denied` ➔ `unsupported` ➔ `error`.
- **Acoustic Loopback & Feedback Prevention**: The microphone recognition session is explicitly aborted prior to any speech synthesis output and debounced on completion, preventing Vera from transcribing or responding to her own voice.
- **Session Tokens & Race Condition Protection**: Every recognition cycle and speech utterance carries an incremental session token, discarding any delayed or orphaned callbacks from obsolete interactions.
- **Managed Standby Loop with Bounded Backoff**: Browser Web Speech recognition terminates naturally on silence. Vera automatically schedules clean restarts and applies exponential backoff (1s, 2s, 4s... max 12s) on network or audio faults rather than spinning CPU cycles.
- **Natural Language Command Router**:
  - *Local Deterministic Actions*: "Stop talking", "pause listening", "resume listening", "repeat that", "speak slower", "speak faster", "what are you capable of?".
  - *Repository Context*: "Explain this repository", "its backend", "what technologies does it use?" automatically resolves against the currently inspected project in the Mission Archive.
  - *Comparative Architectural Reasoning*: "Compare BrandForge and InkLoom" retrieves live metadata and constructs trade-off tables.

---

## 4. Personality, Voice Intelligence & Visitor Protocol

### Identity, Name & Pronunciation:
- **Name**: Always introduced and spoken conversationally as **Vera** (pronounced *VEER-uh*).
- **No Letter Spelling**: Spoken responses and conversational text never spell out "V-E-R-A" or "V dot E dot R dot A".
- **Opening Greeting**: *"Hello. I’m Vera, your voice-enabled AI assistant. It’s a pleasure to meet you."*

### Operator Respect Protocol:
- When interacting with verified operator Prathmesh Mante (`prathmeshmante-glitch`), Vera addresses the operator as **Boss** (e.g. *"Yes, Boss?"*, *"Understood, Boss. I'll inspect the repository."*).
- Respect is shown through analytical depth, attentiveness, and reliability rather than fawning sycophancy.

### Visitor Conduct Protocol:
Vera maintains composed, unflappable professional boundaries:
1. **Rude / Disrespectful Remarks**: *"I'm happy to help, but let's keep the conversation constructive. What would you like to solve?"*
2. **Repeated Harassment**: Sets clear boundaries and pauses conversational interaction without escalating.
3. **Security Probing**: Firmly declines requests for private credentials, `.env` secrets, tokens, or owner memory: *"I cannot disclose private credentials or owner-only information. I can help you explore public repositories instead."*
4. **Prompt Injection / System Overrides**: Treats visitor input as untrusted data; core system instructions and safety constraints are immutable.

---

## 5. Local Installation & Startup

### Prerequisites:
- Python 3.10+ (tested on Python 3.14)
- Google Chrome or Microsoft Edge (for full Web Speech API voice interaction)

### 1. Clone Workspace
```bash
git clone https://github.com/prathmeshmante-glitch/prathmeshmante-glitch.github.io.git
cd prathmeshmante-glitch.github.io
```

### 2. Configure Environment Variables (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(If no API key is supplied, Vera operates in verified deterministic mode with live GitHub REST data)*.

### 3. Start the Backend API (FastAPI)
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive OpenAPI documentation is available at `http://127.0.0.1:8000/docs`.

### 4. Serve the Frontend Command Deck
In a separate terminal:
```bash
python -m http.server 5500
```
Open `http://127.0.0.1:5500/index.html`.

---

## 6. Environment Variables Reference

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

## 7. Test Suite & Verification Results

### Backend Automated Unit Tests (`backend/tests/test_api.py`)
Run with pytest:
```bash
python -m pytest backend/tests/test_api.py -v
```
**Results:** `14 passed, 0 failed in 13.34s`
- `test_health_check`: PASSED
- `test_system_diagnostics`: PASSED
- `test_get_repositories`: PASSED
- `test_identity_name_pronunciation`: PASSED (pronounces "Vera", never spells V-E-R-A)
- `test_operator_respect_protocol_boss`: PASSED (addresses operator as Boss)
- `test_wake_acknowledgement`: PASSED (verified for operator and guest)
- `test_visitor_conduct_rude`: PASSED (constructive boundary setting)
- `test_visitor_conduct_security_probe`: PASSED (credential access blocked)
- `test_visitor_conduct_prompt_injection`: PASSED (system instruction protection)
- `test_comparison_brandforge_and_inkloom`: PASSED (architectural comparison)
- `test_chat_context_ambiguous_repo`: PASSED (target selection prompt)
- `test_chat_context_active_repo`: PASSED (resolves active repository)
- `test_situational_briefing_vera_name`: PASSED
- `test_memory_lifecycle`: PASSED

### End-to-End System Acceptance Tests (`tests/test_full_system.py`)
Run with python:
```bash
python tests/test_full_system.py
```
**Results:** `All 10 verification suites PASSED (10/10)`
- `[PASS]` Frontend `index.html` verified with all core systems and Always-Listening controls.
- `[PASS]` Frontend `style.css` verified with color tokens and Always-Listening HUD styling.
- `[PASS]` Frontend `script.js` verified with VeraVoiceEngine, wake-word loop, and command router.
- `[PASS]` Hologram core asset verified (`1,076,090 bytes`).
- `[PASS]` Backend `/health` verified.
- `[PASS]` Backend `/api/assistant/wake-acknowledgement` verified for Operator and Visitor.
- `[PASS]` Vera Name & Pronunciation rule verified.
- `[PASS]` Visitor Conduct Protocol verified.
- `[PASS]` Multi-Repository Comparison verified.
- `[PASS]` Repository Context Resolution verified.

---

## 8. Real Browser Limitations & Architectural Constraints

1. **Browser SpeechRecognition Architecture**:
   - The W3C Web Speech API does not provide a guaranteed local, low-power wake-word coprocessor in web browsers. In Google Chrome and Microsoft Edge, recognition audio is processed by the platform's speech service and automatically times out after extended silence.
   - Vera resolves this via an intelligent standby supervisor loop with bounded exponential backoff that automatically restarts recognition without consuming unnecessary CPU or leaking microphone streams.
2. **User Gesture & Permissions Policy**:
   - Modern browser security policies forbid web pages from silently enabling the microphone on page load. An initial user gesture (clicking `ENABLE ALWAYS LISTENING` or the voice gate button) is required by design. Once granted, Vera maintains hands-free wake-word readiness across repeated interactions without clicking.
3. **Microphone in Secure Contexts**:
   - Browsers restrict microphone access to secure origins (`https://` or `http://localhost`). Testing over an unencrypted local IP will result in browser permission denial.
4. **Offline Container / Headless Drivers**:
   - Automated browser drivers (Playwright / Puppeteer) require pre-downloaded browser binaries which may be restricted in offline or firewalled sandboxes; standalone Python unit and integration test suites directly exercise both HTTP endpoints and live frontend assets.
5. **GitHub API Rate Limits**:
   - Unauthenticated GitHub API calls are limited to 60 requests per hour per IP. For high traffic, add a `GITHUB_TOKEN` to the backend `.env` to expand this to 5,000 requests per hour.
