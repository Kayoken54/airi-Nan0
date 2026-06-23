# Nan0-AIRI Integration: Architectural Realignment & Feedback

This document outlines the architectural feedback and design requirements for integrating the Nan0 cognition system into the AIRI ecosystem. It serves as a guide to realign the integration strategy with AIRI's core design principles, specifically addressing the tech stack, Discord revamp specifications, and session isolation.

---

## 1. Core Principle: Native Web-Technology Stack (Zero Python Sidecar)

We reject the proposal to maintain a standalone Python process or sidecar to hoist Nan0's memory and cognition engines. Doing so introduces significant maintenance overhead, installer bloat, and breaks cross-platform desktop/web parity.

### Why a Python Subprocess is Rejected:
* **Breaks Web Stage (`web-stage`)**: AIRI supports a pure browser deployment (`web-stage`). A web browser cannot spin up a local Python process. By porting Nan0 to native TypeScript/JavaScript, the exact same memory and cognition features can run seamlessly on both the Electron Desktop client and the web browser.
* **Installer Bloat**: Bundling a Python runtime, virtual environments, and heavy libraries (like PyTorch or SQLite/Chroma extensions) adds hundreds of megabytes to the Electron application bundle.
* **Fragile Dependency Management**: Managing Python paths, package compilation, and OS dependencies on end-user machines is notoriously error-prone compared to unified npm/Vite dependency management.

### Recommended Strategy for Porting Nan0 Memory & Cognition:
* **Memory & Vector Search**: Map Nan0's episodic memory and diary systems to **Orama** (browser-native vector database already used in AIRI) and **unstorage** (backed by IndexedDB). All vector indexing and embeddings can run client-side using `transformers.js` or standard cloud LLM embedding endpoints.
* **Thought Engine & Cognition Router**: Port these modules directly to TypeScript as standard Pinia stores in `packages/stage-ui/src/stores/modules/`. This keeps the thought-first lifecycle (`observation -> interpretation -> thought -> speech`) integrated directly into the chat ingestion pipeline without crossing process boundaries.
* **Runtime Guard**: Port the safety validation and tag parsing to a TypeScript utility/composable to parse markers (like `<|ACT...|>`) before they reach TTS and UI rendering.

---

## 2. Discord Revamp Realignment

The integration must adhere strictly to the design principles laid out in [feat-discord-revamp.md](file:///Users/richardpinedo/Projects.nosync/airi/airi_dasilva333/docs/feat-discord-revamp.md).

### A. Restore `puppet` Mode (Default Local Playback)
* **Spec**: `/voicemode mode: puppet | voicenote | none`
* **Feedback**: The integration proposal omitted `puppet` mode. `puppet` mode is the current default behavior: audio is played locally on the desktop app speaker system while the text interaction is forwarded to Discord.
* **Importance**: This is crucial for "home base" users who want the high-fidelity desktop TTS to play in their room while controlling the bot remotely. Deleting this option or failing to support it breaks the core desktop loop.

### B. Simplify `/voicecall` (Classic TTS Engine focus)
* **Spec**: `/voicecall mode: classic | gemini`
* **Feedback**: The proposal to route Gemini Live raw audio through an intermediate `STT -> thought engine -> TTS` loop is redundant and costly. Gemini Live natively processes raw audio and returns text transcriptions and audio output **simultaneously** with sub-second latency. Forcing a serial text-translation loop defeats the purpose of the Live API's low-latency design.
* **Gemini Live Cost**: Running persistent Bidirectional WebSockets with Gemini Live is highly expensive.
* **Realignment**: Since Kyo wants to utilize Deepgram STT, a custom LLM (e.g., local/custom endpoints), and a custom high-fidelity TTS (rather than Gemini's native voice), the integration should **focus entirely on implementing the classic `tts` mode** (Discord Audio -> STT -> LLM -> TTS -> Discord Audio) and leave the Gemini Live WebSocket bridge deferred/unimplemented.

---

## 3. Session & Character Isolation

AIRI currently lacks channel-level session boundaries, meaning messages from different channels can bleed into a single active session. We welcome the audit's recommendation for per-channel session tracking, with the following implementation design:

### Character-to-Session Schema:
1. Discord slash command `/character` allows switching characters per channel.
2. Therefore, each channel must maintain its own active character state.
3. The routing mapping must follow:
   $$\text{channelId} \longrightarrow \text{activeCharacterId} \longrightarrow \text{activeSessionId}$$
4. This ensures that:
   * Channel A can talk to Lain, maintaining Session 1.
   * Channel B can talk to Sparkle, maintaining Session 2.
   * Changing the character in Channel A will automatically resolve or instantiate a new session scoped specifically under that character for that channel.

---

## Conclusion & Action Items

To ensure successful integration into the AIRI ecosystem:
1. Re-implement Nan0's memory and cognition router in TypeScript. Do not package or rely on Python sidecars.
2. Implement `/voicemode` with full support for `puppet`, `voicenote`, and `none` modes.
3. Implement `/voicecall` focusing on the classic `tts` engine (Deepgram + Custom LLM/TTS).
4. Enforce per-channel session/character mapping to resolve multi-guild context tracking.
