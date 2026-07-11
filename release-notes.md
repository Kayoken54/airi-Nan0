# 🚀 AIRI v0.9.16-stable.20260711 — Release Notes

This release introduces the **Rehearsal Room (unified emotion/motion iteration)**, upgrades the **Actor Stage (VRM rendering performance and magic wand overlays)**, stabilizes the **Captions renderer**, and refines the **AIRI Card Settings & Import pipeline**.

---

## ✨ Key Highlights

### 🎭 Actor Stage
* **VRM Rendering Performance**: Removed a high-overhead deep watcher on Three.js `vrmGroup` objects, replacing it with shallow watchers on specific coordinates to improve frame rates.
* **Grouped Control Pill**: Redesigned the top-right controls into a smaller, unified control pill with an integrated quick-hide button.
* **Right-Click Only Controls**: Swapped trigger logic in model controls to PopoverAnchor, limiting menu openings exclusively to right-clicks.
* **WhisperDock & Chatbox Suggestion Overlays**: Added a pulsing shadow and scale transformation to the magic wand suggestion icon in the chat composer when the input field is not empty, and added suggestion overlays to both WhisperDock and the Chatbox.
* **Clean Text Loading Shimmer**: Swapped suggestion skeleton shimmer slots for a clean text spinner loader.
* **Suggest/Send Button Glow**: Added a dynamic glow effect to suggest and send buttons when typing in the composer.
* **Clean Suggestion Formatting**: Decodes unicode characters and linebreaks in suggestions at the source.
* **Autonomous Artistry Indicators**: Added a "Drawing" status overlay in the top-left corner during active scene generation and displays the elapsed drawing time upon completion.

### 💬 Chatbox Window
* **Rehearsal Room Sidebar (New)**: Launched the Rehearsal Room surface inside the sidebar, featuring a unified workspace to prototype, test, and iterate on character emotions and acting motion prompts.
* **Studio Settings Popover Shortcut**: Replaced the "Proactivity Settings" button in the Chat Memory popover with a "Studio Settings" clapperboard button, which pops open the character studio in a separate, concurrent window.
* **Persistent Avatar Selector**: Added a Preview/Apply toggle to the Avatars popover in the Control Strip so users can permanently save selected display models to active character cards.
* **Control Strip Default Button Configuration**: Added the Characters Card Switcher (`actor-characters`) to the Control Strip by default, allowing users to quickly swap cards out-of-the-box.
* **Control Strip Sizing & Contrast Fixes**: Increased the popover window boundaries to `500px` to prevent clipping of action footers, and corrected dark-theme background variables in the Avatars menu to resolve a white-on-white text contrast bug.
* **Window Snapping & Boundary Clamping**: Enforced absolute boundary clamping within the monitor's `workArea` in the Electron window manager to prevent off-screen jumps, and disabled native OS resizing.
* **Segmented Layout Presets**: Added horizontal segmented layout presets to the chat settings.
* **Local ObjectURL Resolver**: Expired or temporary ComfyUI image URLs are now dynamically resolved and loaded from local IndexedDB ObjectURLs at render time.
* **Prompt Markdown Translation**: Automatically translates markdown image tags into text descriptions before sending them into the LLM context, preventing broken rendering loops.

### 📝 Captions
* **Caption Window Border Resizing**: Allowed resizing the caption window by disabling mouse event overrides whenever the mouse cursor is near the borders.
* **Stable Highlight Search**: Implemented a sliding search window and alphanumeric checks to keep active text highlighting stable during real-time streaming.
* **Sentence-by-Sentence Audio**: Suggestions now play back sentence-by-sentence with full user caption bridging.

### 📇 AIRI Card Settings & Configuration
* **Card Manager Selfie Shortcut**: Added a camera button to the card list in settings. If the card is active, it broadcasts a 3-second countdown to the Stage window to snap a selfie. If inactive, it triggers a friendly guide toast.
* **Card Import Validation & Null Sanitization**: Implemented a recursive sanitizer that strips out explicit `null` fields (which can be introduced by ChatGPT translations or external card tools) before validating card JSON files. Upgraded the validation error toast to show the full nested property path (e.g., `extensions.airi.visual_assets...`) instead of just reporting the top-level `extensions` wrapper.
* **Control Strip Configuration Safeguards**: Added strict documentation warnings in `control-strip.ts` to prevent developers/agents from bumping the layout version string unnecessarily, preserving existing custom user arrangements.
