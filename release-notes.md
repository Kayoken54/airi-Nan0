# 🚀 AIRI v0.9.13-stable.20260704 — Release Notes

This release introduces brand new Discord slash commands (`/selfie`, `/vision`), implements **Discord Classic Voice Mode (STT/TTS)**, adds a new **AI Auto-Assign Voices configurator**, implements **User-configurable Idle Animations**, introduces **User Self-Concepts**, and delivers a major Quality-of-Life pass for system prompt and context control.

---

## ✨ Key Highlights

### 💬 New Discord Slash Commands
* **`/selfie` (New)**: A brand new headless capture command to generate camera snapshots of your character on command, supporting optional emotion triggers (e.g., proud, shy).
* **`/vision` (New)**: A brand new visual intake command that routes uploaded images to the VLM with a customizable filter toggle.
* **DPI Retina Selfie Fix**: Scaled canvas size by the device pixel ratio (DPR) to prevent blurry or cropped selfie captures on Retina/high-DPI screens.

### 🎙️ Discord Classic Voice Mode & Audio Upgrades
* **Classic Mode Audio Streaming**: Implemented raw PCM audio streaming and chunk streaming directly to voice channels in Classic mode without external dependency bottlenecks.
* **Classic Mode STT Ingestion**: Added local voice capturing and transcription parsing, automatically injecting classic voice channel transcripts into the active chat session.
* **Self-Speaker Muting**: Added local speaker playback suppression during active Discord voice calls to prevent annoying echo-back issues.

### ⚙️ Context Control & System Prompt QoL
* **Per-Character Tool Gating**: Added options to disable tool calls on a per-character basis. This allows you to reduce context size and prevent errors on models (like RWKV) that don't support tool usage.
* **Blank Field Preservation**: Restructured the system prompt compiler so that if you set fields to blank, they stay blank, preventing rogue default values from injecting unexpected instructions.

### 🧙 Wizard Voice Auto-Assign & Idle Animations
* **AI Auto-Assign Voices**: Implemented an automated batch configurator in the wizard to auto-match and bind appropriate voices with fallback proxies.
* **Per-Character Idle Animations**: You can now define and customize idle animations per actor directly in the wizard's auto-assign flow.
* **Narrator Voice Fallback**: Narrative cards will automatically fall back to the user's customized profile voice when dealing with multi-actor layouts.

### 👤 User Self-Concepts & Profiles
* **Self-Concept Wizard Option**: Introduced a dedicated step in Wizard Step 3 to register a "user self-concept" template (compiled under a generic `concept_user` key).
* **Profile Autofill**: Improved profile field autocomplete and shortcut handling during configuration.

### 🗣️ Transcription & Whisper Integration
* **App-Local Transcription**: Consolidated transcription configurations under a unified App (Local) provider with an interactive activation toggle.
* **Whisper-Local Updates**: Replaced standalone Whisper setups with an eventa-compatible Whisper worker that supports English-only optimized models.

### 🎭 Producer Lite (Auto Suggestions) Enhancements
* **Decoupled Preview Textareas**: Decoupled option previews, synchronized textareas, and added an option to auto-play all choices sequentially.

### 📦 Build & Dependency Packaging
* **Relative Paths in copy-deps**: Updated `copy-deps.ts` to resolve package dependencies relative to the workspace root directory.
* **Prism-media Externalization**: Externalized `prism-media` to resolve runtime errors related to `ffmpeg-static` loading.
