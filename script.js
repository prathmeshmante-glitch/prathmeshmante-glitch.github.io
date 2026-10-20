/**
 * V.E.R.A. — Voice-Enabled Reconnaissance & Assistance
 * Master Systems Engine
 * Operator: Prathmesh Mante (prathmeshmante-glitch)
 */

(() => {
  'use strict';

  // --- CONFIGURATION & CONSTANTS ---
  const CONFIG = {
    OPERATOR: 'Prathmesh Mante',
    GITHUB_USER: 'prathmeshmante-glitch',
    PASSPHRASE: 'open the command deck',
    BACKEND_URL: (window.VERA_BACKEND_URL) || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:8000' : ''),
    FALLBACK_REPOS: [
      {
        name: 'brandforge',
        full_name: 'prathmeshmante-glitch/brandforge',
        description: 'An AI brand-intelligence workspace exploring agent workflows, product strategy, and structured outputs.',
        language: 'TypeScript',
        stargazers_count: 1,
        forks_count: 0,
        open_issues_count: 0,
        updated_at: new Date().toISOString(),
        html_url: 'https://github.com/prathmeshmante-glitch/brandforge',
        homepage: 'https://brandforge-jade.vercel.app'
      },
      {
        name: 'inkloom',
        full_name: 'prathmeshmante-glitch/inkloom',
        description: 'Specialised AI models for logo design: constraint-driven brand analysis, vector marks, and clear-space lockups.',
        language: 'TypeScript',
        stargazers_count: 1,
        forks_count: 0,
        open_issues_count: 0,
        updated_at: new Date().toISOString(),
        html_url: 'https://github.com/prathmeshmante-glitch/inkloom',
        homepage: 'https://inkloom.art'
      },
      {
        name: 'prathmeshmante-glitch.github.io',
        full_name: 'prathmeshmante-glitch/prathmeshmante-glitch.github.io',
        description: 'V.E.R.A. cinematic voice-first engineering command deck.',
        language: 'HTML',
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        updated_at: new Date().toISOString(),
        html_url: 'https://github.com/prathmeshmante-glitch/prathmeshmante-glitch.github.io',
        homepage: 'https://prathmeshmante-glitch.github.io'
      }
    ]
  };

  // --- DOM HELPER ---
  const $ = (id) => document.getElementById(id);

  // --- APPLICATION STATE ---
  const state = {
    authorized: false,
    backendOnline: false,
    voiceState: 'idle', // idle, initializing, listening, transcribing, thinking, speaking, muted, error
    soundEnabled: true,
    speechRate: 1.0,
    selectedVoice: null,
    availableVoices: [],
    repositories: [],
    activeRepo: 'brandforge',
    activeFilter: 'all',
    searchQuery: '',
    conversationHistory: [],
    lastAssistantReply: '',
    memoryEnabled: true,
    visitorPreferences: {
      preferredName: 'Visitor',
      explanationDepth: 'concise',
      voiceEnabled: true
    }
  };

  // --- WEB AUDIO SFX SYNTHESIZER ---
  class SoundFX {
    constructor() {
      this.ctx = null;
    }

    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    playTone(freq, duration = 0.1, type = 'sine', gainVal = 0.12) {
      if (!state.soundEnabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        // Silently ignore audio restrictions
      }
    }

    playChime(type = 'ready') {
      if (!state.soundEnabled) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      if (type === 'ready') {
        // Sci-fi arpeggio
        [440, 554.37, 659.25, 880].forEach((freq, idx) => {
          setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.1), idx * 80);
        });
      } else if (type === 'auth_success') {
        // High harmonic confirmation
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          setTimeout(() => this.playTone(freq, 0.2, 'triangle', 0.14), idx * 90);
        });
      } else if (type === 'auth_error') {
        // Low double alert
        this.playTone(220, 0.15, 'sawtooth', 0.15);
        setTimeout(() => this.playTone(180, 0.25, 'sawtooth', 0.18), 120);
      } else if (type === 'click') {
        this.playTone(1200, 0.04, 'sine', 0.05);
      } else if (type === 'listen_start') {
        this.playTone(880, 0.08, 'sine', 0.08);
      }
    }
  }

  const sfx = new SoundFX();

  // --- VERA VOICE ENGINE (JARVIS-STYLE ALWAYS-ON VOICE SUBSYSTEM) ---
  class VeraVoiceEngine {
    constructor() {
      this.recognition = null;
      this.synth = window.speechSynthesis || null;
      this.SpeechRecClass = window.SpeechRecognition || window.webkitSpeechRecognition || null;
      
      // State machine properties
      this.alwaysListening = false;
      this.isPaused = false;
      this.voiceMuted = false;
      this.currentSessionId = 0;
      this.retryCount = 0;
      this.retryTimer = null;
      this.noSpeechNagCount = 0;

      this.initVoices();
    }

    initVoices() {
      if (!this.synth) return;
      const load = () => {
        state.availableVoices = this.synth.getVoices();
        this.selectBestFeminineVoice();
        updateVoicePickerUI();
      };
      load();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = load;
      }
    }

    selectBestFeminineVoice() {
      if (!state.availableVoices.length) return;
      const feminineRegex = /samantha|zira|aria|jenny|susan|karen|moira|tessa|veena|sara|female|woman|google uk english female|natural/i;
      
      let match = state.availableVoices.find(v => feminineRegex.test(v.name) && /^en/i.test(v.lang));
      if (!match) match = state.availableVoices.find(v => /^en-IN/i.test(v.lang));
      if (!match) match = state.availableVoices.find(v => /^en/i.test(v.lang));
      if (!match) match = state.availableVoices[0];

      state.selectedVoice = match;
      if ($('metricVoiceType') && match) {
        $('metricVoiceType').textContent = match.name.split(' ')[0].toUpperCase();
      }
    }

    // --- SANITIZE SPOKEN TEXT (ALWAYS PRONOUNCE VERA AS A NAME, NEVER SPELL V-E-R-A) ---
    sanitizeSpoken(text) {
      if (!text) return '';
      return text
        .replace(/\bV\.E\.R\.A\.?\b/gi, 'Vera')
        .replace(/\bV-E-R-A\b/gi, 'Vera')
        .replace(/\bV\s+dot\s+E\s+dot\s+R\s+dot\s+A\b/gi, 'Vera')
        .replace(/[*#_`>~]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // --- SYNTHESIS LIFECYCLE (NEVER FIGHT RECOGNITION) ---
    speak(text, onEndCallback = null) {
      if (this.voiceMuted || !this.synth) {
        if (onEndCallback) onEndCallback();
        return;
      }

      // Stop recognition immediately before speaking to prevent acoustic loopback
      this.abortRecognition();

      const sessionId = ++this.currentSessionId;
      const cleanSpoken = this.sanitizeSpoken(text);
      if (!cleanSpoken) {
        if (onEndCallback) onEndCallback();
        return;
      }

      try {
        this.synth.cancel();
      } catch (_) {}

      const utterance = new SpeechSynthesisUtterance(cleanSpoken);
      if (state.selectedVoice) utterance.voice = state.selectedVoice;
      utterance.lang = state.selectedVoice ? state.selectedVoice.lang : 'en-IN';
      utterance.rate = state.speechRate || 1.0;
      utterance.pitch = 1.05;

      utterance.onstart = () => {
        if (this.currentSessionId !== sessionId) return;
        setSystemVoiceState('speaking');
        if ($('interruptSpeechBtn')) $('interruptSpeechBtn').disabled = false;
        if ($('stopSpeechBtn')) $('stopSpeechBtn').disabled = false;
      };

      const handleSpeechDone = () => {
        if (this.currentSessionId !== sessionId) return;
        if ($('interruptSpeechBtn')) $('interruptSpeechBtn').disabled = true;
        if ($('stopSpeechBtn')) $('stopSpeechBtn').disabled = true;

        if (onEndCallback) {
          onEndCallback();
        } else {
          // Normal flow: after answering aloud, automatically return to wake-word standby!
          if (this.alwaysListening && !this.isPaused) {
            setTimeout(() => {
              if (this.currentSessionId === sessionId && this.alwaysListening && !this.isPaused) {
                this.startStandbyLoop();
              }
            }, 300); // 300ms acoustic dissipation buffer
          } else {
            setSystemVoiceState('disabled');
          }
        }
      };

      utterance.onend = handleSpeechDone;
      utterance.onerror = (err) => {
        console.warn('Speech synthesis ended with event:', err);
        handleSpeechDone();
      };

      this.synth.speak(utterance);
    }

    stopSpeaking() {
      if (this.synth) {
        this.synth.cancel();
      }
      this.currentSessionId++;
      if ($('interruptSpeechBtn')) $('interruptSpeechBtn').disabled = true;
      if ($('stopSpeechBtn')) $('stopSpeechBtn').disabled = true;

      if (this.alwaysListening && !this.isPaused) {
        this.startStandbyLoop();
      } else {
        setSystemVoiceState(this.alwaysListening ? 'paused' : 'disabled');
      }
    }

    // --- RECOGNITION HELPERS ---
    abortRecognition() {
      if (this.recognition) {
        try {
          this.recognition.onstart = null;
          this.recognition.onresult = null;
          this.recognition.onerror = null;
          this.recognition.onend = null;
          this.recognition.abort();
        } catch (_) {}
        this.recognition = null;
      }
      if (this.retryTimer) {
        clearTimeout(this.retryTimer);
        this.retryTimer = null;
      }
    }

    // --- WAKE-WORD NORMALIZATION & MATCHING ---
    normalizeForWakeWord(text) {
      if (!text) return '';
      return text
        .toLowerCase()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    checkWakeWord(transcript) {
      const clean = this.normalizeForWakeWord(transcript);
      // Support common speech-recognition variants: Vera, Hey Vera, Okay Vera, Vira, V.E.R.A.
      const wakePhrases = [
        'hey vera', 'okay vera', 'ok vera', 'hi vera', 'hello vera',
        'vera', 'vira', 'v e r a'
      ];

      for (const phrase of wakePhrases) {
        if (clean === phrase) {
          return { isWake: true, command: null };
        }
        if (clean.startsWith(phrase + ' ')) {
          const remainder = clean.slice(phrase.length).trim();
          return { isWake: true, command: remainder };
        }
      }
      return { isWake: false, command: null };
    }

    // --- ALWAYS-LISTENING STANDBY LOOP ---
    startStandbyLoop() {
      if (!this.SpeechRecClass) {
        setSystemVoiceState('unsupported');
        return;
      }

      this.abortRecognition();
      const sessionId = ++this.currentSessionId;
      setSystemVoiceState('standby');

      try {
        const rec = new this.SpeechRecClass();
        this.recognition = rec;
        rec.lang = 'en-IN';
        rec.continuous = false; // Managed restart loop is vastly more reliable across browsers than continuous=true
        rec.interimResults = false;
        rec.maxAlternatives = 3;

        rec.onstart = () => {
          if (this.currentSessionId !== sessionId) return;
          setSystemVoiceState('standby');
          $('chatHeadline').textContent = 'Vera is listening for wake phrase “Vera”…';
        };

        rec.onresult = (event) => {
          if (this.currentSessionId !== sessionId) return;
          if (!event.results || !event.results[0]) return;
          
          this.retryCount = 0; // Reset exponential backoff on successful recognition
          const transcript = event.results[0][0].transcript.trim();
          const match = this.checkWakeWord(transcript);

          if (match.isWake) {
            this.handleWakeDetected(match.command);
          }
        };

        rec.onerror = (event) => {
          if (this.currentSessionId !== sessionId) return;
          const err = event.error;
          if (err === 'not-allowed' || err === 'service-not-allowed') {
            setSystemVoiceState('permission_denied');
            this.alwaysListening = false;
            updateAlwaysListenBtnUI();
            return;
          }
          if (err === 'no-speech') {
            // Silence timeout is normal in browser Web Speech API
            return;
          }
          console.warn('Standby speech error:', err);
          this.retryCount++;
        };

        rec.onend = () => {
          if (this.currentSessionId !== sessionId) return;
          this.recognition = null;

          // If still in standby and always-listening is enabled, cleanly restart with backoff
          if (this.alwaysListening && !this.isPaused && state.voiceState === 'standby') {
            const backoff = this.retryCount > 0 ? Math.min(1000 * Math.pow(1.5, this.retryCount), 12000) : 350;
            if (this.retryCount > 2) {
              setSystemVoiceState('recovering');
            }
            this.retryTimer = setTimeout(() => {
              if (this.currentSessionId === sessionId && this.alwaysListening && !this.isPaused) {
                this.startStandbyLoop();
              }
            }, backoff);
          }
        };

        rec.start();
      } catch (e) {
        console.error('Failed to start standby recognition:', e);
        setSystemVoiceState('error');
      }
    }

    // --- WAKE DETECTED ➔ ACKNOWLEDGE ➔ CAPTURE COMMAND ---
    handleWakeDetected(immediateCommand = null) {
      const sessionId = ++this.currentSessionId;
      this.abortRecognition();

      setSystemVoiceState('wake_detected');
      sfx.playChime('ready');
      $('chatHeadline').textContent = 'Wake word detected!';

      setTimeout(() => {
        if (this.currentSessionId !== sessionId) return;

        // If user already issued command in one breath ("Vera explain BrandForge")
        if (immediateCommand && immediateCommand.length > 2) {
          this.routeSpokenCommand(immediateCommand);
          return;
        }

        // Otherwise acknowledge and then start capturing command
        setSystemVoiceState('acknowledging');
        const ackText = (state.callerRole === 'owner') ? 'Yes, Boss?' : 'Yes? I’m listening.';
        $('chatHeadline').textContent = `Vera: “${ackText}”`;

        this.speak(ackText, () => {
          // On acknowledgement speech completion, start command capture!
          if (this.currentSessionId !== sessionId) return;
          this.startCommandCaptureSession();
        });
      }, 350);
    }

    // --- COMMAND CAPTURE SESSION ---
    startCommandCaptureSession() {
      if (!this.SpeechRecClass) return;
      this.abortRecognition();

      const sessionId = ++this.currentSessionId;
      setSystemVoiceState('capturing_command');
      sfx.playChime('listen_start');
      $('chatHeadline').textContent = 'Listening for your command...';

      try {
        const rec = new this.SpeechRecClass();
        this.recognition = rec;
        rec.lang = 'en-IN';
        rec.continuous = false;
        rec.interimResults = false;
        rec.maxAlternatives = 3;

        let speechCaptured = false;

        rec.onstart = () => {
          if (this.currentSessionId !== sessionId) return;
          setSystemVoiceState('capturing_command');
        };

        rec.onresult = (event) => {
          if (this.currentSessionId !== sessionId) return;
          if (!event.results || !event.results[0]) return;
          speechCaptured = true;
          this.noSpeechNagCount = 0; // Reset nag count on actual speech

          const transcript = event.results[0][0].transcript.trim();
          setSystemVoiceState('transcribing');
          this.routeSpokenCommand(transcript);
        };

        rec.onerror = (event) => {
          if (this.currentSessionId !== sessionId) return;
          if (event.error === 'no-speech') {
            // Handled in onend
          } else {
            console.warn('Command capture error:', event.error);
          }
        };

        rec.onend = () => {
          if (this.currentSessionId !== sessionId) return;
          this.recognition = null;

          if (!speechCaptured && state.voiceState === 'capturing_command') {
            // No speech detected after acknowledgment
            if (this.noSpeechNagCount === 0) {
              this.noSpeechNagCount++;
              this.speak("I'm still here when you're ready.", () => {
                if (this.alwaysListening && !this.isPaused) {
                  this.startStandbyLoop();
                } else {
                  setSystemVoiceState('disabled');
                }
              });
            } else {
              // Return to standby quietly without nagging repeatedly
              if (this.alwaysListening && !this.isPaused) {
                this.startStandbyLoop();
              } else {
                setSystemVoiceState('disabled');
              }
            }
          }
        };

        rec.start();
      } catch (err) {
        console.error('Command capture failed to start:', err);
        setSystemVoiceState('error');
      }
    }

    // --- NATURAL LANGUAGE COMMAND ROUTER ---
    routeSpokenCommand(commandText) {
      if (!commandText || !commandText.trim()) return;
      const cmd = commandText.trim();
      const lower = cmd.toLowerCase();

      // 1. Local Deterministic Actions: Stop Talking
      if (['stop talking', 'stop speaking', 'quiet', 'silence', 'shut up', 'mute'].some(p => lower.includes(p))) {
        this.stopSpeaking();
        addMessageToFeed('assistant', 'Speech stopped. Standing by.', { title: 'Local Command // Speech Stopped' });
        return;
      }

      // 2. Local Deterministic Actions: Pause Listening
      if (['pause listening', 'stop listening', 'go to standby', 'stand down'].some(p => lower.includes(p))) {
        this.pauseListening();
        addMessageToFeed('assistant', 'Listening paused. Standing down.', { title: 'Local Command // Listening Paused' });
        this.speak('Listening paused. Standing by.');
        return;
      }

      // 3. Local Deterministic Actions: Resume Listening
      if (['resume listening', 'start listening', 'wake up'].some(p => lower.includes(p))) {
        this.resumeListening();
        addMessageToFeed('assistant', 'Always-listening mode resumed.', { title: 'Local Command // Resumed' });
        this.speak('Always listening resumed.');
        return;
      }

      // 4. Local Deterministic Actions: Repeat Previous Response
      if (['repeat that', 'repeat previous response', 'say that again', 'say again'].some(p => lower.includes(p))) {
        if (state.lastAssistantReply) {
          this.speak(state.lastAssistantReply);
        } else {
          this.speak('There is no previous response to repeat.');
        }
        return;
      }

      // 5. Local Deterministic Actions: Speech Rate Adjustment
      if (lower.includes('speak more slowly') || lower.includes('speak slower') || lower.includes('slower')) {
        state.speechRate = Math.max(0.7, (state.speechRate || 1.0) - 0.2);
        if ($('speechRateSlider')) $('speechRateSlider').value = state.speechRate;
        if ($('speechRateVal')) $('speechRateVal').textContent = `${state.speechRate.toFixed(2)}x`;
        this.speak(`Speech rate reduced to ${state.speechRate.toFixed(1)}x.`);
        return;
      }

      if (lower.includes('speak faster') || lower.includes('faster')) {
        state.speechRate = Math.min(1.6, (state.speechRate || 1.0) + 0.2);
        if ($('speechRateSlider')) $('speechRateSlider').value = state.speechRate;
        if ($('speechRateVal')) $('speechRateVal').textContent = `${state.speechRate.toFixed(2)}x`;
        this.speak(`Speech rate increased to ${state.speechRate.toFixed(1)}x.`);
        return;
      }

      // 6. Local Deterministic Actions: Capability / Help
      if (['what are you capable of', 'what can you do', 'help', 'capabilities'].some(p => lower.includes(p))) {
        const caps = "I am Vera, personal engineering intelligence for Prathmesh Mante. I can inspect public repositories like BrandForge and InkLoom, analyze architecture topologies, extract tech matrices, compare projects, and answer technical questions hands-free.";
        addMessageToFeed('user', cmd);
        addMessageToFeed('assistant', caps, {
          title: 'Vera // Core Capabilities',
          rawDisplay: '### Vera Capabilities & Directives\n- **Hands-Free Operation**: Always-on wake phrase (“Vera”) recognition with automatic recovery.\n- **Repository Intelligence**: Grounded insights into `BrandForge`, `InkLoom`, and all public portfolio projects.\n- **Architecture Topology**: Visual and conceptual system flow breakdowns.\n- **Natural Language Comparison**: Contrast technologies and architectural trade-offs.\n- **Conduct Protocol**: Composed boundary enforcement and privacy protection.'
        });
        this.speak(caps);
        return;
      }

      // 7. General & Repository Commands ➔ Process via Chat Engine
      handleUserChatMessage(cmd);
    }

    // --- CONTROL ACTIONS ---
    enableAlwaysListening() {
      if (!this.SpeechRecClass) {
        setSystemVoiceState('unsupported');
        handleSpeechError('unsupported', 'always_listen');
        return;
      }
      this.alwaysListening = true;
      this.isPaused = false;
      this.retryCount = 0;
      updateAlwaysListenBtnUI();
      sfx.playChime('ready');
      this.startStandbyLoop();
    }

    disableAlwaysListening() {
      this.alwaysListening = false;
      this.isPaused = false;
      this.abortRecognition();
      updateAlwaysListenBtnUI();
      setSystemVoiceState('disabled');
      $('chatHeadline').textContent = 'Always-listening mode disabled. Click to re-enable.';
    }

    pauseListening() {
      if (!this.alwaysListening) return;
      this.isPaused = true;
      this.abortRecognition();
      setSystemVoiceState('paused');
      updateAlwaysListenBtnUI();
      $('chatHeadline').textContent = 'Listening paused. Click Resume or say Resume to reactivate.';
    }

    resumeListening() {
      if (!this.alwaysListening) {
        this.enableAlwaysListening();
        return;
      }
      this.isPaused = false;
      updateAlwaysListenBtnUI();
      this.startStandbyLoop();
    }

    pushToTalk() {
      sfx.init();
      this.startCommandCaptureSession();
    }

    toggleMuteVoice() {
      this.voiceMuted = !this.voiceMuted;
      if ($('muteVoiceBtn')) {
        $('muteVoiceText').textContent = this.voiceMuted ? '🔇 VOICE MUTED' : '🔊 VOICE ON';
      }
      if (this.voiceMuted && this.synth) {
        this.synth.cancel();
      }
    }

    // Backward-compatibility method for auth screen
    startListening(purpose = 'chat') {
      if (purpose === 'auth') {
        if (!this.SpeechRecClass) {
          handleSpeechError('unsupported', purpose);
          return;
        }
        this.abortRecognition();
        try {
          const rec = new this.SpeechRecClass();
          this.recognition = rec;
          rec.lang = 'en-IN';
          rec.continuous = false;
          rec.interimResults = false;
          rec.maxAlternatives = 3;

          rec.onstart = () => {
            setSystemVoiceState('capturing_command');
            sfx.playChime('listen_start');
            updateAuthStatus('LISTENING FOR PASSPHRASE… SAY “PRAT”', 'listening');
          };

          rec.onresult = (event) => {
            if (!event.results || !event.results[0]) return;
            const transcript = event.results[0][0].transcript.trim();
            handleAuthResult(transcript);
          };

          rec.onerror = (event) => {
            setSystemVoiceState('error');
            handleSpeechError(event.error, 'auth');
          };

          rec.onend = () => {
            this.recognition = null;
            if (!state.authorized) {
              setSystemVoiceState('disabled');
              updateAuthStatus('VOICE SESSION CLOSED · SELECT RETRY', 'idle');
              $('retryVoiceBtn').hidden = false;
            }
          };

          rec.start();
        } catch (err) {
          setSystemVoiceState('error');
          handleSpeechError('initialization-failed', 'auth');
        }
      } else {
        this.startCommandCaptureSession();
      }
    }

    stopListening() {
      this.abortRecognition();
      setSystemVoiceState('disabled');
    }
  }

  const veraVoiceEngine = new VeraVoiceEngine();
  const speechEngine = veraVoiceEngine; // Backward compatibility
  window.veraVoiceEngine = veraVoiceEngine;

  // --- STATE MACHINE UI UPDATE ---
  function setSystemVoiceState(newState) {
    state.voiceState = newState;
    const badge = $('voiceStateBadge');
    const label = $('voiceStateLabel');
    const holoState = $('holoCoreState');
    const consoleStatus = $('consoleOrbStatus');
    const consoleOrb = $('consoleOrb');
    const authOrb = $('authVoiceOrb');
    const stageWave = $('radialWaveform');
    const consoleWave = $('voiceActivityWave');
    const micIndicator = $('micStatusIndicator');
    const micLabel = $('micStatusLabel');
    const chatDot = $('chatStatusDot');

    const stateDisplayNames = {
      disabled: 'DISABLED',
      requesting_permission: 'REQUESTING PERMISSION',
      initializing: 'INITIALIZING',
      standby: 'STANDBY / WAKE-WORD ACTIVE',
      wake_detected: 'WAKE WORD DETECTED',
      acknowledging: 'ACKNOWLEDGING',
      capturing_command: 'CAPTURING COMMAND',
      transcribing: 'TRANSCRIBING',
      processing: 'PROCESSING',
      speaking: 'SPEAKING',
      paused: 'PAUSED',
      recovering: 'RECOVERING',
      permission_denied: 'PERMISSION DENIED',
      unsupported: 'UNSUPPORTED',
      error: 'ERROR'
    };

    const displayText = stateDisplayNames[newState] || newState.toUpperCase();

    if (badge) badge.textContent = displayText;
    if (label) label.textContent = displayText;
    if (holoState) holoState.textContent = displayText;
    if (consoleStatus) consoleStatus.textContent = displayText;

    // Reset visual classes
    [consoleOrb, authOrb, stageWave, consoleWave].forEach(el => {
      if (!el) return;
      el.classList.remove('standby', 'wake_detected', 'capturing_command', 'listening', 'speaking', 'processing', 'paused', 'error');
    });

    if (micIndicator) {
      micIndicator.classList.remove('active', 'capturing', 'paused', 'error');
    }

    if (chatDot) {
      chatDot.classList.remove('green', 'amber', 'cyan');
    }

    switch (newState) {
      case 'standby':
        if (consoleOrb) consoleOrb.classList.add('standby');
        if (micIndicator) micIndicator.classList.add('active');
        if (micLabel) micLabel.textContent = 'MIC: ACTIVE · SAY “VERA”';
        if (badge) badge.style.borderColor = 'var(--cyan-telemetry)';
        if (chatDot) chatDot.classList.add('green');
        break;
      case 'wake_detected':
        if (consoleOrb) consoleOrb.classList.add('wake_detected');
        if (micIndicator) micIndicator.classList.add('capturing');
        if (micLabel) micLabel.textContent = 'WAKE DETECTED // ACKNOWLEDGING';
        if (badge) badge.style.borderColor = 'var(--gold-primary)';
        if (chatDot) chatDot.classList.add('amber');
        break;
      case 'acknowledging':
      case 'speaking':
        if (consoleOrb) consoleOrb.classList.add('speaking');
        if (stageWave) stageWave.classList.add('speaking');
        if (consoleWave) consoleWave.classList.add('speaking');
        if (micLabel) micLabel.textContent = 'MIC: MUTED DURING SPEECH';
        if (badge) badge.style.borderColor = 'var(--gold-primary)';
        if (chatDot) chatDot.classList.add('amber');
        break;
      case 'capturing_command':
      case 'listening':
        if (consoleOrb) consoleOrb.classList.add('capturing_command');
        if (authOrb) authOrb.classList.add('listening');
        if (micIndicator) micIndicator.classList.add('capturing');
        if (micLabel) micLabel.textContent = 'MIC: CAPTURING COMMAND...';
        if (badge) badge.style.borderColor = 'var(--gold-primary)';
        if (chatDot) chatDot.classList.add('cyan');
        break;
      case 'transcribing':
      case 'processing':
        if (consoleOrb) consoleOrb.classList.add('processing');
        if (micLabel) micLabel.textContent = 'PROCESSING RECONNAISSANCE...';
        if (badge) badge.style.borderColor = 'var(--cyan-telemetry)';
        if (chatDot) chatDot.classList.add('cyan');
        break;
      case 'paused':
        if (consoleOrb) consoleOrb.classList.add('paused');
        if (micIndicator) micIndicator.classList.add('paused');
        if (micLabel) micLabel.textContent = 'MIC: PAUSED';
        if (badge) badge.style.borderColor = 'var(--amber-warning)';
        if (chatDot) chatDot.classList.add('amber');
        break;
      case 'recovering':
        if (consoleOrb) consoleOrb.classList.add('standby');
        if (micIndicator) micIndicator.classList.add('paused');
        if (micLabel) micLabel.textContent = 'RECOVERING RECOGNITION...';
        if (badge) badge.style.borderColor = 'var(--amber-warning)';
        break;
      case 'permission_denied':
        if (consoleOrb) consoleOrb.classList.add('error');
        if (micIndicator) micIndicator.classList.add('error');
        if (micLabel) micLabel.textContent = 'MIC: PERMISSION DENIED';
        if (badge) badge.style.borderColor = 'var(--red-error)';
        break;
      case 'unsupported':
        if (consoleOrb) consoleOrb.classList.add('error');
        if (micIndicator) micIndicator.classList.add('error');
        if (micLabel) micLabel.textContent = 'MIC: BROWSER UNSUPPORTED';
        if (badge) badge.style.borderColor = 'var(--red-error)';
        break;
      case 'error':
        if (consoleOrb) consoleOrb.classList.add('error');
        if (micIndicator) micIndicator.classList.add('error');
        if (micLabel) micLabel.textContent = 'MIC: ERROR';
        if (badge) badge.style.borderColor = 'var(--red-error)';
        break;
      case 'disabled':
      default:
        if (micLabel) micLabel.textContent = 'MIC: STANDBY (CLICK TO START)';
        if (badge) badge.style.borderColor = 'var(--border-dim)';
        if (chatDot) chatDot.classList.add('green');
        break;
    }
  }

  function updateAlwaysListenBtnUI() {
    const btn = $('alwaysListenToggleBtn');
    const icon = $('alwaysListenIcon');
    const text = $('alwaysListenText');
    const pauseBtn = $('pauseListenBtn');
    const pauseText = $('pauseListenText');

    if (btn) {
      if (veraVoiceEngine.alwaysListening) {
        btn.classList.add('active');
        if (icon) icon.textContent = '⏹';
        if (text) text.textContent = 'STOP ALWAYS LISTENING';
      } else {
        btn.classList.remove('active');
        if (icon) icon.textContent = '◉';
        if (text) text.textContent = 'ENABLE ALWAYS LISTENING';
      }
    }

    if (pauseBtn) {
      pauseBtn.disabled = !veraVoiceEngine.alwaysListening;
      if (pauseText) {
        pauseText.textContent = veraVoiceEngine.isPaused ? '▶ RESUME' : '⏸ PAUSE';
      }
    }
  }

  // --- AUTHORIZATION & PASS-GATE LOGIC ---
  function normalizePassphrase(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function verifyPassphrase(input) {
    const clean = normalizePassphrase(input);
    if (!clean) return false;

    // Spoken demo phrase: "Open the command deck".
    // Match key words instead of requiring a brittle exact transcript.
    const hasCommand = /\b(?:command|commander)\b/.test(clean);
    const hasDeck = /\b(?:deck|desk)\b/.test(clean);
    const hasWakeVerb = /\b(?:open|unlock|activate)\b/.test(clean);
    const mentionsVera = /\bvera\b/.test(clean);

    // "command deck" is accepted as a short fallback if recognition drops "open".
    return hasCommand && hasDeck &&
      (hasWakeVerb || mentionsVera || clean.split(' ').filter(Boolean).length <= 3);
  }

  function handleAuthResult(transcript) {
    const isMatch = verifyPassphrase(transcript);

    if (isMatch) {
      state.authorized = true;
      document.body.classList.remove('locked');
      $('welcomeOverlay').classList.add('hidden');
      sfx.playChime('auth_success');

      updateAuthStatus('AUTHORIZATION ACCEPTED // WELCOME ABOARD', 'success');
      
      const welcomeSpoken = "Passphrase accepted. Welcome aboard. I'm Vera, your composed and observant engineering guide. Systems are calibrated and ready.";
      speechEngine.speak(welcomeSpoken);

      // Add to conversation feed
      addMessageToFeed('assistant', welcomeSpoken, {
        title: 'Authorization Accepted',
        details: 'Command deck unlocked. You may now explore public repository intelligence, review architectural graphs, or interact via voice and text.'
      });

      // Check URL query parameters (e.g. ?repo=prathmeshmante-glitch/brandforge)
      const urlParams = new URLSearchParams(window.location.search);
      const targetRepo = urlParams.get('repo');
      if (targetRepo) {
        setTimeout(() => {
          conductProjectBriefing(targetRepo);
        }, 1200);
      }
    } else {
      sfx.playChime('auth_error');
      $('welcomeTitle').textContent = 'AUTHORIZATION FAILED';
      $('authErrorMsg').textContent = `I captured: “${transcript}”. Say “Open the command deck” clearly, or just “command deck”, and try again.`;
      updateAuthStatus('AUTHENTICATION REJECTED · RETRY READY', 'error');
      $('retryVoiceBtn').hidden = false;
      $('beginVoiceBtnText').textContent = 'RETRY VOICE AUTHORIZATION ↗';
      speechEngine.speak('Passphrase not recognized. Please say: Open the command deck.');
    }
  }

  function updateAuthStatus(text, variant = 'idle') {
    const bannerText = $('authStatusText');
    const dot = $('orbIndicatorDot');
    if (bannerText) bannerText.textContent = text;
    if (dot) {
      dot.style.background = variant === 'listening' ? 'var(--cyan-telemetry)' : 
                             variant === 'error' ? 'var(--red-error)' : 'var(--mint-success)';
      dot.style.boxShadow = `0 0 10px ${dot.style.background}`;
    }
  }

  function handleSpeechError(error, purpose) {
    let msg = '';
    if (error === 'not-allowed' || error === 'service-not-allowed') {
      msg = 'Microphone access was denied. Please allow microphone permissions in your browser bar and retry.';
    } else if (error === 'no-speech') {
      msg = 'No speech detected before timeout. Click retry and speak clearly.';
    } else if (error === 'audio-capture') {
      msg = 'No operational microphone was found on this system.';
    } else if (error === 'network') {
      msg = 'Browser speech recognition network service unreachable. Check internet connection.';
    } else if (error === 'unsupported') {
      msg = 'Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.';
    } else {
      msg = `Speech error occurred (${error}). You may retry.`;
    }

    if (purpose === 'auth') {
      $('authErrorMsg').textContent = msg;
      updateAuthStatus('VOICE ISSUE // ACTION REQUIRED', 'error');
      $('retryVoiceBtn').hidden = false;
    } else {
      $('chatHeadline').textContent = msg;
    }
  }

  async function checkBackendConnectivity() {
    if (!CONFIG.BACKEND_URL) {
      state.backendOnline = false;
      if ($('backendLabel')) $('backendLabel').textContent = 'STANDALONE MODE (GITHUB REST)';
      if ($('diagBackendStatus')) $('diagBackendStatus').textContent = 'STANDALONE (CLIENT-SIDE)';
      if ($('diagBackendDetail')) $('diagBackendDetail').textContent = 'Operating with client-side GitHub REST fallback';
      if ($('coreEngineBadge')) $('coreEngineBadge').textContent = 'DETERMINISTIC ARCHIVE ENGINE';
      return;
    }
    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/health`, { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        state.backendOnline = true;
        $('backendLabel').textContent = 'LIVE AI BACKEND CONNECTED';
        $('diagBackendStatus').textContent = 'NOMINAL (FASTAPI :8000)';
        $('diagBackendDetail').textContent = 'Real-time REST & AI pipelines active';
        $('coreEngineBadge').textContent = 'FASTAPI AI PIPELINE';
      } else {
        throw new Error('Not OK');
      }
    } catch (_) {
      state.backendOnline = false;
      $('backendLabel').textContent = 'STANDALONE MODE (GITHUB REST)';
      $('diagBackendStatus').textContent = 'STANDALONE (CLIENT-SIDE)';
      $('diagBackendDetail').textContent = 'Operating with client-side GitHub REST fallback';
      $('coreEngineBadge').textContent = 'DETERMINISTIC ARCHIVE ENGINE';
    }
  }

  async function loadRepositories() {
    const statusText = $('repoSyncStatus');
    const countBadge = $('metricRepoCount');
    if (statusText) statusText.textContent = 'CONNECTING TO GITHUB API...';

    let repos = [];
    if (state.backendOnline) {
      try {
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/github/repos`);
        if (res.ok) repos = await res.json();
      } catch (_) {}
    }

    // Direct GitHub fallback if backend did not supply
    if (!repos.length) {
      try {
        const res = await fetch(`https://api.github.com/users/${CONFIG.GITHUB_USER}/repos?per_page=100&sort=updated`);
        if (res.ok) {
          const raw = await res.json();
          repos = raw.filter(r => !r.fork).map(r => ({
            name: r.name,
            full_name: r.full_name,
            description: r.description,
            language: r.language,
            stargazers_count: r.stargazers_count,
            forks_count: r.forks_count,
            open_issues_count: r.open_issues_count,
            updated_at: r.updated_at,
            html_url: r.html_url,
            homepage: r.homepage
          }));
        }
      } catch (err) {
        console.warn('Direct GitHub fetch failed, utilizing verified backup archives:', err);
      }
    }

    // Ensure we have verified repositories
    if (!repos.length) {
      repos = CONFIG.FALLBACK_REPOS;
    }

    state.repositories = repos;
    if (countBadge) countBadge.textContent = `${repos.length} FILES`;
    if (statusText) statusText.textContent = `SYNCED // ${repos.length} REPOSITORIES VERIFIED`;
    if ($('diagGithubStatus')) $('diagGithubStatus').textContent = 'ACTIVE / SYNCED';
    if ($('diagGithubDetail')) $('diagGithubDetail').textContent = `${repos.length} public repos indexed`;

    renderRepositoriesGrid();
    renderTechMatrix();
  }

  function renderRepositoriesGrid() {
    const grid = $('missionGrid');
    if (!grid) return;

    let filtered = state.repositories;
    if (state.activeFilter !== 'all') {
      filtered = filtered.filter(r => (r.language || '').toLowerCase() === state.activeFilter.toLowerCase());
    }
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(q) || 
        (r.description || '').toLowerCase().includes(q) ||
        (r.language || '').toLowerCase().includes(q)
      );
    }

    if (!filtered.length) {
      grid.innerHTML = '<div class="panel" style="padding: 24px; grid-column: 1 / -1; text-align: center;"><p>No repositories match your active filter criteria.</p></div>';
      return;
    }

    grid.innerHTML = filtered.map((repo, idx) => {
      const lang = repo.language || 'General';
      const cleanName = repo.name.replace(/[-_]/g, ' ');
      const demoBtn = repo.homepage ? `<a href="${repo.homepage}" target="_blank" rel="noopener" class="btn btn-xs btn-outline">LIVE APP ↗</a>` : '';

      return `
        <article class="project-card panel">
          <div class="project-id-tag">FILE_${String(idx + 1).padStart(3, '0')} // ${lang.toUpperCase()}</div>
          <div class="project-card-header">
            <h3 class="project-title">${cleanName}</h3>
          </div>
          <p class="project-desc">${repo.description || 'Public engineering repository by Prathmesh Mante.'}</p>
          <div class="project-chips">
            <span>${lang}</span>
            <span>★ ${repo.stargazers_count}</span>
            <span>OPEN ISSUES: ${repo.open_issues_count || 0}</span>
          </div>
          <div class="project-card-footer">
            <div class="repo-stats-row">
              <span>UPDATED: ${new Date(repo.updated_at).toLocaleDateString()}</span>
              <span>CLASSIFIED: PUBLIC</span>
            </div>
            <div class="project-actions">
              <button class="btn btn-xs btn-primary brief-btn" data-repo="${repo.name}">ASK VERA ↗</button>
              <button class="btn btn-xs btn-secondary arch-btn" data-repo="${repo.name}">ARCHITECTURE ⌁</button>
              <a href="${repo.html_url}" target="_blank" rel="noopener" class="btn btn-xs btn-ghost">GITHUB ↗</a>
              ${demoBtn}
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Attach button events
    grid.querySelectorAll('.brief-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeRepo = btn.dataset.repo;
        conductProjectBriefing(btn.dataset.repo);
      });
    });
    grid.querySelectorAll('.arch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeRepo = btn.dataset.repo;
        renderArchitectureGraph(btn.dataset.repo);
        $('architecture').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  // --- SYSTEM 03 & 04: ARCHITECTURE & INTELLIGENCE ---
  const ARCHITECTURE_DATA = {
    brandforge: {
      title: 'BrandForge // Agentic Intelligence Workspace',
      nodes: [
        { id: 'fe', x: 80, y: 140, label: 'Next.js Interface', sub: 'TypeScript · Tailwind', type: 'client' },
        { id: 'api', x: 320, y: 140, label: 'FastAPI Service Engine', sub: 'Python · Uvicorn', type: 'service' },
        { id: 'agents', x: 580, y: 80, label: 'LangGraph Reasoning', sub: 'Constraint Pipelines', type: 'ai' },
        { id: 'db', x: 580, y: 200, label: 'Supabase & Vector DB', sub: 'Brand State & Memory', type: 'storage' },
        { id: 'ext', x: 800, y: 140, label: 'Model Provider APIs', sub: 'Structured Generation', type: 'external' }
      ],
      links: [
        { from: 'fe', to: 'api' },
        { from: 'api', to: 'agents' },
        { from: 'api', to: 'db' },
        { from: 'agents', to: 'ext' }
      ],
      details: {
        type: 'DISTRIBUTED AGENTIC STACK',
        title: 'BrandForge Architecture Topology',
        desc: 'BrandForge combines a high-performance Next.js presentation layer with a FastAPI service engine. Complex brand constraints, typography lockups, and product guidelines are synthesized through LangGraph stateful graph cycles and persisted in Supabase.',
        tags: ['Next.js', 'FastAPI', 'LangGraph', 'Supabase', 'TypeScript', 'Python']
      }
    },
    inkloom: {
      title: 'InkLoom // Specialized Logo Synthesis',
      nodes: [
        { id: 'fe', x: 90, y: 140, label: 'Vector Canvas Studio', sub: 'TypeScript · SVG Engine', type: 'client' },
        { id: 'rules', x: 350, y: 140, label: 'Geometry & Clear-Space', sub: 'Algorithmic Constraints', type: 'service' },
        { id: 'models', x: 620, y: 140, label: 'Generative Mark Models', sub: 'Specialized Embeddings', type: 'ai' },
        { id: 'export', x: 820, y: 140, label: 'Asset Bundler', sub: 'SVG · PNG · Guidelines', type: 'storage' }
      ],
      links: [
        { from: 'fe', to: 'rules' },
        { from: 'rules', to: 'models' },
        { from: 'models', to: 'export' }
      ],
      details: {
        type: 'GENERATIVE GEOMETRY SYSTEM',
        title: 'InkLoom Constraint Synthesis Topology',
        desc: 'InkLoom bridges abstract business parameters with mathematical vector geometry. A rule engine establishes clear-space and typographic harmony before specialized generative models construct the final identity lockup.',
        tags: ['TypeScript', 'Generative Geometry', 'SVG Pipelines', 'Constraint Models']
      }
    },
    'prathmeshmante-glitch.github.io': {
      title: 'V.E.R.A. Command Deck // Intelligence Core',
      nodes: [
        { id: 'deck', x: 100, y: 140, label: 'HUD Command Deck', sub: 'Web Audio · Web Speech', type: 'client' },
        { id: 'voice', x: 360, y: 80, label: 'Voice State Machine', sub: 'Passphrase & TTS Sync', type: 'service' },
        { id: 'backend', x: 360, y: 200, label: 'FastAPI Backend', sub: 'Python · Caching', type: 'service' },
        { id: 'github', x: 620, y: 140, label: 'GitHub REST Telemetry', sub: 'Live Repository Data', type: 'external' },
        { id: 'llm', x: 820, y: 140, label: 'Model Provider', sub: 'Grounded Briefings', type: 'ai' }
      ],
      links: [
        { from: 'deck', to: 'voice' },
        { from: 'deck', to: 'backend' },
        { from: 'backend', to: 'github' },
        { from: 'backend', to: 'llm' }
      ],
      details: {
        type: 'CYBERNETIC INTELLIGENCE DECK',
        title: 'V.E.R.A. Core Telemetry Architecture',
        desc: 'V.E.R.A. features a decoupled client HUD capable of running on static GitHub Pages with honest degraded fallbacks or connecting to a high-speed Python FastAPI backend for full generative AI reasoning.',
        tags: ['FastAPI', 'Web Speech API', 'Web Audio API', 'Python', 'Vanilla JS']
      }
    }
  };

  function renderArchitectureGraph(repoName = 'brandforge') {
    const svg = $('archSvg');
    const details = $('archNodeDetails');
    const label = $('archActiveRepoLabel');
    if (!svg) return;

    const key = ARCHITECTURE_DATA[repoName] ? repoName : 'brandforge';
    const data = ARCHITECTURE_DATA[key];

    if (label) label.textContent = `TARGET: ${key.toUpperCase()}`;

    // Update buttons
    document.querySelectorAll('.arch-select-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.repo === key);
      b.classList.toggle('btn-primary', b.dataset.repo === key);
      b.classList.toggle('btn-outline', b.dataset.repo !== key);
    });

    // Generate SVG Lines
    let linksSvg = '';
    data.links.forEach(l => {
      const fromNode = data.nodes.find(n => n.id === l.from);
      const toNode = data.nodes.find(n => n.id === l.to);
      if (fromNode && toNode) {
        linksSvg += `
          <line x1="${fromNode.x + 80}" y1="${fromNode.y + 30}" x2="${toNode.x}" y2="${toNode.y + 30}" 
                stroke="rgba(244, 185, 95, 0.45)" stroke-width="2" stroke-dasharray="4 2" />
        `;
      }
    });

    // Generate SVG Nodes
    let nodesSvg = '';
    data.nodes.forEach(n => {
      const isAI = n.type === 'ai';
      const strokeColor = isAI ? 'var(--cyan-telemetry)' : 'var(--gold-primary)';
      const fillColor = isAI ? 'rgba(102, 217, 232, 0.12)' : 'rgba(244, 185, 95, 0.12)';

      nodesSvg += `
        <g class="graph-node" data-id="${n.id}" style="cursor: pointer;" transform="translate(${n.x}, ${n.y})">
          <rect width="160" height="60" rx="3" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.5" />
          <text x="12" y="24" fill="#F5F0E7" font-family="var(--font-mono)" font-size="11" font-weight="600">${n.label}</text>
          <text x="12" y="44" fill="#AAB2C0" font-family="var(--font-mono)" font-size="9">${n.sub}</text>
        </g>
      `;
    });

    svg.innerHTML = linksSvg + nodesSvg;

    // Attach click listeners to nodes
    svg.querySelectorAll('.graph-node').forEach(nodeEl => {
      nodeEl.addEventListener('click', () => {
        sfx.playChime('click');
        const nId = nodeEl.dataset.id;
        const nodeObj = data.nodes.find(n => n.id === nId);
        if (nodeObj) {
          $('nodeTypeBadge').textContent = nodeObj.type.toUpperCase();
          $('nodeTitle').textContent = nodeObj.label;
          $('nodeDescription').textContent = `Verified architectural component responsible for: ${nodeObj.sub}. Implemented as part of ${data.title}.`;
        }
      });
    });

    // Set default detail drawer
    if (details && data.details) {
      $('nodeTypeBadge').textContent = data.details.type;
      $('nodeTitle').textContent = data.details.title;
      $('nodeDescription').textContent = data.details.desc;
      $('nodeTechTags').innerHTML = data.details.tags.map(t => `<span class="tech-tag">${t}</span>`).join('');
    }
  }

  // --- TECH MATRIX RENDERER ---
  function renderTechMatrix() {
    // Collect all detected languages and manifest tools
    const langCounts = {};
    state.repositories.forEach(r => {
      if (r.language) {
        langCounts[r.language] = (langCounts[r.language] || 0) + 1;
      }
    });

    const total = state.repositories.length || 1;
    const langBox = $('matrixLanguages');
    if (langBox && Object.keys(langCounts).length) {
      langBox.innerHTML = Object.entries(langCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([lang, count]) => {
          const pct = Math.round((count / total) * 100);
          return `
            <div class="matrix-item">
              <div class="mi-meta"><span>${lang}</span><b>${count} REPO${count === 1 ? '' : 'S'} (${pct}%)</b></div>
              <div class="mi-bar"><div class="mi-fill" style="width: ${Math.max(15, pct)}%"></div></div>
            </div>
          `;
        }).join('');
    }
  }

  // --- PROJECT BRIEFING FLOW ---
  async function conductProjectBriefing(repoName) {
    if (!state.authorized) {
      $('welcomeOverlay').classList.remove('hidden');
      return;
    }

    const clean = repoName.split('/').pop().toLowerCase();
    state.activeRepo = clean;
    $('core').scrollIntoView({ behavior: 'smooth' });

    let spoken = '';
    let display = '';
    let title = `Mission Briefing // ${clean.toUpperCase()}`;

    // Try backend if online
    if (state.backendOnline) {
      try {
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/assistant/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Provide an engineering briefing for ${clean}`,
            current_repo: clean,
            caller_role: state.callerRole || 'guest'
          })
        });
        if (res.ok) {
          const data = await res.json();
          spoken = data.spoken_reply;
          display = data.display_reply;
          title = data.title;
        }
      } catch (_) {}
    }

    // Client fallback if backend not available
    if (!spoken) {
      const match = state.repositories.find(r => r.name.toLowerCase() === clean);
      if (match) {
        spoken = `Mission briefing for ${match.name}. ${match.description || 'Verified engineering project.'} Primary language: ${match.language || 'modern stack'}.`;
        display = `### Mission Briefing: ${match.name}\n- **Overview**: ${match.description || 'Public engineering repository.'}\n- **Primary Language**: \`${match.language || 'General'}\`\n- **Live Repository**: [${match.full_name}](${match.html_url})\n${match.homepage ? `- **Live App**: [${match.homepage}](${match.homepage})` : ''}`;
      } else {
        spoken = `Target repository ${clean} located in public archive. Loading verified metadata.`;
        display = `### Repository Intelligence: ${clean}\nTarget loaded. You can explore the live source code directly on GitHub.`;
      }
    }

    addMessageToFeed('assistant', spoken, { title, rawDisplay: display });
    speechEngine.speak(spoken);
    state.lastAssistantReply = spoken;
  }

  // --- CHAT & REASONING FLOW ---
  async function handleUserChatMessage(userText) {
    if (!userText || !userText.trim()) return;
    const text = userText.trim();

    addMessageToFeed('user', text);
    $('chatHeadline').textContent = 'Vera is analyzing...';
    setSystemVoiceState('processing');

    // Check backend
    if (state.backendOnline) {
      try {
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/assistant/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: state.conversationHistory.slice(-6),
            current_repo: state.activeRepo,
            caller_role: state.callerRole || 'guest'
          })
        });
        if (res.ok) {
          const data = await res.json();
          addMessageToFeed('assistant', data.spoken_reply, {
            title: data.title,
            rawDisplay: data.display_reply,
            sources: data.source_links
          });
          speechEngine.speak(data.spoken_reply);
          state.lastAssistantReply = data.spoken_reply;
          $('chatHeadline').textContent = 'Response ready.';
          return;
        }
      } catch (_) {}
    }

    // Client-side intelligent fallback (Honest Grounded Mode)
    const lower = text.toLowerCase();
    let replySpoken = '';
    let replyDisplay = '';
    let title = 'Vera Intelligence';

    // 1. Identity / Name Question
    if (lower.includes('what is your name') || lower.includes("what's your name") || lower.includes('who are you') || lower.includes('what are you called')) {
      replySpoken = "I'm Vera. I assist with technical questions, explore projects, and help you find what you need.";
      replyDisplay = "### Vera // Personal Engineering Intelligence\n- **Identity**: Vera (pronounced *VEER-uh*)\n- **Operator**: Prathmesh Mante (`prathmeshmante-glitch`)\n- **Directives**: Hands-free voice reconnaissance, architecture inspection, and engineering briefings.";
      title = 'Vera // Identity';
    } 
    // 2. Comparison: BrandForge vs InkLoom
    else if ((lower.includes('compare') || lower.includes('vs') || lower.includes('versus') || lower.includes('difference')) && (lower.includes('brandforge') || lower.includes('inkloom'))) {
      replySpoken = "Comparing BrandForge and InkLoom. BrandForge is a distributed brand intelligence workspace using Next.js and LangGraph agent pipelines, while InkLoom specializes in mathematical vector geometry and generative logo synthesis.";
      replyDisplay = "### Architectural Comparison // BrandForge vs InkLoom\n- **BrandForge**: Next.js (TypeScript) + FastAPI + LangGraph stateful agent cycles + Supabase.\n- **InkLoom**: Specialized generative geometry models, SVG vector engine, and clear-space algorithmic constraints.\n- **Trade-off**: Stateful graph cycles vs mathematical vector rule enforcement.";
      title = 'Vera // Project Comparison';
    }
    // 3. Contextual Reference to Active Repository
    else if (lower.includes('this repository') || lower.includes('this repo') || lower.includes('this project') || lower.includes('its backend') || lower.includes('its architecture')) {
      if (state.activeRepo) {
        const repoObj = state.repositories.find(r => r.name.toLowerCase() === state.activeRepo.toLowerCase());
        const lang = repoObj ? (repoObj.language || 'modern') : 'modern';
        replySpoken = `Reviewing ${state.activeRepo}. Built on a ${lang} stack with verified components in public repositories.`;
        replyDisplay = `### Active Repository Inspection: ${state.activeRepo}\n- **Context**: Currently selected repository from Mission Archive.\n- **Primary Stack**: ${lang}\n- **Full Source**: [GitHub Repository](https://github.com/prathmeshmante-glitch/${state.activeRepo})`;
        title = `Inspection // ${state.activeRepo.toUpperCase()}`;
      } else {
        replySpoken = "Which project would you like me to inspect? You can choose BrandForge or InkLoom, or select one from the Mission Archive.";
        replyDisplay = "### Target Selection Required\nPlease select BrandForge or InkLoom, or click a mission in the archive.";
        title = 'Vera // Awaiting Target';
      }
    }
    // 4. Specific Projects
    else if (lower.includes('brandforge')) {
      replySpoken = 'BrandForge is an AI brand-intelligence workspace built with Next.js, FastAPI, LangGraph, and Supabase. It coordinates agentic workflows to produce structured product strategy.';
      replyDisplay = '### BrandForge Engineering Review\n- **Client**: Next.js & TypeScript UI with optimistic canvas updates.\n- **Agents**: LangGraph graph workflows translating brand inputs into design constraints.\n- **Storage**: Supabase PostgreSQL persistence.\n- **Live Production URL**: [brandforge-jade.vercel.app](https://brandforge-jade.vercel.app)';
      title = 'BrandForge // Analysis';
    } else if (lower.includes('inkloom')) {
      replySpoken = 'InkLoom employs specialized generative models for algorithmic logo construction, harmonizing brand analysis with vector lockups and clear-space guidelines.';
      replyDisplay = '### InkLoom Model Architecture\n- **Design**: Algorithmic vector typography and mark synthesis.\n- **Stack**: TypeScript, generative constraint engines, SVG pipelines.\n- **Status**: Live project at [inkloom.art](https://inkloom.art)';
      title = 'InkLoom // Analysis';
    } else if (lower.includes('stack') || lower.includes('tech') || lower.includes('language')) {
      replySpoken = 'The public engineering matrix verifies active usage of TypeScript, Python, Next.js, FastAPI, LangGraph, and Supabase across live repositories.';
      replyDisplay = '### Verified Technology Telemetry\n- **Languages**: TypeScript, Python, C++, HTML/CSS\n- **Frameworks**: Next.js, React, FastAPI, LangGraph\n- **Infrastructure**: Supabase, Docker, GitHub Actions\n*(Evidence retrieved directly from repository manifests)*';
      title = 'Tech Matrix // Audit';
    } else if (lower.includes('senior') || lower.includes('review') || lower.includes('code review')) {
      replySpoken = 'In reviewing these repositories, a senior engineer would prioritize agent boundary isolation, token cost limits, state hydration in Next.js, and API rate limits.';
      replyDisplay = '### Senior Architectural Review Points\n1. **Agent Guardrails**: Validating that LangGraph cycles cannot loop indefinitely.\n2. **Type Safety**: Ensuring shared schema definitions between FastAPI (Pydantic) and Next.js (TypeScript).\n3. **Decoupled Fallbacks**: Maintaining client operation when upstream model APIs experience latency.';
      title = 'Senior Engineering Review';
    } else {
      replySpoken = `Query acknowledged. I am tracking ${state.repositories.length} public engineering repositories for operator Prathmesh Mante. Would you like a briefing on BrandForge or InkLoom?`;
      replyDisplay = `### Vera Standing By\nI analyzed your inquiry: *"${text}"*.\n\nYou can ask about:\n- **Specific Projects**: "Explain BrandForge", "What is InkLoom?"\n- **Architecture**: "How does the backend interact with the frontend?"\n- **Comparison**: "Compare BrandForge and InkLoom."`;
    }

    addMessageToFeed('assistant', replySpoken, { title, rawDisplay: replyDisplay });
    speechEngine.speak(replySpoken);
    state.lastAssistantReply = replySpoken;
    $('chatHeadline').textContent = 'Response ready.';
  }

  function addMessageToFeed(role, text, options = {}) {
    const feed = $('conversationFeed');
    if (!feed) return;

    // Record in memory history
    state.conversationHistory.push({ role, content: text });

    const entry = document.createElement('div');
    entry.className = `feed-entry ${role}-entry`;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const badge = role === 'assistant' ? 'Vera' : 'OPERATOR';

    let contentHtml = '';
    if (role === 'assistant') {
      contentHtml = `
        <div class="entry-meta">
          <span class="entry-badge">${options.title || badge}</span>
          <span class="entry-time">${timeStr}</span>
        </div>
        <div class="entry-content">
          <p class="spoken-summary">“${text}”</p>
          ${options.rawDisplay ? `<div class="entry-technical-details">${renderMarkdownSnippet(options.rawDisplay)}</div>` : ''}
          ${options.details ? `<div class="entry-technical-details">${options.details}</div>` : ''}
          ${options.sources ? `
            <div class="entry-source-links">
              ${options.sources.map(s => `<a href="${s.url}" target="_blank" rel="noopener" class="source-pill">${s.title} ↗</a>`).join('')}
            </div>` : ''}
        </div>
      `;
    } else {
      contentHtml = `
        <div class="entry-meta">
          <span class="entry-badge">${badge}</span>
          <span class="entry-time">${timeStr}</span>
        </div>
        <div class="entry-content">
          <p>${text}</p>
        </div>
      `;
    }

    entry.innerHTML = contentHtml;
    feed.appendChild(entry);
    feed.scrollTop = feed.scrollHeight;
  }

  function renderMarkdownSnippet(text) {
    if (!text) return '';
    return text
      .replace(/^### (.*$)/gim, '<h4>$1</h4>')
      .replace(/^## (.*$)/gim, '<h3>$1</h3>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--gold-primary); text-decoration:underline;">$1</a>')
      .replace(/\n\n/g, '<br/>');
  }

  // --- MEMORY & PREFERENCE MANAGEMENT ---
  function loadMemoryState() {
    const raw = localStorage.getItem('vera_preferences');
    if (raw) {
      try {
        state.visitorPreferences = Object.assign(state.visitorPreferences, JSON.parse(raw));
      } catch (_) {}
    }
    renderMemoryUI();
  }

  function saveMemoryState() {
    if (!state.memoryEnabled) return;
    localStorage.setItem('vera_preferences', JSON.stringify(state.visitorPreferences));
    renderMemoryUI();
  }

  function renderMemoryUI() {
    const list = $('memoryEntriesList');
    if (!list) return;

    if (!state.memoryEnabled) {
      list.innerHTML = '<div class="memory-entry-row"><span class="mer-key">MEMORY DISABLED</span><span class="mer-val">No preferences are currently being recorded.</span></div>';
      return;
    }

    const entries = [
      { key: 'Preferred Name', val: state.visitorPreferences.preferredName, id: 'pref_name' },
      { key: 'Explanation Depth', val: state.visitorPreferences.explanationDepth, id: 'pref_depth' },
      { key: 'Voice Output', val: state.visitorPreferences.voiceEnabled ? 'Enabled' : 'Muted', id: 'pref_voice' },
      { key: 'Speaking Speed', val: `${state.speechRate}x`, id: 'pref_speed' }
    ];

    list.innerHTML = entries.map(e => `
      <div class="memory-entry-row">
        <div>
          <span class="mer-key">${e.key}:</span>
          <span class="mer-val">${e.val}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="mer-time">STORED LOCAL</span>
          <button class="mer-del" data-key="${e.id}" title="Delete preference">✕</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.mer-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const k = btn.dataset.key;
        if (k === 'pref_name') state.visitorPreferences.preferredName = 'Visitor';
        if (k === 'pref_depth') state.visitorPreferences.explanationDepth = 'concise';
        saveMemoryState();
      });
    });
  }

  // --- SYSTEM DIAGNOSTICS & TELEMETRY ---
  function updateDiagnosticsHUD() {
    // 1. Browser Speech Recognition
    const hasSR = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    if ($('diagSpeechRec')) {
      $('diagSpeechRec').textContent = hasSR ? 'SUPPORTED' : 'UNAVAILABLE';
      $('diagSpeechRec').style.color = hasSR ? 'var(--mint-success)' : 'var(--red-error)';
      $('diagSpeechRecDetail').textContent = hasSR ? 'Web Speech API active (Chrome/Edge)' : 'Use Chrome or Edge for voice recognition';
    }

    // 2. Browser Speech Synthesis
    const hasSynth = 'speechSynthesis' in window;
    if ($('diagSpeechSynth')) {
      $('diagSpeechSynth').textContent = hasSynth ? 'ACTIVE' : 'UNAVAILABLE';
      $('diagSpeechSynthDetail').textContent = hasSynth ? `${state.availableVoices.length} voices loaded` : 'TTS unsupported';
    }

    // 3. Microphone permission
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' }).then(res => {
        if ($('diagMicPerm')) {
          $('diagMicPerm').textContent = res.state.toUpperCase();
          $('diagMicPerm').style.color = res.state === 'granted' ? 'var(--mint-success)' : 
                                         res.state === 'denied' ? 'var(--red-error)' : 'var(--amber-warning)';
          $('diagMicPermDetail').textContent = `Permission state: ${res.state}`;
        }
      }).catch(() => {});
    }

    // 4. AI Provider status
    if ($('diagAiProvider')) {
      $('diagAiProvider').textContent = state.backendOnline ? 'CONNECTED' : 'DEGRADED';
      $('diagAiProvider').style.color = state.backendOnline ? 'var(--mint-success)' : 'var(--amber-warning)';
      $('diagAiProviderDetail').textContent = state.backendOnline ? 'Configured in FastAPI backend' : 'Deterministic Truth Protocol';
    }
  }

  // --- SETTINGS UI & CONTROLS ---
  function updateVoicePickerUI() {
    const select = $('voicePickerSelect');
    if (!select || !state.availableVoices.length) return;

    select.innerHTML = '<option value="">Auto-Detect Best Feminine Voice</option>' + 
      state.availableVoices
        .filter(v => v.lang.startsWith('en'))
        .map(v => `<option value="${v.name}">${v.name} (${v.lang})</option>`)
        .join('');

    select.addEventListener('change', () => {
      const chosen = state.availableVoices.find(v => v.name === select.value);
      if (chosen) state.selectedVoice = chosen;
      else speechEngine.selectBestFeminineVoice();
    });
  }

  // --- INITIALIZATION & EVENT BINDINGS ---
  function initClock() {
    const clock = $('clock');
    const update = () => {
      if (clock) clock.textContent = new Date().toLocaleTimeString([], { hour12: false });
    };
    update();
    setInterval(update, 1000);
  }

  function bindEventListeners() {
    // 1. Authorization overlay actions
    const beginVoiceBtn = $('beginVoiceBtn');
    const retryVoiceBtn = $('retryVoiceBtn');

    if (beginVoiceBtn) {
      beginVoiceBtn.addEventListener('click', () => {
        sfx.init();
        speechEngine.startListening('auth');
      });
    }

    if (retryVoiceBtn) {
      retryVoiceBtn.addEventListener('click', () => {
        sfx.init();
        speechEngine.startListening('auth');
      });
    }

    // 2. Sound Toggle
    const soundToggle = $('soundToggle');
    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        state.soundEnabled = !state.soundEnabled;
        $('soundLabel').textContent = state.soundEnabled ? 'SFX ON' : 'SFX OFF';
        $('soundIcon').textContent = state.soundEnabled ? '🔊' : '🔇';
        sfx.playChime('click');
      });
    }

    // 3. Summon V.E.R.A. Hero Action
    const summonBtn = $('summonVeraBtn');
    if (summonBtn) {
      summonBtn.addEventListener('click', () => {
        sfx.playChime('click');
        if (!state.authorized) {
          $('welcomeOverlay').classList.remove('hidden');
          return;
        }
        $('core').scrollIntoView({ behavior: 'smooth' });
        speechEngine.speak("Vera online. What shall we inspect?");
      });
    }

    // 4. Request Briefing Hero Action
    const requestBriefingBtn = $('requestBriefingBtn');
    if (requestBriefingBtn) {
      requestBriefingBtn.addEventListener('click', () => {
        sfx.playChime('click');
        if (!state.authorized) {
          $('welcomeOverlay').classList.remove('hidden');
          return;
        }
        $('briefing').scrollIntoView({ behavior: 'smooth' });
        triggerSpokenBriefing();
      });
    }

    // 5. Trigger Spoken Briefing
    const triggerAudioBriefingBtn = $('triggerAudioBriefingBtn');
    if (triggerAudioBriefingBtn) {
      triggerAudioBriefingBtn.addEventListener('click', triggerSpokenBriefing);
    }

    function triggerSpokenBriefing() {
      const text = $('briefingBodyText').textContent.trim();
      speechEngine.speak(text);
    }

    // 6. Hands-Free & Always-Listening Voice Controls
    const alwaysListenBtn = $('alwaysListenToggleBtn');
    if (alwaysListenBtn) {
      alwaysListenBtn.addEventListener('click', () => {
        sfx.init();
        if (veraVoiceEngine.alwaysListening) {
          veraVoiceEngine.disableAlwaysListening();
        } else {
          veraVoiceEngine.enableAlwaysListening();
        }
      });
    }

    const pauseListenBtn = $('pauseListenBtn');
    if (pauseListenBtn) {
      pauseListenBtn.addEventListener('click', () => {
        sfx.init();
        if (veraVoiceEngine.isPaused) {
          veraVoiceEngine.resumeListening();
        } else {
          veraVoiceEngine.pauseListening();
        }
      });
    }

    const pushToTalkBtn = $('pushToTalkBtn');
    if (pushToTalkBtn) {
      pushToTalkBtn.addEventListener('click', () => {
        sfx.init();
        veraVoiceEngine.pushToTalk();
      });
    }

    const interruptSpeechBtn = $('interruptSpeechBtn');
    if (interruptSpeechBtn) {
      interruptSpeechBtn.addEventListener('click', () => {
        veraVoiceEngine.stopSpeaking();
      });
    }

    const muteVoiceBtn = $('muteVoiceBtn');
    if (muteVoiceBtn) {
      muteVoiceBtn.addEventListener('click', () => {
        veraVoiceEngine.toggleMuteVoice();
      });
    }

    const toggleVoiceBtn = $('toggleVoiceBtn');
    if (toggleVoiceBtn) {
      toggleVoiceBtn.addEventListener('click', () => {
        sfx.init();
        if (state.voiceState === 'capturing_command' || state.voiceState === 'listening') {
          veraVoiceEngine.stopListening();
        } else {
          veraVoiceEngine.pushToTalk();
        }
      });
    }

    const stopSpeechBtn = $('stopSpeechBtn');
    if (stopSpeechBtn) {
      stopSpeechBtn.addEventListener('click', () => {
        veraVoiceEngine.stopSpeaking();
      });
    }

    const repeatSpeechBtn = $('repeatSpeechBtn');
    if (repeatSpeechBtn) {
      repeatSpeechBtn.addEventListener('click', () => {
        if (state.lastAssistantReply) {
          veraVoiceEngine.speak(state.lastAssistantReply);
        }
      });
    }

    const clearChatBtn = $('clearChatBtn');
    if (clearChatBtn) {
      clearChatBtn.addEventListener('click', () => {
        sfx.playChime('click');
        $('conversationFeed').innerHTML = '';
        state.conversationHistory = [];
        addMessageToFeed('assistant', 'Conversation history cleared. Ready for fresh reconnaissance.');
      });
    }

    // 7. Chat Input Form
    const chatForm = $('chatInputForm');
    if (chatForm) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = $('chatTextInput');
        const text = input.value.trim();
        if (text) {
          input.value = '';
          handleUserChatMessage(text);
        }
      });
    }

    // 8. Quick Prompts
    document.querySelectorAll('.qp-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        sfx.playChime('click');
        handleUserChatMessage(chip.dataset.prompt);
      });
    });

    // 9. Intelligence Targeted Inquiries
    document.querySelectorAll('.intel-action-item').forEach(item => {
      item.addEventListener('click', () => {
        sfx.playChime('click');
        const query = item.dataset.query;
        handleUserChatMessage(query);
      });
    });

    // 10. Archive Toolbar Filter & Search
    const searchInput = $('repoSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim();
        renderRepositoriesGrid();
      });
    }

    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        sfx.playChime('click');
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.activeFilter = pill.dataset.filter;
        renderRepositoriesGrid();
      });
    });

    const refreshReposBtn = $('refreshReposBtn');
    if (refreshReposBtn) {
      refreshReposBtn.addEventListener('click', () => {
        sfx.playChime('click');
        loadRepositories();
      });
    }

    // 11. Navigation Scroll Spy & Smooth Transition
    document.querySelectorAll('.nav-item').forEach(link => {
      link.addEventListener('click', (e) => {
        sfx.playChime('click');
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        link.classList.add('active');
      });
    });

    // 12. Settings Controls
    const speedSlider = $('speechRateSlider');
    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        state.speechRate = parseFloat(e.target.value);
        $('speechRateVal').textContent = `${state.speechRate.toFixed(2)}x`;
      });
    }

    const relockBtn = $('relockDeckBtn');
    if (relockBtn) {
      relockBtn.addEventListener('click', () => {
        sfx.playChime('click');
        state.authorized = false;
        document.body.classList.add('locked');
        $('welcomeOverlay').classList.remove('hidden');
        $('authStatusText').textContent = 'COMMAND DECK LOCKED · AUTHORIZATION REQUIRED';
      });
    }

    // 13. Preferences Save
    const savePrefBtn = $('savePrefBtn');
    if (savePrefBtn) {
      savePrefBtn.addEventListener('click', () => {
        sfx.playChime('click');
        const nameVal = $('prefNameInput').value.trim();
        const depthVal = $('prefDepthSelect').value;
        if (nameVal) state.visitorPreferences.preferredName = nameVal;
        state.visitorPreferences.explanationDepth = depthVal;
        saveMemoryState();
        speechEngine.speak(`Preferences updated for ${state.visitorPreferences.preferredName}.`);
      });
    }

    const clearMemoryBtn = $('clearMemoryBtn');
    if (clearMemoryBtn) {
      clearMemoryBtn.addEventListener('click', () => {
        sfx.playChime('click');
        localStorage.removeItem('vera_preferences');
        state.visitorPreferences = { preferredName: 'Visitor', explanationDepth: 'concise', voiceEnabled: true };
        renderMemoryUI();
      });
    }

    const toggleMemoryBtn = $('toggleMemoryEnabledBtn');
    if (toggleMemoryBtn) {
      toggleMemoryBtn.addEventListener('click', () => {
        sfx.playChime('click');
        state.memoryEnabled = !state.memoryEnabled;
        toggleMemoryBtn.textContent = state.memoryEnabled ? 'DISABLE MEMORY' : 'ENABLE MEMORY';
        renderMemoryUI();
      });
    }
  }

  // --- SYSTEM BOOT SEQUENCE ---
  async function boot() {
    initClock();
    bindEventListeners();
    loadMemoryState();
    updateDiagnosticsHUD();
    renderArchitectureGraph('brandforge');

    // Lock session initially to maintain requested passphrase gate
    document.body.classList.add('locked');

    // Run background connection checks
    await checkBackendConnectivity();
    await loadRepositories();
    updateDiagnosticsHUD();
  }

  // Launch boot on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
