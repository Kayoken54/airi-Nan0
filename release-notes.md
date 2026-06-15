# Release Notes: AIRI v0.9.9-stable.20260615

Welcome to **AIRI v0.9.9-stable.20260615**! This stable release delivers a major upgrade to the BYOS Cloud Sync & Onboarding engine (featuring Google AppData restore integration, local-wins conflict strategies, and PGlite database support), introduces bundled Audio Studio voice profiles for character cards, adds multi-model stage controls, and addresses key visual bugs in Web Stage layouts.

---

## 🚀 Key Highlights

### ☁️ Google AppData Sync & Onboarding Upgrades
* **Google AppData Backup Flow**: Wired up the actual Google AppData cloud backup and restore sequence, complete with onboarding verification, visual progress simulation, and profile avatar population.
* **PGlite DB Integration**: Integrated embedded **PGlite** database structures to power the backend onboarding auth linkage.
* **Sync Engine Stabilization**: Restructured conflict resolution to use a **"local-wins"** strategy, prevented multi-window scheduling collisions in Electron, optimized reconciliation via content size pre-checks, and fixed duplicate localStorage keys.
* **Remote Catalog in Selective Sync**: Populated the selective sync visual tree directly with remote catalog assets and added a manual tree refresh control.

### 🎭 Actor Stage & Multi-Model Controls
* **Bundled Audio Studio Profiles**: Character cards (`.json` or archives) can now bundle and auto-import customized Audio Studio voice profiles.
* **Batch VRM Importer**: Added support for selecting and batch importing multiple VRM models at once in the model selector.
* **Motion & 'None' Stage Options**: Unified the Control Strip settings to support motion trigger libraries and a 'None' option for all 4 character stage model types (Live2D, VRM, Spine, MMD).
* **Actor Sync Barriers**: Implemented a playback barrier, prefetching buffers, dynamic state scoping, and single-flight guards to synchronize actors smoothly across processes.

### 🎨 Visual & Layout Improvements
* **Spine Web Glitch Fix**: Resolved WebGL context locking issues and NaN bone offset layout calculations affecting Spine rendering on the web landing stage.
* **Selectable Actor Chips**: Allowed text chips inside the chat log to be selected and copied naturally.
* **Dating Sim Window Persistence**: Fixed positioning and window state restoration bugs when opening or closing the Dating Sim panel.
