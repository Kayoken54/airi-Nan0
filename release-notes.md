# 🚀 AIRI v0.9.12-stable.20260630 — Release Notes

This release introduces a revolutionary **Discord Bidirectional Audio Bridge for Gemini Live**, launches the **AnimaDex Guided Card Creator**, adds **Global User Profiles & Settings**, and brings major upgrades to the **Audio Studio & Wizard workflows**.

---

## ✨ Key Highlights

### 🎙️ Discord Voice & Gemini Live Audio Bridge
* **Pure JS Bidirectional Audio**: Implemented a native JS audio bridge connecting Discord voice channels directly to Gemini Live sessions for real-time vocal interaction.
* **Auto-Session Lifecycle**: Wired up auto-start and auto-stop triggers that control Gemini Live voice sessions based on channel activity.
* **Summon/Leave Voice Commands**: Summon or dismiss the bot into a voice channel using `/summon` and `/leave`.
* **Rich Dashboard Widgets**: Implemented interactive Discord widgets with pagination for active status dashboard management, timeline histories, and character selector grids.
* **Elegant Transcript Formatting**: Automatically parses and bolds `[ACTOR]` tags while cleanly stripping formatting prefixes on outbound messages.

### 🐉 AnimaDex Guided Card Creator & Wizard Refinements
* **Guided Creator Page & Store**: Launched the new AnimaDex multi-step character card creator interface to streamline setup.
* **Visual Roster Settings Grid**: Implemented Step 2's visual layout layout grid, simplifying card portraits and model bindings.
* **Step 3 AI Story Idea Suggester**: Added clickable scenario cards, skeleton loading states, and custom prompting guidelines based on character archetypes.
* **Auto-Link & WD14 indexing**: Auto-upserts character series metadata, auto-prefills model/voice bindings in Step 2, and supports quick model previews or blacklist-protected unbinds.
* **Artistry Integrity**: Ensured safe deep cloning of artistry configuration blocks on card creation to prevent accidental mutations.

### 👤 User Profiles & Voice Configuration
* **Global User Profile Page**: Added a dedicated user-profile settings page, integrated with a central voice profile store.
* **Audio Studio Integration**: Added a **Quick Audio Studio Creator** modal directly into the guided card creator, allowing you to select, bind, or customize voice settings on the fly.
* **Always-On Local Engines**: Simplified provider configurations so local engines (`kokoro-local` and `moss-nano-local`) are treated as always configured.
* **Concept Speech Custom Voices**: Extracted the voice creator modal to support custom concept speech voice assignments.

### 🎭 Producer Panel & Artistry Enhancements
* **Choice Play-All button**: Added a "Play All" button to the `ProducerChoiceBubble` for sequential TTS playback of all alternative suggestion paths.
* **ComfyUI Image Journals**: Updated ComfyUI workflow instructions to use the `image_journal` format and added active workflow selection warning prompts.
* **Artistry Defaults**: Configured default artistry settings for new and existing cards (threshold 49, spawnMode bg, target assistant).

### 🔧 API Payload & Markdown Sanitization
* **Markdown Strip Fixes**: Cleared leading whitespace before markdown fences in raw output cleaners.
* **API Payload Validation**: Automatically omits empty tools arrays from outbound API payloads to prevent validation errors with upstream LLM providers.
