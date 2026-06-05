# Release Notes: AIRI v0.9.6-stable.20260605

Welcome to **AIRI v0.9.6-stable.20260605**! This stable release marks the debut of our dual-track **AI Producer Subsystem** (separating lightweight stateless flow from rich story campaign orchestration), introduces critical Live2D interactivity and expression pooling upgrades, unlocks local offline AI execution via WebGPU, revamps card layout and management interfaces, and introduces critical BYOS (Bring Your Own Storage) backup synchronization enhancements.

---

## 🚀 Key Highlights

### 🎭 The AI Producer Subsystem (Decoupled Roles)
This release restructures our interaction and storyboard pipelines by splitting visual direction and dialogue choices into two clean operational modes:
* **Producer Lite (Stateless Suggestion Engine) — *Game-Changing Feature***:
  Unlike the full orchestration suites, **Producer Lite** operates entirely within the chatbox context. Using only the local conversation thread ($N$ turns), it generates context-aware, user-mimicking interactive suggestions on the fly. It is completely stateless, requiring **zero** configuration, database records, or storyline setups—making it an out-of-the-box assistant that works instantly on any character session.
* **Producer+ (Campaign & Story Orchestration)**:
  Includes the full-featured **Producer OE** (Open-Ended), **GD-IT** (Gameshow Host / Initial Turn), and **GD-NT** (Next Turn) engines. These tie suggestion choices directly to the Intimacy Engine's variables (`intimacyChange`, `tensionChange`, `mood`), storyline guidelines, local scene settings, and custom encounter rules.

### 🎨 Live2D Interactivity & Expression Enhancements
* **Global Tactile Interaction**: Unlocked canvas mouse clicks for Live2D models at all times by decoupling mouse events from the 3D VRM orbit camera restriction.
* **Dynamic Tactile Expression Pooling**: Replaced repetitive exact-name expression triggers with a categorical pooling system. Clicking specific body zones (sensitive areas, headpats, hand regions) randomly triggers contextually appropriate expression files from available pools.
* **LLM Emotion Keyword Clustering**: Upgraded the ACT pipeline emotion-matching logic to map LLM-requested emotions to broader synonym and bilingual Japanese/English keyword clusters (e.g., mapping "mad" to "angry.exp3.json").

### ☁️ BYOS (Bring Your Own Storage) & Cloud Sync
* **Ignored Stores Restored**: Critical data stores that were previously left out of automated cloud backups are now fully synchronized:
  * **Short-Term Memory (STMM)**
  * **Lifetime Memory (LTMM)**
  * **Display Models**
* **Cross-Window Reactive Sync**: Implemented reactive sync broadcasts for the newly restored stores. Updating models or configurations in one window immediately propagates changes across all active Electron frames.
* **Conflict & Attachment Guards**: Added conflict-resolution safety checks for Director Notes and fixed sync behavior for cross-device image attachments.
* **Quota Overlap Prevention**: Shifted local card databases to IndexedDB to prevent `QuotaExceededError` crashes during sync restoration of large collections.

### 🎮 Settings UI & Page Layout Revamps
* **Compact Card Toolbar**: Compressed the Search, Sort, Import, and Create actions into a single-line 38px toolbar. Search expands smoothly on click, and Import toggles a clean drawer below the bar.
* **Instant Card Import**: Added a page-wide dragover backdrop overlay. Drop any SillyTavern-style `.json` or `.png` card anywhere on the window to import immediately.
* **Responsive Layout Grid**: Configured the Card Editor list to display in **2 columns** for portrait viewports (maximizing space above the fold) and **4 columns** for landscape layout.
* **Menu Reorganization**: Relocated "Dating Sim Preferences" under the "Memory" section in the settings menu index, renaming it to "Dating Sim" and simplifying the description to fit the compact settings layout.

### 🧠 Off-line WebGPU & Inference Engine
* **Local WebGPU RWKV-7 & Whisper**: Integrated local keyless inference engines utilizing WebGPU execution runners (`web-rwkv`) and Whisper-local STT for offline operation.
* **Hugging Face Downloader**: Implemented a global Hugging Face token entry setting to facilitate stable downloads of local models (RWKV-7, Kokoro, Whisper) with local browser caching.
* **Speech Provider Fallbacks**: Added interactive fallback buttons for speech providers when run on unsupported systems.

### ⚙️ Desktop Stabilization & Fixes
* **Window Bounds & Magnetism**: Restored control strip bounds persistence on refresh and improved desktop edge magnetism snapping routines.
* **Typecheck Cleanup**: Resolved typescript compiler and bundler type mismatch errors in settings router imports, `@moeru/three-mmd` definitions, and `electron-vueuse` element types.
