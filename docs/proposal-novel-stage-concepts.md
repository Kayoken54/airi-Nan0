# Proposal: Novel Stage-Chat Unification Concepts

This proposal outlines and evaluates three novel concepts designed to bridge the detached nature of the **Stage** (avatar window) and the **Chatbox** (text interaction window).

---

## The Core Problem

Currently, the **Stage** (running Live2D/VRM) and the **Chatbox** exist as detached Electron processes. While this provides great flexibility (allowing separate positioning, sizing, and multi-monitor setups), it introduces window-management fatigue. The user must manually position, resize, focus, and close both windows separately, separating the visual companion from the text history.

---

## Concept Scorecard & Overview

| Concept | Description | Viability | Hype / Addictive | Final Recommendation |
| :--- | :--- | :---: | :---: | :--- |
| **Idea 1** | **Inline Stage:** Top/bottom wide letterbox avatar embedded in chat history. | **7.0 / 10** | **8.0 / 10** | Cozy setup, but high WebGL/Canvas IPC routing overhead. |
| **Idea 2** | **Sidebar Stage:** Tall vertical avatar embedded directly in chat's right sidebar. | **8.0 / 10** | **8.5 / 10** | Consolidated Discord-like dashboard layout. |
| **Idea 3** | **Magic Wand Suggestions in Stage Whisper Dock:** Pill overlays on Stage that auto-play & apply text. | **9.5 / 10** | **10.0 / 10** | **[HIGHEST PRIORITY]** Fast feedback loop, highly game-like, low friction. |

---

## Deep Technical Analysis

### Concept 1: Inline Stage (Wide/Short Layout)
* **Mechanics:** Integrates a wide, short letterbox layout of the character face directly at the top or bottom of the chat history in `chat_messages.vue`.
* **Technical Considerations:**
  * **Process Bridging:** The avatar is rendered in `apps/stage-tamagotchi/src/renderer/pages/index.vue` (the main Stage page) using WebGL/Canvas loops. To render it inside `apps/stage-tamagotchi/src/renderer/pages/chat.vue` (the Chat page), we must either mount a duplicate Three.js/Live2D context inside the chat process (which increases GPU/memory usage) or pipe the frames via an offscreen canvas stream.
  * **Camera Coordinates:** Tight camera cropping to focus on the face in a wide landscape profile.
* **Component Path:** [chat.vue](file:///Users/richardpinedo/Projects.nosync/airi/airi_dasilva333/apps/stage-tamagotchi/src/renderer/pages/chat.vue) (view parent) / `chat_messages.vue` (history renderer).

---

### Concept 2: Sidebar Stage (Consolidated Dashboard)
* **Mechanics:** Toggles a vertical WebGL layout of the companion avatar directly inside the right sidebar of the Chat window (similar to a Discord voice call view or Twitch stream overlay).
* **Technical Considerations:**
  * **Camera Ratio:** Much easier than Concept 1, as standard portrait ratios (tall card) fit standard model ratios perfectly without extreme cropping.
  * **Process Restructuring:** Still requires bringing the rendering context (Three.js/Live2D loader and stores) inside the Chat window process or using a unified single-window layout.
* **Component Path:** [chat.vue](file:///Users/richardpinedo/Projects.nosync/airi/airi_dasilva333/apps/stage-tamagotchi/src/renderer/pages/chat.vue) (implementing the panel adjacent to `interactiveAreaRef`).

---

### Concept 3: Magic Wand Suggestions in Stage Whisper Dock
* **Mechanics:** Adding a Magic Wand button directly inside the Stage's Whisper Dock (inline text input). Clicking it displays suggestion titles as floating buttons (pills) on the Stage. The suggestions auto-play in sequence, highlighting each pill and feeding into the Caption Window, and clicking a pill applies it to the input.
* **Technical Considerations:**
  * **UI Overlay:** WhisperDock is implemented in [WhisperDock.vue](file:///Users/richardpinedo/Projects.nosync/airi/airi_dasilva333/packages/stage-ui/src/components/scenarios/chat/WhisperDock.vue). We can add the pill buttons and wand toggle directly as Vue overlays in this component.
  * **Direct Store Hookup:** We can import and watch `datingSimStore` (`packages/stage-ui/src/stores/dating-sim.ts` -> `choices`) to fetch the active choices without needing any cross-window IPC bridging for the data itself.
  * **Caption Pipeline:** Triggering the suggestions will leverage the same `'airi-caption-overlay'` broadcast system we just implemented, updating [caption.vue](file:///Users/richardpinedo/Projects.nosync/airi/airi_dasilva333/apps/stage-tamagotchi/src/renderer/pages/caption.vue) in real-time.
  * **TTS Autoplay:** Sequential playback uses the same `speechStore.speech` engine built for `ProducerChoiceBubble.vue`.
* **Component Paths:**
  * UI Input: [WhisperDock.vue](file:///Users/richardpinedo/Projects.nosync/airi/airi_dasilva333/packages/stage-ui/src/components/scenarios/chat/WhisperDock.vue)
  * Data/Choices Store: [dating-sim.ts](file:///Users/richardpinedo/Projects.nosync/airi/airi_dasilva333/packages/stage-ui/src/stores/dating-sim.ts)
  * Captions Overlay: [caption.vue](file:///Users/richardpinedo/Projects.nosync/airi/airi_dasilva333/apps/stage-tamagotchi/src/renderer/pages/caption.vue)
