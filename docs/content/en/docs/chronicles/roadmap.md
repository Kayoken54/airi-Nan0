# AIRI Pending Items Catalog

This document tracks all active pending items, architectural roadmaps, and feature branches for the AIRI project, grouped by system layers.

---

## Core Infrastructure & Network Services

### Cloud & Sync Systems
*Reference: [project-byos-cloud-sync.md](../../../../../project-byos-cloud-sync.md)*
*   **Dropbox & Google Drive Storage Engines**: Extend database/asset storage options to natively support Dropbox and Google Drive as storage providers (in addition to existing S3/R2 and Local FS).
*   **Modular Token Lifecycle Management**: Implement automatic refresh handshakes for Dropbox/Google Drive integrations.

### Web CORS Proxy Bypass (User-Hosted Cloudflare Workers)
*Reference: [proposal-web-cors-proxy-bypass.md](../../../../../proposal-web-cors-proxy-bypass.md)*
*   **Cloudflare Workers Deployer**: Add a "Deploy to Cloudflare Workers" button in Settings to automatically bootstrap a private CORS reverse-proxy worker template.
*   **System Connection Settings**: Introduce Worker URL inputs and Web CORS bypass toggles.
*   **Dynamic XHR/Fetch Routing**: Redirect requests to CORS-restricted endpoints (Deepgram, Pioneer, Opencode) through the user's private worker when matching the bypass list.

### Provider Store Restructuring (`providers.ts`)
*Reference: [project-provider-store-restructuring-plan.md](../../../../../project-provider-store-restructuring-plan.md)*
*   **Monolithic Store safe Phase 1 Decomposition**: Extract shared types, helper functions, and the large legacy hand-written provider metadata declarations out of the monolithic `packages/stage-ui/src/stores/providers.ts` (currently ~3k lines) into dedicated registry-family files (`types.ts`, `helpers.ts`, and `registry/*`).
*   **Preserve Store Interface**: Maintain the public API, selectors, and validation behavior of `useProvidersStore` unchanged for consumers while simplifying the core file.

### Core-Agent Revamp (Apeira Runtime Integration)
*Reference: [proposal-core-agent-revamp.md](../../../../../proposal-core-agent-revamp.md)*
*   **Apeira Evaluation**: Monitor and evaluate Apeira (v0.0.5+) as a potential lightweight replacement for `@proj-airi/core-agent` once the codebase and persistence interfaces stabilize.
*   **Plugin Hooks Mapping**: Map our fork-specific orchestration behaviors (e.g. autonomous artistry triggers, live session bidirectional audio) to Apeira's Plugin API.

### Infrastructure & UI Health
*   **Model Selector Stability (Research & Design - Needs Retesting)**: Investigate and resolve the "reactive reset" bug where selecting a temporary preview model in the Model Selector is overridden by the active character's stored model configuration.
*   **Gemini Onboarding Modal Restore**: Move the onboarding dialog window trigger to `ControlStrip` activation: if Gemini Live is activated and there is no Google API key configured, trigger this modal.

### AnimaDex Character Creator Wizard
*Reference: [proposal-animadex-wizard.md](../../../../proposal-animadex-wizard.md)*
*   **AnimaDex Dataset Integration**: Evaluate Route A (offline bundling of the 46MB database) vs Route B (CDN web-hosted directory).
*   **Metadata Parser Mapping**: Map tags and triggers into card properties.
*   **Speech & UST Integration Pipeline**:
    *   Include `voiceConfig.ust` in the LLM synthesis payload (`handleGenerate()` cast builder).
    *   Add `modelPromptSpeech` to the LLM output schema definition (`systemMsg`).
    *   Write the parsed `speechExpressionPrompt` dynamically on card assembly (`confirmCreateCard()`).
*   **Per-Character Idle Animations**:
    *   Add `idleAnimations?: string[]` to the `visual_assets.[actor_key]` schema.
    *   Update runtime model selector to read per-actor `idleAnimations` on actor switch.
    *   Instruct synthesis LLM to populate `idleAnimations[]` from available motions.
    *   Add per-actor idle selector in Wizard Step 2.
    *   Expose per-actor idle selectors in the Card Edit UI's Acting tab.

---

## Local Runtimes & Desktop Automation

### Local WebGPU RWKV Enhancements (State File Merge)
*Reference: [proposal-built-in-llm-webgpu.md](../../../../../proposal-built-in-llm-webgpu.md)*
*   **State File Merge Support**: Implement merging a base model `.safetensors` URL with a separate `.state` file URL inside the Web Worker before model session creation (enabling bilingual roleplay states).
*   **Prompt Template & Model Selector**: Add a prompt template configuration selector and custom model URL input to allow power users to load arbitrary Hugging Face safetensors.

### Engine Sidecar (Godot vs. Mate-Engine)
*Reference: [engine-sidecar-journal.md](../../../../../engine-sidecar-journal.md)*
*   **Render Offloading Spike**: Evaluate offloading VRM rendering from the main Electron/WebGL thread into a compiled, native sidecar window.
*   **Godot 4 Sidecar**: Investigate the upstream implementation (PRs #1697, #1724, #1830) using a C# websocket handshake to determine if packaging overhead is justified.
*   **Mate-Engine Alternative**: Prototype packaging a compiled release of Mate-Engine (Unity C# ShaderLab runtime) linking via WebSocket/IPC to support real-time ComfyUI asset spawning and interactive physical collisions.

### Computer Use & Desktop Agent Subsystem
*Reference: [project-selective-upstream-sync-shortlist.md](../../../../../project-selective-upstream-sync-shortlist.md)*
*   **Desktop Observation & Overlay Baseline**: Port and test macOS Chrome-first trajectory for capturing and rendering overlays on the user's screen.
*   **Browser-Native DOM Action Routing**: Enable native communication protocols between the Tamagotchi stage and the `computer-use-mcp` service.
*   **Ghost Pointer & Scheduler**: Implement the ghost pointer UX for desktop control overlays, transcript truth sources (safety projections), and the background desktop scheduler.

---

## Consciousness & Cognitive Pipeline

### Attention Ecology & Cognitive Gates
*Reference: [proposal-attention-ecology-local-webgpu-guard.md](../../../../../proposal-attention-ecology-local-webgpu-guard.md)*
*   **Local WebGPU Gated Inference**: Continuously poll screen captures every 2 seconds, generate vision embeddings, and filter events locally with a lightweight RWKV model before deciding to promote them to the main Cloud LLM.
*   **Vector-Sampled Attention Pool**: Query vector store of captured frames for the top $N$ most relevant visual landmarks instead of passing a chronological FIFO feed.

### Prefix Cache Alignment & Prompt Compilation Controls
*Reference: [proposal-prefix-cache-alignment.md](../../../../../proposal-prefix-cache-alignment.md)*
*   **Prefix Alignment Logic**: Re-order prompt assembly arrays (System Prompt -> Chat History -> Suffix Telemetry/Deltas) to optimize caching mechanics and maximize prefix hit rates for DeepSeek, Gemini, and OpenRouter. (Analyze and visit 2-3 specific implementation areas).
*   **Unified Context Builder**: Implement `useContextBuilder` to unify and dry up prompt construction across Proactivity, Destiny 2, and Producer suggestions.
*   **LLM Performance Settings Store**: Implement a new global settings store (`useSettingsLlmPerformance`) for prefix caching toggle, global history slice modes, and counts.

### "Forward to LLM" VLM Captioning & Tagging Pipeline [Work In Progress]
*Reference: [proposal-vlm-forward-to-llm.md](../../../../../proposal-vlm-forward-to-llm.md)*
*   **Decoupled Sight Pipeline**: Implement a "Forward to LLM" strategy in Settings > Modules > Vision to separate VLM image analysis from character voice. VLM generates descriptions/tags (e.g. WD14 tagger, Kimi 2.5), which are injected into the text stream so the primary LLM can respond in its authentic character voice. (Mostly implemented/working; needs debugging and tuning for timing issues).

### Proactivity System Enrichments
*Reference: [project-proactivity-enrichment-roadmap.md](../../../../../project-proactivity-enrichment-roadmap.md)*
*   **Clipboard Metadata Buffer**: Optional rolling buffer of last 5 clipboard events (mime-type, size, source app) for non-identifying user intent tracking.
*   **Invisible Emotion Meters**: Track cumulative sentiments (Trust, Patience, Playfulness) across multiple sessions.
*   **Physical Model Tracking**: Log click/mouse coordinates mapped directly to VRM bones or Live2D hit areas.
*   **Media Now Playing**: Speech module hooks to verbally comment on currently playing media tracks.
*   **Temporal & Day Tropes**: Character comments contextually matching days of the week ("Taco Tuesday").

---

## Memory & Grounding RAG

### Memory & Grounding RAG
*References: [proposal-dynamic-memory-rag-injection.md](../../../../../proposal-dynamic-memory-rag-injection.md) | [nan0-integration-feedback.md](../../../../../nan0-integration-feedback.md)*
*   **Toggle 2 — Timeline Memory (RAG)**: Implement semantic search limited strictly to the current active session ID.
*   **Toggle 4 — Recent Topics Revisit**: Finish the decaying topic frequency map (Turn-Based, Segment-Based, and Wall-Clock decay strategies) utilizing Echo Chips, raw turns, and STMM blocks.
*   **Actor & Relationship Schema Integration**: Enhance `layered-memory.ts` and memory repositories with native TypeScript actor properties (`actorId`, `targetActorId`, and `relationship`) for episodic vector indexing, bypassing the need for a Python/Chroma sidecar.

### Live2D DSL Manifest Scripting Interpreter
*Reference: [live2d-dsl-interpreter-spec.md](../../../../../live2d-dsl-interpreter-spec.md)*
*   **DSL Virtual Machine**: Event-driven VM parsing custom metadata manifests (logic parameters, assignment codes, intimacy multipliers) for advanced third-party Live2D models.
*   **Active Staging & Dating Sim Development Branches**:
    *   `feature/dating-sim-demo`
    *   `feature/dating-sim-gen3`
    *   `remotes/origin/kazzy-feature-dating-sim-demo`
    *   `remotes/aki/feature/dating-sim-demo`

---

## Speech & Audio Systems

### Audio Studio & Virtual Voice Bundling
*Reference: [feat-audio-studio.md](../../../../../feat-audio-studio.md)*
*   **Virtual Provider Abstraction**: Establish `virtual-audio-studio` to bundle base speech engines (Kokoro, Azure, OpenAI) with custom audio effects and UST settings into named, globally-referenceable voice profiles.
*   **Xvan's Audio Effects**: Build modular high-fidelity post-processing transformations (Pitch Shifting, Rate/Speed adjustments, and Voice Equalizers) directly into the voice bundle engine (currently working perfectly).
*   **[x] Advanced UST Rules Expansion**: Expand the per-profile Universal Speech Transformer (UST) settings to support advanced, non-regex rules (Option A Bracket Action Mapper) and custom character substitutions (Custom Replacement Rules) to prevent spelling-out glitches. (Completed)
*   **Immersive User Profile Playback Routing**:
    *   Support setting a 3D/2D display model representation in the Global User Profile.
    *   Route user speech previews through `speechRuntimeStore.openIntent` (Option B) when a user model is active to trigger LipSync, animations, and stage captions, falling back to isolated audio playback (Option A) when no model is set.

### Higgs Audio v3 TTS Integration
*Reference: [proposal-higgs-audio-v3-tts-integration.md](../../../../../proposal-higgs-audio-v3-tts-integration.md)*
*   **[x] Universal Speech Transformer (UST) bracket-to-token converter**: Add a toggle in Audio Studio profiles to convert square bracket directions (`[emotion:sadness]`) into Higgs-compatible XML/token format (`<|emotion:sadness|>`) before sending the text to the TTS engine. (Completed)
*   **Expression Tag Buttons**: Populate emotions, styles, and sound effects as clickable speech tags in the Character Card Edit Modal using the chatterbox capabilities endpoint.

### Future Modalities (Audio & Video)
*Reference: [project-future-modalities-support.md](../../../../../project-future-modalities-support.md)*
*   **Raw Audio Input**: Support native audio ingestion for LLMs that support raw audio modality (e.g. to capture melodies/tones via OpenRouter or Google Gemini).
*   **STT Pre-Transcription Chooser**: Implement a choice dialog upon attaching audio to run local Whisper pre-transcription (STT Scribe) before sending.
*   **Smart Video Frame Sampling**: Frontend Canvas/WebCodecs frame extraction allowing users to select sampling rates (e.g. 1 frame per X seconds).
*   **Tiled Contact Sheets**: Combine extracted video frames into a single image to send visual context to standard vision models.

---

## Visual Manifestation & Stage Presentation

### Director-Led Modular Visual Assets ("Production Studio")
*Reference: [proposal-visual-state-outfit-hook.md](../../../../../proposal-visual-state-outfit-hook.md)*
*   **Manifestation Tab Expression Triggers**: Rescope visual state concept manifestation to support activating expressions mapped to emotions or motions via the ACT system.
*   **ACTOR Token Model Spawning**: Ensure the ACTOR token spawns a new model defined by the `display-model-id`.
*   **Preset Expression Configuration**: Map active manifestations to VRM blendshapes or Live2D parameters, binding the outfit to the visual state setting.
*   **"Bases for Places" Concept Packs**: Preload location sets (bedroom, kitchen, etc.) as Base concepts to cleanly reset/wipe the active modifier stack on room changes, with actors and moods layered as Additive layers.
*   **"Add Character as Concept" Creator**: Implement a QoL button to query active model, voice, and artistry parameters to dynamically output a decoupled `actor_{name}` concept.
*   **Director Dynamic Mood/Expression Pipeline**: Introduce an emotional output field to the Director to emit 1 of 6 possible core emotions, dynamically mapping it to VRM blendshapes or Live2D parameters in a zero-awareness actor environment.

### Dynamic Item Manifestation (TRELLIS)
*Reference: [proposal-trellis-dynamic-item-manifestation.md](../../../../../proposal-trellis-dynamic-item-manifestation.md)*
*   **Actor Item Tool Calling**: Implement LLM tool calls for `create_stage_item`, `list_stage_items`, and `equip_stage_item` to allow characters to dynamically generate, catalog, and wear items.
*   **ComfyUI TRELLIS 3D Pipeline**: Establish a ComfyUI websocket pipeline that processes natural language prompts via TRELLIS 3D generators, compiling the output as a `.glb` mesh stored in IndexedDB.
*   **Skeletal Bone Socket Mounting**: Build a dynamic mesh injector that Normalizes and attaches the GLB mesh to humanoid skeletal bones (head, wrists, waist, ankles) across VRM, MMD, and Spine runtimes.



### Director-Led Regional Orchestration (Spatial Vision)
*Reference: [proposal-director-led-regional-orchestration.md](../../../../../proposal-director-led-regional-orchestration.md)*
*   **Director Spatial Upgrade**: Evolve the Director LLM from generating flat text prompts to functioning as a **Spatial Scene Architect** that layouts multi-panel/regional visual compositions.
*   **AIRIRegionalResolver Node**: Build a custom ComfyUI node that parses layout JSON from the Director and executes CLIPTextEncode + ConditioningSetArea conditioning combining natively.
*   **Ideogram 4 Spatial Integration**: Deeply integrate the Ideogram 4 JSON caption schema (spatial text rendering, bounding boxes, object vs text areas) as a native regional vision routing backend utilizing a normalized 0-1000 grid.

### Unified Texture Editor (V-HACK / L-HACK)
*Reference: [vhack-design-doc.md](../../../../../vhack-design-doc.md)*
*   **Multi-Model Reskin Editor**: Build a unified texture editor in the Settings page allowing users to dynamically reskin their model and save the file back out. Supports:
    *   VRM (3D)
    *   Live2D (2D)
    *   MMD / PMX
    *   Spine

### Sticker System Specification (Anchored Pseudo-Stickers)
*Reference: [project-stickers-system-spec.md](../../../../../project-stickers-system-spec.md)*
*   **Stickers Refurbish**: Transition from unstable standalone OS-level sticker windows to **anchored pseudo-stickers** rendered as absolute-positioned DOM elements within existing app containers:
    *   **ActorStage Window**: Reacts dynamically to expressions/poses.
    *   **ControlStrip / Island**: Sliding out from behind or sticking to the frame.
    *   **Chat Interface**: Placed along chat bubbles or the input field.
*   **Tactile Physics & Micro-Animations**: Implement rotation jitter (3°-8° random skew), initial spring scale (0 to 1.1 scale on spawn), and a gentle floating translate loop.
*   **Holographic Hover Effects**: Add 3D card tilt based on cursor position accompanied by a holographic sheen reflection overlay.

### Pluggable Integration Architecture
*References: [proposal-twitch-plugin.md](../../../../../proposal-twitch-plugin.md) | [proposal-destiny2-plugin.md](../../../../../proposal-destiny2-plugin.md) | [feat-discord-revamp.md](../../../../../feat-discord-revamp.md)*
*   **Twitch Chat Plugin (`airi-plugin-twitch-chat`)**: Inbound live stream chat context ingest reacting to chats, subs, raids, and channel points.
*   **WIP Plugin Stubs**: Complete stubs for Bilibili Live Stream Ingest (`airi-plugin-bilibili-laplace`) and Home Assistant Event Ingest (`airi-plugin-homeassistant`).
*   **Destiny 2 Proactive Speech Plugin**: Real-time Bungie API game event polling and a local ONNX/WebGPU screen-capture OCR pipeline (`PP-OCRv6_tiny_rec_onnx`) for live PVP/PVE HUD analysis.
*   **Discord Revamp - Voice Delivery, Isolation & Sync**:
    *   Implement `/voicemode` command to support `puppet` (local speaker playback), `voicenote` (combining TTS audio chunks to upload as voice notes), and `none` modes.
    *   Implement `/voicecall` command classic `tts` pipeline (Discord Audio -> Deepgram STT -> Custom LLM -> Custom TTS -> Discord Audio) — *Note: Gemini Live VC call is 100% active/implemented, while this classic TTS VC path remains planned/blocked by Kyo.*
    *   **Gemini Voice Call Sync Parity**: Capture and ingest both user and assistant transcription events from the Gemini Live WebSocket stream back into the active message history logs so that conversation logs stay in sync with the spoken voice session.
    *   Implement `/vision` command toggle state guard (supported natively).
    *   Wire up `/selfie` command trigger (stage capture is fully plumbed).
    *   Implement `/timelines` command (Completed).
    *   Implement `/journalmoment` command (Completed).
    *   Enforce per-channel session/character isolation mapping ($\text{channelId} \longrightarrow \text{activeCharacterId} \longrightarrow \text{activeSessionId}$) (Completed by Kyo, pending merge).
