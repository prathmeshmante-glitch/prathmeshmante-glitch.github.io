# V.E.R.A. — Engineering Intelligence System Handover Report

**System:** V.E.R.A. (Voice-Enabled Reconnaissance & Assistance)  
**Operator:** Prathmesh Mante (`prathmeshmante-glitch`)  
**Status:** Online & Fully Verified  
**Date:** October 20, 2026

---

## 1. Executive Summary

The portfolio repository has been transformed from a static starter template into a cinematic, voice-first personal engineering intelligence system inspired by the composed, capable, and subtly witty demeanor of JARVIS from *Iron Man*.

![V.E.R.A. Holographic Neural Core](vera_hologram_core_1792506996718.jpg)

### What Was Built:
1. **Cinematic HUD Command Deck**: Dark obsidian (`#080A0F`), reactor gold (`#F4B95F`), and telemetry cyan (`#66D9E8`) interface featuring 3D multi-axis orbital rings, dynamic 16-bar responsive audio waveforms, telemetry nodes, and glassmorphic panels.
2. **Engineered Voice Subsystem**: Full state-machine (`idle` ➔ `listening` ➔ `transcribing` ➔ `thinking` ➔ `speaking`), keyword-based recognition for the demonstration phrase (`Open the command deck`), acoustic loopback prevention, and prioritized feminine English voice selection (Samantha, Zira, Jenny, Veena, etc.).
3. **Dual-Mode AI Architecture**:
   - **FastAPI Python Backend** (`/backend`): High-speed REST API providing multi-provider LLM orchestration (OpenAI, Gemini, OpenRouter), live GitHub caching, and grounded README retrieval.
   - **Honest Degraded Mode**: When no AI API key is configured or during offline operations, V.E.R.A. remains 100% functional, grounding every architectural explanation in verified public repository metadata and manifests (`package.json`, `requirements.txt`).
4. **9 Operational Systems**: V.E.R.A. Core, Mission Archive (discovering `brandforge` and `inkloom`), Engineering Intelligence, Architecture View (dynamic SVG topology explorer), Tech Matrix, Memory & Personality Ledger, Diagnostics HUD, Personal Briefing, and Settings.
5. **Web Audio Sound Design**: Programmatic Web Audio API synthesizers generating sci-fi chimes, alerts, and clicks with independent mute controls.

---

## 2. Root Cause Analysis of Previous Voice-Gate Failure

### Discovered Vulnerabilities:
- **Uncontrolled Recognition Lifecycles**: The previous script did not cleanly manage `SpeechRecognition` lifecycle states. If an instance failed or was re-triggered before the previous instance finished tearing down the OS microphone capture stream, Chromium threw `DOMException: recognition has already started`, trapping the UI.
- **Acoustic Feedback Collision**: When an authorization attempt failed, the previous script immediately played an error speech prompt while the recognition engine was either still active or restarting. The assistant transcribed its own spoken voice ("Authorization failed..."), immediately failing the subsequent check.
- **Scroll Lock & Modal Isolation**: The CSS rule `body:not(.authorized) { overflow: hidden; }` combined with blurred styling permanently locked the viewport when microphone permissions were blocked or the browser lacked SpeechRecognition support.
- **Brittle String Equality**: Speech recognition with Indian English (`en-IN`) frequently produces phonetic variants (`Pratt`, `Prath`, `Brad`, `P-R-A-T`) or trailing punctuation, which caused false rejections on exact string comparison.

### Corrective Engineering:
- Implemented a unified `SpeechEngine` class with strict state transitions.
- Cancels speech synthesis before starting recognition and disables microphone capture during speech output.
- Applied phonetic and punctuation normalization.
- Provided actionable browser guidance, retry buttons without page reloads, and direct bypass links to public repositories.

---

## 3. Verified Repositories Discovered Live

Live discovery through GitHub's API verified the following repositories for operator `prathmeshmante-glitch`:

| Repository | Primary Language | Description & Key Evidence | Verified Link |
|---|---|---|---|
| **brandforge** | TypeScript | AI brand-intelligence workspace; Next.js, FastAPI, LangGraph, Supabase | [GitHub Source](https://github.com/prathmeshmante-glitch/brandforge) |
| **inkloom** | TypeScript | Specialized generative logo models and vector constraint lockups | [GitHub Source](https://github.com/prathmeshmante-glitch/inkloom) |
| **prathmeshmante-glitch.github.io** | HTML / JS | V.E.R.A. Command Deck; Web Speech, Web Audio, and FastAPI integration | [GitHub Source](https://github.com/prathmeshmante-glitch/prathmeshmante-glitch.github.io) |

---

## 4. Test Execution & Outcomes

### A. Backend Unit & Integration Tests (`backend/tests/test_api.py`)
- **Status:** `18 PASSED, 0 FAILED in 10.39s` (100% passing)
- Verified: Health endpoints, system diagnostics, GitHub repository caching, identity pronunciation (never spells V-E-R-A), operator respect protocol (`Boss`), wake-phrase acknowledgement (`Yes, Boss?` vs `Yes? I'm listening.`), visitor conduct protocol (rude, security probe, prompt injection boundaries), multi-repository comparative reasoning (`brandforge` vs `inkloom`), active repository context resolution (`this repository`), situational briefings, memory lifecycle operations, arbitrary question unconfigured model honesty, dynamic LLM responses, multi-provider credentials, and natural wake-word regex logic.

### B. Full System Acceptance Tests (`tests/test_full_system.py`)
- **Status:** `14 PASSED, 0 FAILED (14/14 Suites)`
- `[PASS]` Frontend `index.html` verified with all core systems and Always-Listening controls.
- `[PASS]` Frontend `style.css` verified with color tokens and Always-Listening HUD styling.
- `[PASS]` Frontend `script.js` verified with `VeraVoiceEngine`, wake-word loop, and command router.
- `[PASS]` Hologram core asset verified (`1,076,090 bytes`).
- `[PASS]` Backend `/health` verified.
- `[PASS]` Backend `/api/assistant/wake-acknowledgement` verified for Operator (`Boss`) and Visitor.
- `[PASS]` Vera Name & Pronunciation rule verified (answers *"I'm Vera"*, never spells V-E-R-A).
- `[PASS]` Visitor Conduct Protocol verified (rude, security probe, prompt injection boundaries).
- `[PASS]` Multi-Repository Comparison verified (`BrandForge` vs `InkLoom` architectural breakdown).
- `[PASS]` Repository Context Resolution verified (ambiguous request prompts target, active repo resolves).
- `[PASS]` Real UI Action Router & Dispatcher verified in frontend `script.js`.
- `[PASS]` Dynamic Intelligence Honest Fallback verified (honestly distinguishes unconfigured AI model).
- `[PASS]` Natural Wake-Word Regex verified in frontend `script.js`.
- `[PASS]` Privacy & Secrets Guard verified (0 API keys or credentials exposed in frontend).

---

## 5. V.E.R.A. Upgrade: JARVIS-Style Always-On Voice & Personality Engine

### Key Features Implemented:
1. **Always-On Wake-Word Subsystem (`VeraVoiceEngine`)**:
   - Managed non-blocking recognition loop listening for wake phrases: `Vera`, `Hey Vera`, `Okay Vera`, `Hi Vera`, `Vira`.
   - Explicit 15-state machine: `disabled`, `requesting_permission`, `initializing`, `standby`, `wake_detected`, `acknowledging`, `capturing_command`, `transcribing`, `processing`, `speaking`, `paused`, `recovering`, `permission_denied`, `unsupported`, `error`.
   - Bounded exponential backoff restart mechanism on silence or service dropouts.
   - Acoustic feedback loop protection: Cleanly aborts recognition before speech synthesis playback, then resumes standby listening with a debounced post-speech cooldown.
2. **Vera Identity & Pronunciation Rules**:
   - Vera introduces herself and refers to herself strictly as **Vera** (pronounced *VEER-uh*).
   - In both text dialogue and spoken output, letter-by-letter acrostic spelling ("V-E-R-A" or "V dot E dot R dot A") is strictly prevented across backend prompts, assistant sanitizers, and frontend UI templates.
3. **Operator Respect & Visitor Protocols**:
   - **Operator (`prathmeshmante-glitch`)**: Addressed respectfully as **Boss** (e.g., *"Yes, Boss?"*, *"The comparison is ready, Boss"*).
   - **Visitor Conduct Protocol**: Calm, professional boundary enforcement for impolite remarks, harassment, credential probing, or prompt injections.
4. **Natural Language Command Router**:
   - Deterministic local routing for immediate operations: stopping speech (*"Stop talking"*), pausing/resuming listening, help, and name queries.
   - Grounded multi-repository comparisons (*"Compare BrandForge and InkLoom"*).
   - Active repository context awareness (*"Explain this repository"*, *"What technologies does it use?"*).
5. **Always-Listening HUD Controls (System 01)**:
   - `ENABLE ALWAYS LISTENING`, `PAUSE LISTENING`, `PUSH TO TALK`, `STOP TALKING`, and `VOICE ON`.
   - Real-time microphone status indicator and synchronized neural orb state animations.

---

## 6. Critical Voice Engine & Dynamic Intelligence Fix

### Root Causes Identified & Resolved:
1. **Natural Spoken Wake-Word Failure**:
   - *Previous Root Cause*: The engine used brittle string matching (`clean === phrase` or `clean.startsWith(...)`) with only a few hardcoded phrases, checked only `results[0][0]` (ignoring hypotheses), hardcoded `rec.lang = 'en-IN'`, and lacked common phonetic transcriptions (`Veera`, `Vira`, `Viera`).
   - *Resolution*: Implemented token-boundary regex matching `\b(?:(?:hey|hi|hello|okay|ok|yo|so|please)\s+)?(?:vera|veera|vira|viera|vierra|v\s+e\s+r\s+a)\b` that scans across all recognition alternatives (`results[0][i]`). Extracts commands spoken in one breath (*"Hey Vera explain BrandForge"*) while strictly rejecting false matches (*"several"*, *"coverage"*, *"veranda"*, *"veteran"*).
2. **Persistent Standby Lifecycle Robustness**:
   - *Previous Root Cause*: When speech synthesis was muted or had empty text, `speak()` returned early without restarting `startStandbyLoop()`. Furthermore, if `retryCount > 2`, the state transitioned to `recovering` while `onend` only restarted when state was strictly `standby`, permanently locking Vera in `recovering`.
   - *Resolution*: Guaranteed transition back to `startStandbyLoop()` regardless of TTS status, speech interruption, or silence timeouts. Allowed `recovering` state to cleanly transition back to `standby` after backoff delay.
3. **Canned Briefing Replacement & Dynamic Reasoning**:
   - *Previous Root Cause*: When no AI key was present or when queries didn't match specific keyword if-else branches, both frontend and backend returned a canned briefing list of example questions pretending to answer.
   - *Resolution*: Upgraded backend to support OpenAI, Google Gemini (via OpenAI-compatible endpoint), Groq, and custom providers (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `AI_API_KEY`). When unconfigured, Vera honestly explains that the AI model key is unconfigured in `backend/.env` rather than returning canned briefings. When configured, queries are dynamically answered by the model with context retention.
4. **Real UI Actions for Repository Commands**:
   - *Resolution*: Implemented `executeUIAction()` in `script.js`. Spoken commands such as *"Take me to the repositories"*, *"Show architecture"*, *"Show diagnostics"*, *"Open settings"*, and *"Show me BrandForge"* execute real DOM navigation, scroll spy updates, topology re-renders, and repository inspections.

