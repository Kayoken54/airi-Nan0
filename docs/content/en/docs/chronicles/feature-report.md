# AIRI Fork: Core Feature Report

This document is the canonical reference for the high-level, user-facing features and architectural shifts that define this fork. It expands each major feature system catalogued in [`docs/major-features-added.md`](../../../../major-features-added.md) into detailed sub-features and technical specifics.

Pending/planned work lives in [`docs/chronicles/roadmap.md`](./roadmap.md).

---

## 1. AIRI Card Character System

A full-fidelity character management system that treats cards as real, portable, deeply-configurable entities rather than thin metadata placeholders.

- **AIRI JSON Export**: A full-fidelity native JSON format (`airi-card` v1) that preserves all extensions (modules, artistry, acting, heartbeats, wardrobe). **Does not include personal chat history or private data** — only the configured character settings, ensuring cards are safe to share.
- **SillyTavern PNG Import/Export**: Full `chara_card_v2` compatibility, allowing users to **import existing community cards** and export AIRI cards as shareable PNGs with embedded metadata and a framed portrait preview.
- **Background Bundling on Export**: The character's currently active background/scene is exported **with the card**, so anyone who imports it gets the background automatically applied.
- **Dynamic Card Export Snapshots**: Session-aware snapshot system that captures **active outfits and expressions** in real-time for export previews.
- **Duplicate Handling**: Automatic rename-on-import (`Lain`, `Lain (2)`, `Lain (3)`) prevents accidental overwrites.
- **Instant Card Import**: A page-wide dragover backdrop lets you drop any SillyTavern-style `.json` or `.png` card anywhere on the window to import immediately.
- **Responsive Card Layout**: 2-column portrait / 4-column landscape grid with a compact single-line 38px toolbar (Search, Sort, Import, Create). Search expands smoothly on click; Import toggles a clean drawer below the bar.

### Card Editor — Multi-Tab Configuration Surface

The card editor expands beyond a thin metadata form into dedicated tabs:

- **Acting Tab**: Three prompt layers — model expressions/ACT tokens, speech-expression tags, and speech mannerisms. Aligns the model's face, TTS delivery, and character writing style. The point is to let the same personality speak differently depending on the selected VRM/Live2D model and the active speech provider.
- **Modules Tab**: A card carries its own chat model, speech provider/voice, VRM/Live2D avatar, and preferred background. In practice this means switching characters can switch the whole presentation, not just the text persona.
- **Artistry Tab**: Per-card image provider, model override, default prompt prefix, and provider-specific JSON options. Makes image generation a first-class character capability.
- **Generation Tab**: Per-character LLM provider, model, temperature, top-p, max tokens. Designed with future SillyTavern preset import compatibility in mind.
- **Proactivity Tab**: Defines when and how a character speaks on their own. Injects window history, system load, volume state, and usage metrics into heartbeat evaluations. The prompt can be tuned so AIRI knows when to remain silent versus when to comment.
- **Per-Character Tool Gating**: Disable tool calls per character to reduce context size and prevent errors on models that don't support tool usage (e.g. RWKV).
- **Blank Field Preservation**: System prompt fields that are set to blank stay blank — no rogue default values injected.

---

## 2. Multi-Character & Actor Token System

Upstream main only supports 1:1 character-cards — one character per card, with no concept of multiple actors or dynamic model switching. This fork introduces a full multi-character architecture:

- **`<|ACTOR|>` Tokens**: Dynamically switch between 3D models during the speaking phase. The LLM can designate which character is speaking mid-conversation, and the stage renders the correct model in real time.
- **Display Model LRU Cache**: An in-memory Least Recently Used cache for 3D models that prevents latency and visual flicker when dynamically switching between characters on stage. Models are pre-loaded and retained, so rapid actor swaps during dialogue are seamless.
- **Multi-Character Card Support**: Cards can define multiple actors, each with their own model, voice, expressions, and idle animations. The stage handles concurrent models and smooth transitions between them.
- **Narrator Voice Fallback**: Narrative cards automatically fall back to the user's customized profile voice when dealing with multi-actor layouts.

---

## 3. AnimaDex Guided Card Creator

A standalone multi-step wizard for creating new AIRI character cards from scratch — a completely new creation flow not present in upstream.

- **Guided Creator Page & Store**: A dedicated multi-step interface that streamlines card creation from dataset metadata through to final card assembly.
- **Dataset-Driven Metadata**: Integrates character metadata (series, archetypes, tags) from the AnimaDex dataset, with auto-upsert on character series metadata.
- **WD14 Auto-Tagging**: Auto-prefills model/voice bindings in Step 2 using WD14 visual indexing. Auto-links character series metadata and supports quick model previews or blacklist-protected unbinds.
- **AI Story Idea Suggester**: Step 3 features clickable scenario cards with skeleton loading states and custom prompting guidelines based on character archetypes.
- **Visual Roster Settings Grid**: Step 2's visual layout grid simplifies card portraits and model bindings.
- **Voice Auto-Assignment**: An automated batch configurator that auto-matches and binds appropriate voices with fallback proxies via an extensible provider registry. Works in both the wizard and the Studio panel for existing cards.
- **Per-Character Idle Animations**: Define and customize idle animations per actor directly in the wizard's auto-assign flow.
- **Action-Split Confirmation**: Split the final "Confirm & Create" step into 3 explicit actions with backup-on-apply ("Apply to Current Card (with Backup)" and "Create as New Card").

---

## 4. Sparkle AI Field Generator

AI-assisted content generation buttons rolled out across all AIRI Card tabs — a distinct feature system not present in upstream.

- **Settings-Wide Generation**: Sparkle AI generation buttons across Visual DNA, Stealth Heartbeat, Identity, Behavior, Artistry, and more.
- **Textarea Upgrades**: Key long-form fields (Visual DNA, Stealth Heartbeat Prompt) converted from inputs to resizable textareas for better editing UX.
- **Context Injection**: Sparkle AI's context injection preserves core system prompt elements when merging Multi-Role prompts or customizing premises.
- **Multi-Role Templates**: Includes Multi-Role system prompt templates and Studio concept context injection.
- **Visual Description Step**: Step 5 in CardImportWizard for generating visual descriptions and managing artistry prefix definitions.
- **Studio Navigation**: Reciprocal navigation buttons, introductory blurb cards, and clean guide indicators to navigate seamlessly between Studio settings and standard modes.

---

## 5. Production Studio & Concept Stacking

A system for architecting complex character behaviors and visuals through layered "Concepts" — not present in upstream.

- **Concept Registry**: Register and stack "Concepts" onto your characters as Base (mutually exclusive) or Additive (layered).
- **Immersive Concept Stacking**: Layer multiple prompts, artistry rules, and behaviors to create highly nuanced manifestations.
- **Tabbed Builder Modal**: A streamlined interface for creating and managing your concept library.
- **Manifestation Bridge**: Improved logic for synchronizing concepts with the live stage.
- **Model Override Grid**: Built a gorgeous new grid in the Manifestation Tab with reactive active concept status badges.
- **Autonomous Artistry Integration**: Autonomous artistry utilizes "Eternal Record" context injection, allowing companions to reference deeper historical patterns during generation. Concept filtering ensures active concepts are passed to the Director for strong visual continuity.
- **Hallucination Protection**: Refined reasoning pipelines for the Autonomous Director to significantly reduce hallucinations in character manifestations.

---

## 6. ACT Token & Expression Pipeline — Expanded Format & Model Support

Upstream main invented the ACT token pipeline. This fork broadens it significantly with expanded format support and cross-model integration.

- **Expanded Syntax Format Support**: Broader parsing of different ACT token syntax formats beyond the upstream baseline, ensuring compatibility with more LLM output styles and community card formats.
- **MMD & Spine Expression Integration**: Extended the ACT pipeline to drive MMD morph targets and Spine animation slots, not just VRM blendshapes. All four model types (VRM, Live2D, MMD, Spine) now share the same expression pipeline.
- **Core Pipeline Flow**: AI output is parsed for `<|ACT:...|>` tokens, which flow through `processMarkers()` → `parseActEmotion()` → `emotionsQueue` → VRM `expressionManager`. Drives **morph targets and material color binds** directly.
- **Heuristic Mood Mapping**: A 7-archetype system (`happy`, `sad`, `angry`, `surprised`, `thinking`, `flustered`, `relaxed`) that maps dozens of keywords to core visual states for bubble styling and UI feedback.
- **Custom Expression Key Mapping**: Users can define **custom keys** that map directly to their VRM model's expression names, enabling any model's unique expressions to be driven by ACT tokens.
- **Dynamic Name Resolution**: Expression names not in the hardcoded map are resolved via **case-insensitive search** of the VRM's `expressionMap`, allowing any model's custom expressions to work without code changes.
- **VRMA-Aware ACT Tokens**: ACT tokens can trigger full-body **VRMA animations** (e.g., `<|ACT:{"animation":"crab_dance"}|>`), not just facial expressions. A priority system ensures VRMA takes precedence over blendshape matches.
- **Smooth Transitions**: All emotion changes use a lerp-based blending system — when one emotion activates, all others fade to zero simultaneously over a configurable `blendDuration`.
- **Live2D Emotion Parity**: Extended the ACT pipeline to Live2D models, including a **"Stable Baseline Manager"** that flushes pending resets on new triggers, ensuring the model never gets stuck in an emotional state during rapid interaction.
- **LLM Emotion Keyword Clustering**: Upgraded the ACT pipeline emotion-matching logic to map LLM-requested emotions to broader synonym and bilingual Japanese/English keyword clusters (e.g., mapping "mad" to "angry.exp3.json").
- **ACT/Bracket-Driven Bubble Styling**: Reactive chat bubble styling with mood-colored borders driven by ACT tokens and bracket syntax (e.g. `[happy]`, `[sad]`).

---

## 7. VRM Animation Ecosystem

A fully customizable idle and performance animation system for VRM models.

- **Revamped VRM Settings Panel**: The VRM model settings surface has been reorganized into a cleaner, more structured editing experience for animations, expressions, and model controls.
- **24 Built-In VRMA Presets**: An expanded library of **24 type-safe, standardized English-named** animation presets selectable via a dropdown in Model Settings, with cross-fade transitions.
- **Per-Character Animation Palettes**: Each character card can be configured with a **subset of the 24 presets** that the idle sampler will cycle through, rather than using the full library. This allows personality-specific animation curation (e.g., calm poses for one character, energetic dances for another).
- **ACT-Triggered Animations**: AI characters can trigger specific animations on-demand via ACT tokens, with automatic cross-fade back to the user's chosen idle on completion.
- **"Idle Hairball" Random Cycle**: A global toggle that continuously **samples random animations** from the character's configured palette, cross-fading between them to keep the character feeling "alive" at rest.
- **Performance Priority System**: When an ACT performance token fires, the idle cycle **pauses and yields**, then resumes a new random idle once the performance completes.
- **User VRMA Uploads**: Users can upload their own `.vrma` files (from marketplaces like Booth.pm) and add them to the animation library.
- **Batch VRM Importer**: Select and import multiple VRM models at once directly from the model selector dialog.
- **Tactile Tug-and-Pull Physics**: Interactive model manipulation with physics tuning for a natural feel on high-refresh-rate displays. Part of the broader cross-model Tactile Mode.
- **Improved Animation Cycles**: Hardened VRM idle cycle logic in `airi-card.ts` for more reliable cross-fading and state transitions during AI acting and manual overrides.

---

## 8. Modular Wardrobe System

A persistent, multi-layered clothing and expression management system.

- **Schema-Driven Outfits**: Outfits are stored as part of the AIRI character card, specifying `name`, `icon`, `base/overlay` type, and a set of `expressions`.
- **Base vs. Overlay Logic**:
    - **Base Outfits**: Mutually exclusive. Applying a new Base outfit will "zero out" any other active Base expressions (e.g., swapping a full dress for a swimsuit).
    - **Overlays**: Stackable layers (e.g., glasses, ribbons, hats) that can be toggled on/off independently without disturbing the Base outfit.
- **Interactive "Build Outfit" Mode**: A dedicated staging mode in the character settings that:
    - **Snapshots** the character's current state before starting.
    - Allows **real-time previewing** of expressions as the user selects them.
    - Supports **restoration** to the original state if the build is canceled.
- **Desktop Control Strip Integration**: Quick-access Wardrobe hub in the Control Strip. Active outfits are visually highlighted (Amber for Base, Sky-Blue for Overlay) with interactive toggle support.
- **Persistence & Portability**: Wardrobe definitions are fully integrated into AIRI Card exports, ensuring character outfits are shared along with their personality and visuals.

---

## 9. Live2D System (Customization, Tactile Interaction & Hacker Tools)

Standardizing the Live2D experience to match the premium VRM feature set.

- **Standardized 3-Panel Architecture**: The Live2D settings surface has been completely reorganized into the core **Character Customizations**, **Scene**, and **Advanced** panels, providing a unified UX across all model types.
- **Live2D Expression Mapping**: Implementation of a **"Hold-to-Map"** interaction. Users can long-press any expression in the grid to bind it to a standard ACT emotion token (Happy, Sad, Angry, etc.).
- **Compact UI Optimization**: Integrated a specialized **compact mode** for the tabbed navigation and shortened terminology (e.g., "Head & Face" → "Face") to ensure 100% visibility in the narrow side-panel without horizontal clipping.
- **AiriCard Integration**: All Live2D customization data — including expressions, motions, and emotion mappings — is persisted and exported within the character's `AiriCard`, ensuring total portability.
- **Multi-Moc3 Zip Import & Normalization**: Import a single zip file containing multiple `.moc3` files, and the importer automatically splits and normalizes them into separate, individually selectable models. In-memory multi-model Zip splitter with real-time toast feedback. Auto-discovery heals expression files, manifest naming, and motions dictionaries on the fly.
- **Self-Healing Imports**: Automatically heals expression files nested inside subdirectories when importing new cards. Sanitization for empty motion/expression files and sanitized zip loader settings to prevent boot deadlocks.
- **Tactile Interaction Mode**: Interactive hit-zone clicking on Live2D models triggers both **audio playback** and **on-screen captions** for the associated sound file. Dynamic Tactile Expression Pooling — clicking specific body zones (sensitive areas, headpats, hand regions) triggers contextually appropriate expression files from available pools. Global tactile interaction decoupled from VRM orbit camera restrictions.
- **Live2D Hacker (lhack)**: A specialized panel for real-time model modification. Texture Deck for surgical upload/download of model textures. Surgical Eraser to remove or hide specific model components. Export stability ensures custom tweaks persist across sessions.
- **Motion Audio Playback**: Motion-associated audio playback for Live2D characters. Leadership delegation for Live2D motion sound files. Converted parameter metadata and available motions to reactive refs to prevent browser `QuotaExceededError` issues.
- **Framerate Optimization**: Resolved severe lag and garbage collection pressure, especially noticeable on complex models. SDK 5.3 compatibility guards for the latest generation of Live2D models.

---

## 10. MMD / PMX Model Support

Full MMD model integration alongside VRM, Live2D, and Spine.

- **Ultra-Realistic MMD Integration**: Updated 3D MMD engine with proper **real-time physics**, **interactive mouse tracking** (companions look at and follow cursor), and **automatic blinking** built directly into the existing lip-sync system.
- **Custom VMD & Motion Controls**: Full support for importing custom `.vmd` motion files. The Control Strip supports motions and a 'None' preset across all 4 companion models (Live2D, VRM, Spine, MMD).
- **Idle Animation Cycling**: Idle animation cycling with precise camera positioning. MMD morphs and motions fully integrated into the Acting tab of the Card Editor.
- **Texture & Lighting**: Pre-decode textures in parallel, synchronize scene loading, unified positioning/lighting controls, and fixed Y-axis inversion during canvas dragging.
- **VMD & VRMA Cloud Syncing**: Cloud sync natively supports VMD and VRMA motion libraries as heavy assets with robust tombstone tracking for deletions.

---

## 11. Spine 2D Model Support

Native integration for Spine 2D models alongside VRM, Live2D, and MMD.

- **Comprehensive Spine Support (Phase 1)**: Extended animation and audio support (via `model0` manifests), bone-based tactile interaction, and independent animation overlays.
- **Binary Format Support**: Full support for Spine 4.0+ binary format with robust version parser fallbacks. Resolved `physics is undefined` preview generation error on Spine 4.2+ models.
- **Auto-Detection**: Auto-detect premultiplied alpha from atlas headers.
- **Interactive Controls**: Idle animation cycling, drag-to-pan and wheel-to-scale, and rich hit-area diagnostics. Refined hitbox math for bone-based tactile interaction.
- **Motion Audio Playback**: Motion-associated audio playback for Spine characters.
- **Mouth Sync**: Automated slot-attachment talk animation playback synchronized to audio intensity (part of the 2D & 3D Mouth Sync Convergence).

---

## 12. Scene & Background Manager

Character-scoped backgrounds and the foundation for AI-driven environment control — not present in upstream.

- **2 Bundled Scenic Backgrounds**: Ships with **2 built-in scene backgrounds** out of the box for a richer first-run experience.
- **Character-Scoped Backgrounds**: Each AIRI card can specify a **preferred background** that persists across sessions and can be set directly from the Artistry gallery widget.
- **Transparency-Aware Rendering**: Both Live2D (PixiJS `backgroundAlpha: 0`) and VRM (Three.js `clearAlpha: 0`) renderers use **fully transparent canvases**, allowing layered composition with DOM backgrounds.
- **Background-Journal Integration**: The Image Journal and Background systems are **bridged** — generated artistry images can be set as the character's background in a single click.
- **AI-Driven Background Creation**: The AI can not only set an existing image from the journal as a background, but also **generate a new image and set it as the background** in one action — letting the character "redecorate" on the fly.
- **Background Portability**: Active backgrounds are exported **with the AIRI card**, so anyone who imports a character gets their scene automatically applied.
- **Photo Mode (Stage Capture)**: A dedicated 3-2-1 countdown capture system that snapshots the character and their active background into a single composite image. Features a full-screen flash transition for immediate visual feedback. DPI Retina scaling prevents blurry or cropped captures on high-DPI screens.
- **Selfie-Enhanced Previews**: Character card previews in the settings menu automatically use the latest "selfie" from the image journal as the portrait, providing a dynamic and personalized view of each character. Includes smart anchoring (object-top) for perfect framing.
- **Fullscreen Lightbox Picker**: A full-screen preview lightbox within the stage background picker.
- **Responsive Media Library**: Transforms the background picker into a responsive full-page Media Library.

---

## 13. Two-Layer Memory System

A sophisticated multi-layered storage system designed for multi-day, consistent roleplay — replacing upstream's placeholder.

- **Short-Term Memory (Context Summaries)**: Rebuilds daily continuity blocks from existing chat history. Blocks are stored durably and injected into new or reset sessions. One summary block per day. Memory "Rebuild" button with real-time cache status popovers and trash-safety hooks. Language-aware summarization for better conversational context.
- **Long-Term Memory (Durable Journal)**: A persistent, append-only archive stored in **IndexedDB**, allowing for years of recall without context bloat. Characters can create and keyword-search journal entries via the `text_journal` tool. Real archive view UI replaces the WIP shell.
- **Unified Retrieval System**: Smart memory lookup that searches **Long-Term first**, then falls back to **Short-Term blocks**, ensuring character recall is seamless across storage layers.
- **Character-Centric Boundary**: Strict isolation of memory per character profile, preventing identity bleed or cross-contamination between different "Souls."
- **Immutable Daily Summaries**: Once a day ends, a final immutable summary is generated, locking in the "soul" of that day's interactions for future recall.
- **Persona-Driven Auto-Titles**: Automated short-term memory blocks are assigned **character-consistent titles** (e.g., *"My thoughts after 108 messages together~"*) instead of static IDs.
- **Echo Chips**: Lightweight memory fragments surfaced in the right context panel. Quick at-a-glance recall of recent topics and character-relevant snippets.
- **Dream State**: Characters can enter a dream state where the LLM synthesizes subconscious reflections from accumulated memories and recent experiences. Dream content is injected back into the character's awareness.
- **Trigger-Based Memory Compaction**: A trigger-based memory history compaction subsystem with background archival forking, protecting user context size from bloating while preserving long-term conversational memory.
- **Coalesced Journal Previews**: Journal previews with full markdown rendering for better legibility.
- **Semantic Search**: Upgraded local semantic search engine with **Reciprocal Rank Fusion (RRF)** and **Maximal Marginal Relevance (MMR)** to balance search relevance and diversity. Integrated native **CJK (Chinese, Japanese, Korean) Tokenization** to ensure accurate memory retrieval across multiple languages. Semantic lookup dialog directly inside the chatbox memory popover.
- **Introspective Memory Feedback Loops**: Characters reflect on their own recent actions (journaling, dreaming, creating art) in their immediate context. Action reflection loops inject recent activity into the character's next response context. Dream & Artistry reflective prompts let the character reference what they just dreamed or painted.
- **Custom Journal Prompts**: A customizable system prompt template for shaping how Journal Moments are generated.
- **Eternal Thread**: Long-term memory archive view (renamed from "Archive") with token budget controls for tuning the density of the character's canonical Soul Blueprint. Improved long-term memory distillation with new context sliders and stricter validation rules. Persona refresh with stable IDs and head-tail pruning for long conversations.
- **Atomic Session Rebuilds**: A context-aware "Rebuild" logic that semantically **compacts long-running conversations** into a clean state while preserving the last 3 days of continuity.

---

## 14. Universe-Based Story Memory Isolation

Upstream main doesn't let you switch sessions at all while using the same underlying models — the chatbox has no concept of session management. This fork introduces a complete session and universe architecture:

- **Quick Session Switching**: A session selector directly in the chatbox titlebar lets you jump between different conversations with the same character without any setup.
- **Universe System**: Sessions and timelines are grouped into isolated "Universes." Each universe is a self-contained silo — memories, timelines, and chat histories from one universe never bleed into another.
- **Clean Session Creation**: Create a brand new session under a character that is completely free of memories and artifacts from previous sessions — start fresh without losing the old ones.
- **Multi-Session Coexistence**: Multiple sessions can coexist under the same character and universe, or span across different universes for entirely separate storylines.
- **Summary Safety Locking**: Added safety locking to the short-term memory manager to prevent duplicate concurrent summary runs, ensuring memory histories remain stable within universes.

---

## 15. Artistry & Creative Generation

A complete redesign of the image generation pipeline, focusing on performance and user creative control.

- **Native ComfyUI API Support**: Direct, high-speed HTTP integration with any local or network **ComfyUI instance**. No middleware, CLI bridges, or WSL requirements.
- **Replicate Cloud Support**: First-class integration with **Replicate's API** as a remote generation provider. Pricing transparency is built into the UI — models are sorted with cost-per-generation visible.
- **Interactive Gallery Widget**: A premium "Flip Card" display with **front-face** image preview, **back-face** generation metadata (Prompt, Remix ID, Render Time), and one-click **"Set as Background"**.
- **NanoBanana Provider Support**: Added **NanoBanana** as another first-class artistry backend alongside Replicate and ComfyUI, widening the generation and mutation toolset available to AIRI.
- **"Bring Your Own Workflow" (BYOW)**: Users can upload any `workflow_api.json` from ComfyUI and visually map specific nodes (prompts, seeds, LoRA weights) to be **controllable by the AI**.
- **Global & Per-Character Artistry Control**: Added a "None" provider state to the global settings and per-character switches. This allows users to fully disable image generation module-wide or for specific individuals.
- **Dynamic Prompt Stripping**: Automatically removes image-generation instructions and tool definitions from the system prompt builder whenever Artistry is disabled, preventing AI roleplay confusion.
- **Workflow Templates & Presets**: Save and name complex node graphs as reusable templates. Different AI characters can be assigned **unique generation "personalities"** and prompt prefixes.
- **Bidirectional `{{PROMPT}}` / `{{IMAGE}}` Placeholders**: Artistry workflows can now reuse prompt text and source images through explicit placeholders, enabling cleaner remix and image-conditioned generation flows across provider backends.
- **Automated Image Handoff**: Generated art is instantly archived into the character-scoped **Image Journal**, ensuring no creation is lost across sessions.
- **ComfyUI Web Surface Support**: Full ComfyUI support enabled for the Web surface, allowing for autonomous artistry and visual generation directly in the browser view.
- **"Imagine" Mode**: A button in the chatbox opens an inline prompt modal — the user types a prompt and generates an image on demand, without needing to go through the AI or settings. Direct user-to-artistry pipeline. Replaced by the inline "Add Media" popover in the latest chatbox redesign.
- **ComfyUI Workflow Instructions**: Updated to use the `image_journal` format with active workflow selection warning prompts.
- **Artistry Defaults**: Configured default artistry settings for new and existing cards (threshold 49, spawnMode bg, target assistant).
- **Companion-Centric Artistry**: Re-tuned the Autonomous Artistry engine to prioritize character-relevant visual manifests over generic background generations.

---

## 16. Vision Support (Decoupled VLM Pipeline)

Decoupled Vision-Language Model (VLM) support — not present in the upstream project.

- **Dedicated Vision Store**: A separate `vision` store for VLM provider and model selection, keeping it independent from the primary Chat LLM ("Mind" vs. "Senses").
- **Drag-and-Drop / Paste Attachments**: Image attachment support via **drag-and-drop** and **clipboard paste** (CTRL+V) in both the Desktop and Web chat areas, with a preview strip above the input.
- **Image-Aware Chat History**: Attached images are tracked in the chat history as `image_url` content parts, allowing the AI to reference previously shared images in context.
- **Local & Remote VLM Inference**: Supports **Ollama** and **LM Studio** for fully local VLM inference, plus **OpenAI**, **OpenRouter**, and **Native Gemini SDK** for cloud-based vision.
- **Vision Global Shortcut**: New ability to trigger vision captures using a shortcut while the application window is active and responsive.
- **"Take Screenshot" Capability**: Added a dedicated screenshot button within the interactive area for quick capture.

### Two VLM Strategies

- **Direct Response (Impersonator)**: The VLM responds directly in the character's voice — the character "sees" the image and replies as if looking at it themselves. This is the simpler path where the vision model and chat model are one and the same turn. When images are attached, the request is routed **entirely to the VLM** for that turn, allowing cost optimization (e.g., cheap LLM for chat, Gemini Pro Vision for images).
- **"Forward to LLM"**: The VLM generates neutral descriptions/tags (e.g. WD14 tagger, Kimi 2.5 captioning) which are injected into the text stream. The primary chat LLM then responds in its authentic character voice, informed by the VLM's description rather than impersonating the VLM. This decouples sight from voice. Custom prompt shims for vision tasks. (🚧 — mostly implemented, needs timing tuning)

### WD14 Local Image Tag Extractor & Model Collection Scouting

A standalone local image tag extractor modal powered by WebGPU WD v3 tagger.

- **No More Screenshots or External AIs**: Analyze your character model's styling directly in the app to keep your Actor cards and image generators fully in sync.
- **Model Collection Scouting**: Scouts through your entire model collection and decorates every model with associated tags (e.g. "blonde hair", "school uniform", "cat ears").
- **Tag Search Everywhere**: Tag search integrated across the `CardImportWizard`, Concept Builder manifestation tab, and the Control Strip avatar popover.
- **WD14 Auto-Tagging**: Implemented WD14 model auto-tagging, search integration, and tag filtering popovers to make categorizing avatars seamless.

---

## 17. AI Producer Subsystem

A dual-track AI suggestions engine decoupled into two operational modes — a completely new feature system not present in upstream.

### Producer Lite (Stateless Suggestion Engine)

- **Game-Changing Feature**: Unlike the full orchestration suites, Producer Lite operates entirely within the chatbox context using only the local conversation thread ($N$ turns).
- **Zero Configuration**: Generates context-aware, user-mimicking interactive suggestions on the fly. Requires **zero** configuration, database records, or storyline setups — making it an out-of-the-box assistant that works instantly on any character session.
- **Actor Stage Integration**: Recently integrated into the Actor Stage so suggestions appear alongside the character.
- **Quick-Suggest Magic Wand**: Triggers response suggestions instantly using your current composer input text as guidance, skipping the manual popup form.
- **Play-All Button**: Sequential TTS playback of all alternative suggestion paths.
- **Decoupled Preview Textareas**: Decoupled option previews, synchronized textareas, and an option to auto-play all choices sequentially.
- **WhisperDock**: A floating voice control hub inside the actor stage for hands-free suggestion interaction.
- **Producer Guidance Modal**: Added a boundary message preview popover.

### Producer+ (Campaign & Story Orchestration)

- **Full-Featured Engines**: Includes Producer OE (Open-Ended), GD-IT (Gameshow Host / Initial Turn), and GD-NT (Next Turn) engines.
- **Intimacy Engine Integration**: Ties suggestion choices to the Intimacy Engine's variables (`intimacyChange`, `tensionChange`, `mood`), storyline guidelines, local scene settings, and custom encounter rules.
- **Cache-Aligned Suggestions**: Cache-aligned full-context suggestions with editable prompt templates in the Producer panel to assist with custom prompting.
- **Eternal Record Integration**: Autonomous artistry now utilizes "Eternal Record" context injection, allowing companions to reference deeper historical patterns during generation.
- **Token-Driven Sync**: New multi-character synchronization driven by raw tokens for precise coordination between companions.

---

## 18. Situational Awareness & Proactivity

Enables the character to perceive and react to the user's real-world desktop environment.

- **OS Sensor Integration**: Proactive injection of real-time telemetry into the LLM context, including **Active Window Title**, **Program Name**, and **User Idle (AFK) status**.
- **Activity History Tracking**: AIRI can track and reference **which applications you've been using** and for how long, allowing for more grounded and reactive roleplay.
- **Environment Telemetry**: Real-time awareness of **CPU/GPU load**, **System Volume** (PowerShell-backed sensor), and **Local Time**, allowing characters to coordinate their energy levels or suggestions with your PC's state.
- **Tool-Aware Proactivity**: Dynamic tool registration for the Heartbeats pipeline — the AI can fetch and use **contextually relevant tools** (Volume, Time, etc.) during proactive evaluation.
- **Metric-Driven Milestones**: Tracking of session-level metadata (total turns, journal entry counts) to trigger **special conversational milestones** or "save-point" reminders.
- **Deep Context Awareness**: Expression awareness (AIRI knows when she is blushing or wearing accessories), sticker awareness (LLM grounding for active stickers on screen), and scene awareness (filtering of roleplay backgrounds versus camera captures).
- **AppleScript Active Window Fallback**: Bypassed native `active-win` bindings on macOS in favor of AppleScript tracking with performance logs to prevent system diagnostics crashes.
- **Proactivity Safeguards**: Mid-card-switch proactivity guards, session ownership validation, and speech pipeline synchronization.

---

## 19. Dating Sim System

A dedicated dating simulation mode with dynamic encounter selection — not present in upstream.

- **Dynamic Encounter Mode Selector**: A mode-selection modal when starting a Dating Sim session. Users can pick between Sandbox Mode (Open-Ended) and Date Session (Goal-Driven) on the fly, rather than being bound to a static choice in Preferences.
- **Intimacy Engine**: Tracks variables like `intimacyChange`, `tensionChange`, and `mood` across sessions.
- **Custom Encounter Rules**: Storyline guidelines and custom encounter rules for structured dating scenarios.
- **Dating Sim Overlay**: Real-time caption synchronization in the Dating Sim Overlay with smooth interactive height expansion toggle to the dialogue box.
- **Dating Sim Preferences**: Integrated under Memory settings, with dating sim preferences relocated and simplified to fit the compact settings layout.

---

## 20. Desktop Control Strip & Actor Stage

The floating interaction system for the desktop experience. The original "Control Island" (a hub inside the actor stage window) has been completely deprecated and replaced by the **Control Strip**.

- **Glassmorphic Control Strip**: A floating, draggable interaction bar using `backdrop-blur-xl` and semi-transparent backgrounds, following an iOS-style pattern. Mutual exclusion between Main and Gemini/Module strips keeps the desktop clean.
- **Housing for Quick-Access Controls**: All quick-access controls that were previously split across the old island are now in the Control Strip: profile switcher popover, character popover, 8-emotion picker sub-menu (Happy, Sad, Angry, Surprised, Neutral, Think, Cool, Random), animation cycle button, ScrollLock mic toggle, manual pure-mic mode, local TTS voice switch popover, and transcription feedback toasts (`🎤 You said: {text}`).
- **Control Strip Customizer & Window Manager**: A brand new customizer window manager with bottom-placement popover, master button catalog, and an option for left-sidebar layout configurations.
- **Interactive Status Dot Indicators**: Explicit state-driven indicators on the control strip, including red/green microphone toggles and a 5-way speech session indicator.
- **Inverted Interaction**: Single-click to collapse/expand the control strip, and double-click to toggle the layout, complete with dynamic hover label helper text.
- **Snap-to-Edge & Auto-Hide**: Automatic edge-snapping auto-hide mode with full support for macOS work area/screen boundaries. Popover-aware retention automatically holds the Control Strip in an expanded state whenever a popover menu is actively open.
- **Decoupled Actor Stage**: Standalone character renderer window with premium rounded-xl borders, a bottom-right drag handle, and optimal aspect ratio rendering. Works independently from the main chat/controls window.
- **Electronic Touch Dragging**: Custom touch-gesture dragging support for the Control Strip and Actor Stage windows in Electron, making touch-screen interaction extremely smooth.
- **Fade-on-Hover Intelligence**: A specialized **"Eye" mode** that makes the UI nearly invisible when the mouse hovers over the model area, ensuring the character's performance is never obscured.
- **Smart Window Snapping & Position Persistence**: Windows snap to edges and remember their last position across application restarts. Smart edge-snapping behavior with position persistence.
- **Cross-Window Synchronization**: Cross-window synchronization for caption visibility, session deletions, and chat message broadcasts. Caption windows dynamically align with and follow the visibility of the primary stage.
- **Resource Status Island**: A separate floating indicator that shows real-time **module loading progress** and a "Ready!" status with expandable details.
- **Gallery "Download" Support**: A direct Download button in the Image Journal gallery in settings, allowing users to save their captured selfies to their local machine.
- **Chat Hover Timestamps**: Contextual time display (e.g., "14:32") appears smoothly on message hover, providing immediate continuity feedback without cluttering the chat history.
- **Unified Gemini "Emerald" Brand**: System-wide update to use **Emerald/Emerald-Dark** accents for all Gemini-powered features, increasing visual consistency across the "Consciousness" modules.

---

## 21. Chatbox Redesign

A comprehensive re-architecture of the main conversation workspace into a multi-surface layout, plus broad chat UX enrichments.

### Workspace Layout

- **Three-Column Layout**: Navigation, the main conversation, and context sidebars are now separated into dedicated surfaces so they never compete for screen space.
- **Left Navigation Router & Sidebar**: Added a sliding left sidebar that acts as the primary navigation hub. Switch between Chat Messages, the Studio Monitor, the World Bible, the Media Library, and Settings. On mobile/portrait viewports, operates as a responsive overlay drawer that automatically slides away once you select a page.
- **Right Context Panel**: Added a dedicated right panel for desktop viewports that displays rich Memory Cards (Echo chips, daily summaries, and journal entries) alongside a lazy-loading Media Gallery.
- **Collapsible Context Band**: Merged the Memories and Media Gallery context bands into a unified, collapsible header bar that automatically stacks vertically on mobile.
- **Consolidated Toolbar**: Cleaned up the bottom toolbar and relocated its functions. Memory and proactivity controls are now in the top header, while grounding options reside in a clean ellipsis dropdown menu.
- **Centered Session Switcher & Brain Popover**: Premium centered session switcher and a quick LLM selector ("Brain Popover") directly in the titlebar.
- **Naked-on-Idle Buttons**: Re-styled all composer and header buttons to a premium "naked-on-idle" design that remains clean when inactive and reveals matching hover states on cursor movement.
- **Quick-Suggest Magic Wand**: Trigger response suggestions instantly using your current composer input text as guidance, skipping the manual popup form.
- **Add Media Popover**: Replaced Imagine Mode with an inline, 2-item "Add Media" menu placed directly to the left of the composer's magic wand.

### Chat UX Enrichments

- **Real-time Spoken Highlights**: As the character voice engine speaks, the exact sentence currently being uttered is highlighted inline in real-time. Decoupled the text-highlighting DOM patching from Vue via the **CSS Custom Highlight API**, completely eliminating browser layout thrashing and Out-Of-Memory (OOM) crashes on very long, extensive chat logs.
- **Mood Tags & Colored Chat Bubbles**: Configure your character to use mood tags like `[happy]` or `[sad]`, and the chat bubble for that message gets color-coded appropriately — **background tints**, **border glows**, and **transitions** give each message a distinct personality at a glance.
- **Screenplay Actor Formatting**: Chat bubbles now support screenplay formatting with high-contrast dynamic chips, typography overrides, and actor-aware colored text segments.
- **Unified Journaling Feed**: A horizontal Interaction Area above the chat input that displays a **real-time carousel** of the latest 2 text journals and 3 image journals — visible at a glance without opening extra panels.
- **Inline Message Editing**: Added the ability to edit both user and assistant response blocks inline directly within the chat bubble.
- **Draft Autosaving**: Trailing throttle localStorage autosave for chatbox drafts, preserving typed text across restarts/accidents.
- **Configurable Send Key**: User-selectable chat submission hotkey (e.g., Enter vs. Ctrl+Enter) via General Settings.
- **Context Limit Transparency**: A visual **Context Meter** (progress bar) and **Token Counter** (e.g., `46.7K`) that transition from Green → Yellow → Red as the character's memory limit is approached.
- **Context-Width Inheritance**: Automatic global default mapping (via `localStorage`) that links `providerId` and `modelName` to a user-defined `contextWidth`, ensuring characters inherit stable token limits even if not explicitly configured.
- **Clear Chat Archival**: Director notes are now archived instead of simply cleared when clearing chat, keeping the history tidy while preserving context.
- **Timeline Management**: Powerful timeline controls like "Fork & Switch", "Trim Timeline", and "Delete Following" directly from the message action menu. Added inline editing for session titles and a redesigned action menu with a quick retry handler.
- **Journal Moments**: Added a new Journal Moment feature enabling real-time previews and seamless LLM integration for creating journal entries during chat.
- **Caption System**: Colored, segmented captions with actor-aware tracking, real-time active segment highlighting, and improved legibility of inactive text. Implemented smart caption click-through functionality for better desktop usability. OS notification toast fallback for captions.
- **Cross-Window Message Acknowledgment**: Implemented highly-robust cross-window message acknowledgment that broadcasts chat updates before database persistence, preventing frustrating draft timeouts.
- **Chat Composer Revamp**: Modularized the composer code, simplified chat labels, and added support for displaying 4x model formats in the header.
- **Session Management**: Added toast notifications and progress tracking for Chat History imports. Message deduplication and unified chat input routing between different application surfaces.

---

## 22. Studio Monitor Panel

A creative diagnostics console that gives creators an "at-a-glance" dashboard to audit active character configurations — replacing the character placeholder in the navigation.

- **At-a-Glance Dashboard**: Audit active concept stacks, wardrobes, and place configurations in one view.
- **Actor & Place Prose Parser**: Implemented dynamic extraction heuristics that automatically parse long-prose character descriptions and setting/surrounding lore from your cards to visualize character perspectives during chat.
- **Configure Shortcut**: Added a "Configure" button to the monitor header that instantly opens the card's Studio settings tab.
- **Visual Roster Cards**: Show model preview avatars in Character headers inside the Studio tab. Resized Cast Roster cards to double height for better legibility.

---

## 23. Model Selector — Redesigned

The Settings → Models → Select Model dialog is night-and-day different from upstream.

- **Search**: Full-text search across model titles, filenames, tags, and groups. Upstream had no search at all.
- **Filters**: Filter by model type (VRM, Live2D, MMD, Spine) and by tag groups.
- **WD14 Tagging Integration**: Tag models directly from the selector using the local WD14 tagger — scout your collection and decorate every model with searchable metadata.
- **Dual Layout Modes**: The upstream classic 2-column layout plus a dense 4-column layout for browsing large collections efficiently.
- **Batch VRM Import**: Select and import multiple VRM models at once directly from the model selector dialog.
- **Model Selector Dialog**: Replaced the legacy avatar select dropdown with the modern `ModelSelectorDialog` card trigger.
- **Reactive Model Favorites**: Added a model favorites popover and updated the action menu/chat items.

---

## 24. Discord Integration Revamp

A ground-up Discord bot integration that upstream does not have in functional form.

### Voice Pipelines

- **Classic TTS Voice Pipeline**: Discord Audio → Deepgram STT → Custom LLM → Custom TTS → Discord Audio. Browser-side 24kHz PCM resampling with raw PCM streaming directly to voice channels in Classic mode. WAV merging for complete voice notes. Self-speaker muting to prevent echo-back. STT ingestion auto-injects classic voice channel transcripts into the active chat session.
- **Bidirectional Gemini Live Audio Bridge**: Pure JS audio bridge connecting Discord voice channels directly to Gemini Live sessions. Audio-to-audio — zero text involved. Auto-session lifecycle with auto-start/stop triggers that control Gemini Live voice sessions based on channel activity. `/summon` and `/leave` voice commands.

### Voice Mode Controls

- **`/voicemode`**: Supports `puppet` (local speaker playback), `voicenote` (combining TTS audio chunks to upload as voice notes), and `none` modes.

### Slash Commands

- **`/status`**: Display active timeline name, universeId, Chat Mode, and VLM configuration details.
- **`/imagine`**: Image generation command.
- **`/character`**, **`/new`**, **`/history`**, **`/director`**: Session and character management.
- **`/vision`**: A visual intake command that routes uploaded images to the VLM with a customizable filter toggle.
- **`/selfie`**: A headless capture command to generate camera snapshots of your character on command, supporting optional emotion triggers (e.g., proud, shy). DPI Retina scaling prevents blurry captures.
- **`/timelines`**: Inspect active session histories.
- **`/journalmoment`**: Background journal generation.

### Image Pipeline

- Companions can now "see" images attached to Discord messages (via VLM routing) and send their own visual manifestations back to channels.

### Session & Channel Management

- **Per-Channel Isolation**: `channelId → activeCharacterId → activeSessionId` mapping. Each channel gets its own character and session.
- **DM Access Control**: Master toggle to restrict or enable DM command ingestion and private message listening. Sync isolation excludes the `settings/discord/enabled` flag from cloud sync.

### Interaction Modes

- **Queue vs. Steer**: Switch between "Queue" (ordered processing) and "Steer" (proactive/reactive) modes for more natural chat flow.
- **NO_REPLY Hook**: AI companions can now intelligently decide to remain silent when a response isn't necessary, preventing channel noise.
- **Director's Note Switch**: Per-character `autonomousMonitorDiscordEnabled` setting to gate Director's Note reasoning in Discord captions.

### Dashboard

- **Rich Dashboard Widgets**: Interactive Discord widgets with pagination for active status dashboard management, timeline histories, and character selector grids.
- **Typing Indicators**: Real-time feedback when your companion is generating a response.
- **Elegant Transcript Formatting**: Automatically parses and bolds `[ACTOR]` tags while cleanly stripping formatting prefixes on outbound messages.
- **Tool Formatting**: Formatted current-turn tool calls elegantly.

---

## 25. Audio Studio — Virtual TTS Provider

A virtual proxy TTS provider concept that upstream does not have. Bundles base speech engines (Kokoro, Azure, OpenAI) with custom audio effects and UST settings into named, globally-referenceable voice profiles.

- **Dynamic Web Audio DSP**: Implemented a full Audio Studio with live voice processing effects (EQ, reverb, dynamics) and a voice library playground with real-time preview controls.
- **Virtual Audio Studio Provider**: Added localization keys and provider integration for the audio studio pipeline.
- **Xvan's Audio Effects**: Modular high-fidelity post-processing transformations (Pitch Shifting, Rate/Speed adjustments, and Voice Equalizers) directly into the voice bundle engine.
- **Advanced UST Rules**: Expand the per-profile Universal Speech Transformer (UST) settings to support advanced, non-regex rules (Option A Bracket Action Mapper) and custom character substitutions (Custom Replacement Rules) to prevent spelling-out glitches.
- **Audio Studio Syntax Refactoring**: Revamped bracket-to-token formatter syntax, Option A bracket action mappers, and custom voice replacement mappings.
- **Quick Audio Studio Creator**: Added a Quick Audio Studio Creator modal directly into the guided card creator, allowing you to select, bind, or customize voice settings on the fly.
- **Concept Speech Custom Voices**: Extracted the voice creator modal to support custom concept speech voice assignments.
- **Permissive TTS Discovery**: Made OpenAI-compatible TTS voice discovery permissive to support a wider array of custom APIs.
- **TTS Punctuation Filtering**: Automatically filters out and drops punctuation-only text chunks before sending them to the TTS dispatcher to prevent silent vocal triggers.

---

## 26. Speech & Provider Integrations

Custom provider integrations not present in the upstream project.

- **Chatterbox TTS**: A first-class speech provider with deep integration:
    - **Preset & Profile CRUD**: A dedicated Chatterbox Management Studio (`Settings → Providers → Speech → Chatterbox`) for creating and managing speech presets and text transform profiles.
    - **Dynamic Preset Resolution**: Presets combine base voice, model mode, exaggeration, and mannerism profiles into reusable speech configurations.
    - **Capability-Driven Helpers**: Provider capabilities (`supportsSpeechTags`, `availableMannerisms`) are queried at runtime to power context-aware helper UI in the Acting tab.
    - **Semantic Speech Pipeline**: End-to-end flow from ACT token parsing → provider-side text preprocessing → mannerism transformation → TTS synthesis.
- **App (Local) Speech & Transcription**: Direct in-app, privacy-first implementation of **Whisper** (transcription) and **Kokoro** (speech synthesis) via `xsai-transformers`. Runs fully locally in the Electron main process with WebGPU acceleration support, requiring zero external dependencies or API keys. Consolidated under a unified App (Local) provider with interactive activation toggle. Eventa-compatible Whisper worker with English-only optimized models.
- **MOSS-TTS-Nano Local Voice Provider**: Integrated a local browser voice provider using MOSS-TTS-Nano, complete with a voice cloning playground and OPFS (Origin Private File System) model caching. WASM core execution to prevent storage buffer limit errors (which occurred under WebGPU on GPUs with less than 17 buffer limits).
- **WebGPU Inference Engine**: On-device model execution with hardware acceleration. VAD Web Worker and Semantic Search Scheduler as dedicated background web workers to keep the UI fully responsive. ModelCacheManager UI for browsing, downloading, and managing local inference models.
- **Local WebGPU RWKV-7 & Whisper**: Integrated local keyless inference engines utilizing WebGPU execution runners (`web-rwkv`) and Whisper-local STT for offline operation. Hugging Face Downloader with a global Hugging Face token entry setting for stable downloads of local models.
- **Qwen Portal Provider**: Added a first-class **Qwen Portal** integration with dedicated OAuth plumbing through the unified provider registry. Full integration of RFC 8628 (Device Flow) for Alibaba Qwen Portal.
- **OpenRouter (Easy Mode)**: Integrated **OpenRouter** as the primary backend for the "Sense Portal" Easy Mode, providing a streamlined, high-performance LLM experience with minimal configuration. Deprecated the legacy standalone Qwen portal; Qwen models are now managed via the unified OpenRouter provider.
- **Deepgram STT (Nova-2/Nova-3)**: Native integration for high-speed transcription with a secure **main-process JWT-based CORS bypass** for the Electron environment. Fixed `ERR_HTTP2_PROTOCOL_ERROR` by migrating to ArrayBuffer-based streaming.
- **Amazon AWS Polly**: Native high-quality neural speech synthesis integration using `aws4fetch` for secure V4 signing. Supports both **Neural** and **Standard** engines with dynamic voice discovery across all AWS regions. Extended with generative and long-form voice models.
- **DeepSeek / GLM-4 Streaming**: Added streaming support for `reasoning-delta` events and hardened the categorizer against **malformed tag typos** to prevent prompt stalls.
- **Gemini Live Streaming Pipeline**: Optimized the native Google Gemini Live API for production-grade performance:
    - **Native Audio Playback Queue**: Pre-buffers audio chunks in the main process for gapless, zero-latency streaming.
    - **Custom AI Voices**: Standardized support for Gemini-native voices like **Algenib** and **Fenrir**.
    - **Marker Parser Layer**: Integrated a streaming categorizer that strips ACT, DELAY, and reasoning tokens before the audio stream reaches the user's ears.
    - **Grounding UI**: Real-time awareness of specific external data sources, presented through a clean 3x3 control grid.
- **Gemini TTS**: Native Google Gemini text-to-speech provider.
- **Improved Provider Registry**: Migrated all chat providers to a unified, scalable definition system. Provider onboarding includes beginner-friendly discovery flow with automated metadata refinement for speech and generation providers.

---

## 27. MCP Management Hub

A premium, Antigravity-inspired interface for orchestrating the Model Context Protocol ecosystem.

- **Curated Server Discovery**: Integrated discovery for MCP servers across the filesystem, GitHub, and pre-defined curated sources.
- **Antigravity-Inspired UI**: A high-fidelity, settings-integrated dashboard (`Settings → Modules`) designed for maximum clarity and technical control.
- **Tool Titration (Per-Tool Toggles)**: Granular control over the AI's capabilities. Users can toggle individual tools within an MCP server to precisely define the character's "skillset."
- **Real-Time Status Monitoring**: Displays precise tool counts (e.g., `91/91 tools ready`) and provides an instant "Re-poll" capability to refresh toolsets without restarting the Electron host.
- **Standardized Configuration Templates**: Integrated setup guidance and reusable templates at the top of the management view to lower the barrier for manual server additions.
- **Canonical Path Resolution**: Hardened path handling for MCP configurations, ensuring consistency between Windows and Unix-like environments.
- **One-Click Install**: Implemented the "One-Click Install" flow for MCP plugins, allowing instant capability expansion.
- **Rebuilt Settings**: Rebuilt settings page with direct JSON editing, connection testing, server enable/disable controls, and restart feedback.

---

## 28. Cloud Sync Engine (BYOS — Bring Your Own Storage)

A full cloud backup, restore, and sync system with multiple storage provider support.

- **S3 / Cloudflare R2 Sync Engine**: Implemented full support for backing up, restoring, and syncing your character assets and models to Cloudflare R2 / S3 stores, including an intuitive settings UI for credentials management and provider swapping. Bootstrap safety patched to prevent accidental local deletion of assets when syncing to a fresh/empty S3 bucket for the first time.
- **Google AppData Integration**: Fully integrated Google AppData cloud backups with automated restore prompts and progress indicators during onboarding.
- **Selective Sync Filtering**: Added a new Selective Sync Modal that allows users to group assets (like background images) by character ID bundle and choose exactly which directories and character files are backed up to the cloud. Scoped settings cloud restore for restoring only custom settings.
- **Conflict Triage UI**: Standardized triage indicators in *Settings > Modules > Cloud Sync* allowing users to choose `Keep Local`, `Keep Remote`, or chronologically `Merge Message History` for blocked contractions.
- **Contraction Safety Heuristics**: Intercepts and blocks silent data contractions (e.g. preventing a newer but empty database from silently overwriting your rich local history) across multiple machines.
- **Outbox Safety Gates**: Skip outbox queues for keys with active, unresolved conflicts to prevent accidental remote clobbering.
- **Heavy-Asset Sync**: VMD and VRMA motion libraries sync natively with robust tombstone tracking for deletions.
- **Sync Index Merge & Safety Guards**: Implemented index merge logic (`mergeChatIndices`) and safety guards (`isCritical`) for chat session indices to prevent fresh clients from silently overwriting remote backups on sync. "Local-wins" synchronization priority strategy to prevent multi-window conflicts or data loss.
- **Cross-Window Reactive Sync**: Implemented reactive sync broadcasts. Updating models or configurations in one window immediately propagates changes across all active Electron frames.
- **Restored Stores**: Critical data stores that were previously left out of automated cloud backups are now fully synchronized: Short-Term Memory (STMM), Lifetime Memory (LTMM), and Display Models.
- **Automated 24-Hour Backups**: Implemented a background service that automatically backs up your local data every 24 hours, ensuring character memories and sessions are always recoverable. Manual backup UI fully restored and hooked up to the main process handlers.
- **Windows Path Normalization**: Resolved a silent bug where Windows backslashes (`\`) returned by `list-files` failed to map to POSIX storage keys, resolving the multi-OS sync loop.

---

## 29. Onboarding Overhaul

A redesigned first-run experience that reduces setup friction through automation and intuitive terminology.

- **BYOS Restore First Step**: The very first question is "Are you an existing user or a new user?" — existing users are guided through a BYOS restore flow.
- **Google Sign-In for BYOS Restore**: Existing users can sign in to Google to retrieve their AppData, which contains saved S3 credentials or filesystem paths. This enables a one-click restore of all their characters, settings, and assets from cloud storage during onboarding.
- **The Sense Pivot**: Complete terminology shift from technical acronyms (LLM, TTS, STT) to human-centered terms (**Consciousness, Speech, Hearing**).
- **Sense Portal (Easy Mode)**: A zero-config setup path that uses **OpenRouter** for instant LLM access and **Deepgram** for high-speed voice services. Completing the Easy Mode flow automatically configures all internal stores with optimal default models (e.g., `aura-2`, `nova-3`).
- **Advanced Mode**: Retains granular control for power users who prefer custom OpenAI, Anthropic, or local (Ollama/LM Studio) configurations.
- **Onboarding Orchestrator**: A modular, multi-step dialog system that handles branching setup paths and character initialization in a single unified flow. Smart character seeding ensures a seamless "first-run" experience.
- **Polymorphic UI Primitives**: Upgraded core UI components (e.g., `Button`) to support polymorphic rendering, enabling seamless integration of external setup links into the premium onboarding interface.
- **Configuration Layouts**: Optimized the provider and model setup steps to get users to their first chat faster.

---

## 30. Global User Profiles

A dedicated user-profile settings system for multi-actor layouts.

- **Global User Profile Page**: Added a dedicated user-profile settings page, integrated with a central voice profile store.
- **Self-Concept Wizard Option**: Introduced a dedicated step in Wizard Step 3 to register a "user self-concept" template (compiled under a generic `concept_user` key) for multi-actor layouts.
- **Profile Autofill**: Improved profile field autocomplete and shortcut handling during configuration.
- **Narrator Voice Fallback**: Narrative cards will automatically fall back to the user's customized profile voice when dealing with multi-actor layouts.
- **Always-On Local Engines**: Simplified provider configurations so local engines (`kokoro-local` and `moss-nano-local`) are treated as always configured.

---

## 31. V-Hack & L-Hack (Unified Texture Editor)

In-app visual experimentation surfaces for AI-assisted texture and mutation workflows. Extends AIRI from pure card configuration into model reskinning.

- **V-Hack (VRM Texture Editor)**: Dynamic reskinning for VRM (3D) models. Upload, edit, and save-back textures directly. Expands AIRI from pure card configuration into in-app visual experimentation.
- **L-Hack (Live2D Texture Editor)**: Surgical upload/download of Live2D model textures for precise, live editing. Surgical Eraser to remove or hide specific model components. Export stability ensures custom tweaks persist across sessions.
- **Multi-Runtime Support**: Also supports MMD/PMX and Spine runtimes.

---

## 32. Platform & Operations Hardening

Internal hardening to ensure the app remains a stable, performant "Daily Driver."

- **Interaction Throttling**: Sophisticated **rate-limiting (200ms)** on window move/resize events to prevent IPC flooding and UI stuttering during desktop manipulation.
- **Secure CORS Bypass**: A main-process header interceptor for Electron that allows secure communication with external providers without breaking browser safety policies. User-managed dynamic CORS bypass settings allow users to configure their own CORS bypass URLs for any provider that enforces CORS — routed through Electron to bypass restrictions.
- **Single Instance Lock**: Added a desktop process lock to prevent duplicate parallel running instances of AIRI.
- **Environment Guardrails**: Strict enforcement of **Node.js >= 20.14.0** and **pnpm >= 10.0.0** via `.npmrc` to prevent the `tsdown` build crashes found in modern dependencies.
- **Identity-Guarded Character Switching**: Suppresses redundant model reloads and duplicate toasts when card metadata updates **without an actual model switch**.
- **Tray Position Restore**: Auto-restores last window position from a saved snapshot on startup. Restored control strip bounds persistence on refresh.
- **macOS Compatibility Support**: Relaxation of Node.js constraints (`<26.0.0`) and resolution of TextJournalEntry type mismatches to ensure the project builds flawlessly on modern Apple Silicon environments. Disabled maximizing the Actor Stage window to prevent macOS space contention and window hiding side effects.
- **Production Electron Sandbox**: Enabled the full Chromium sandbox for the Electron environment, dramatically improving security for web-facing provider integrations.
- **MCP Config Stabilization**: Canonical path resolution for Model Context Protocol (MCP) servers, ensuring all custom toolsets reside in the `@appData/airi` directory for cross-platform reliability.
- **Provider Onboarding & Metadata UX**: The provider settings surface now includes more beginner-friendly onboarding cues and richer provider metadata presentation to make initial setup easier to understand.
- **Cross-Window IndexedDB Sync**: Resolved a critical "Lost Update" race condition in `IndexedDB`. Chat sessions and long-term memory entries are now synchronized across all Electron windows, preventing data loss during restarts.
- **Index Auto-Recovery Bridge**: Added an automated scanner that runs on startup to reconstruct missing index records from raw local session files.
- **Crash-on-Quit Prevention**: Deployed a global prototype-level guard against accessing destroyed `BrowserWindow` and `webContents` instances, resolving the most prominent crash during quit transitions.
- **Main-Thread Proactivity Optimization**: Eliminated severe 300ms–500ms renderer microstutters by refactoring the OS-sensor filtering loops to single-pass reductions and throttling the heartbeat evaluation window.
- **VRM Expression Sync Optimization**: Optimized the manual blendshape weight injection loop to use "dirty checks," avoiding expensive, redundant API calls across the three.js engine boundary when multiple expressions overlap.
- **Redundant Animation Culling**: Prevented redundant reloads of `.vrma` files during unchanged idle cycles using strict URL-based guards on the VRM Scheduler.
- **Native Module Safeguards**: Wrapped all hardware-level native module imports (`active-win`, `loudness`, `systeminformation`) in safety guards. The app boots reliably even if specific native drivers are missing or incompatible. Koffi Win32 FFI fallback for active window tracking.

---

## 33. Architecture & Pipeline Unification

All interaction pipelines share one toolchain.

- **Shared `builtinTools` Surface**: All interaction pipelines (typed chat, STT-triggered chat, proactivity heartbeats) consume the same shared `builtinTools` surface. That means new builtin tools like `text_journal` or `stage_widgets` are automatically available across every interaction pipeline without per-surface wiring.

---

## 34. Zero-Trust Privacy Architecture

A foundational principle of this fork: the developer has zero access to any user data.

- **No Analytics, No Telemetry**: No analytics, no telemetry, no usage tracking of any kind. Legacy PostHog tracking and analytics scripts inherited from upstream have been fully removed.
- **Local-First**: All data (characters, memories, conversations, settings, assets) lives exclusively on the user's machine or their own chosen cloud storage (S3/R2/Google AppData).
- **Opt-In Cloud Sync**: Cloud sync is opt-in and disabled by default. Favors a privacy-respecting local-default posture rather than assuming remote sync should be on.

---

## 35. Integrated Upstream PRs

Features from pending upstream PRs that have been squatted, integrated, and maintained in this fork.

| PR # | Feature | Author | Link |
|:---|:---|:---|:---|
| #1256 | **Amazon Bedrock Provider** — Adds AWS Bedrock as a first-class LLM provider | @chaosreload | [PR](https://github.com/moeru-ai/airi/pull/1256) |
| #1302 | **OpenRouter TTS** — Adds OpenRouter as a speech (TTS) provider | @monolithic827 | [PR](https://github.com/moeru-ai/airi/pull/1302) |
| #851 | **Configurable Chat Send Key** — Adds user-selectable send key option (Enter/Ctrl+Enter) | @cheesemori | [PR](https://github.com/moeru-ai/airi/pull/851) |
| #1026 | **xAI Grok Voice Providers** — Adds Grok TTS/STT as speech providers | — | [PR](https://github.com/moeru-ai/airi/pull/1026) |
| #1336 | **Chat Connection Guard** — Explicitly wait for LLM/Mind connection status before chat | — | [PR](https://github.com/moeru-ai/airi/pull/1336) |
| #1065 | **Manual Model Entry** — Allows manual model string entry if auto-discovery fails | — | [PR](https://github.com/moeru-ai/airi/pull/1065) |
