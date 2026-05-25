# Release Notes: AIRI v0.9.3-stable

Welcome to **AIRI v0.9.3-stable**! This release brings a massive overhaul to our Live2D model integration, introducing interactive tactile feedback, in-memory multi-model Zip splitting, and motion audio playback. It also resolves critical text-streaming issues with tool calls, fixes emoji corruption, and adds several UX polish wins.

## 🚀 Key Highlights

### 🎭 Live2D Tactile Mode & Multi-Model Ingestion
* **Full Tactile Mode & Hover Glow**: Implemented an interactive tactile feedback mode for Live2D models, including highly precise hit-test coordinate translation, smart `hitArea` motion mappings, and an aesthetic hover glow overlay indicating interactive zones.
* **In-Memory Zip Splitting & Discovery**: Designed an in-memory multi-model Zip file splitter with real-time toast feedback. It automatically discovers motions, fixes manifest naming errors, and heals motions dictionaries on the fly.
* **Motion Audio Playback**: Enabled motion-associated audio playback for both Live2D and Spine characters on the actor route, ensuring referenced audio assets are correctly packaged during ingestion.
* **LocalStorage Quota Fix**: Converted parameter metadata and available motions to reactive refs to prevent browser `QuotaExceededError` issues in `localStorage`.

### 🛠️ Streamed Text & Tool Call Polish
* **Dynamic Parser Recreation**: Solved the issue where text arriving immediately after a native tool call was dropped by dynamically recreating the parser and interceptor instances.
* **Text Buffer Flushing**: Fixed text slicing bugs by forcefully flushing parser buffers before enqueuing tool calls.
* **Emoji Recovery**: Enhanced `healMozibake` to correctly handle surrogate pairs, preventing emoji corruption.

### 🖼️ UI/UX Polish & Stability
* **Fullscreen Lightbox Picker**: Added a gorgeous fullscreen preview lightbox within the stage background picker.
* **Stabilized Window Behavior**: Removed the resource-intensive always-on-top watcher loop from the main window to improve responsiveness and eliminated infinite bounds-clobbering loops.
* **Cross-Window Syncing**: Added cross-window synchronization for session deletions, and resolved state-sync race conditions when editing messages.

***

## 📝 Detailed Changelog

### 🖥️ Desktop (stage-tamagotchi) & Electron Main Process
* Removed always-on-top watcher from the main window to stabilize bounds.
* Resolved state synchronization loops and Shift+Enter double-ingestion bugs.
* Synchronized chat session deletions across multiple open windows.

### 📦 UI & Shared Modules (stage-ui / stage-shared)
* Implemented unified ingestion and self-healing cleansing pipelines for complex Live2D models.
* Ported AvailableMotions to refs, removing LocalStorage write spikes.
* Resolved motion audio playback in actor routes.
* Stabilized runtime motion cycling and layout overflows.
