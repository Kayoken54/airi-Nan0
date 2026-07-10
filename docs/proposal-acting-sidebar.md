# Proposal: Rehearsal Room (Stage Rehearsal Sidebar)

A dedicated sidebar panel in the Chatbox for rapid, iterative prompt-crafting and instant playback testing of the `modelExpressionPrompt` — the bridge between the LLM and the 3D model's emotion/motion system. Think of it as a backstage dress rehearsal where you tweak the acting script and watch the character perform it immediately on the Stage.

---

## Name

**Rehearsal Room** (primary) / **Stage Rehearsal** (alternate).

Theatrical, warm, implies practice and refinement before the real performance. Beats "Acting Lab" in character.

---

## Scope & Target Field

This view is laser-focused on one field from the `ActingConfig` interface ([data-catalog.md:121](file:///Users/richardpinedo/Projects.nosync/airi/airi_dasilva333/docs/data-catalog.md#L121)):

```typescript
interface ActingConfig {
  modelExpressionPrompt: string // ← THIS ONE
  speechExpressionPrompt: string
  speechMannerismPrompt: string
  idleAnimations?: string[]
}
```

The Rehearsal Room exists to configure `modelExpressionPrompt` for the active character. Everything in the sidebar serves that goal — preview available tokens, generate sample text, test orchestration, iterate.

---

## The Core Problem

Configuring the "acting box" — the bridge between an AI-generated text response and the 3D model's emotion/motion parameters — currently requires writing a prompt in the Card Creation settings tab (`CardCreationTabActing.vue`), sending a message in chat, and observing the full roundtrip through the Stage. There is no way to:

- See what emotions/motions are available on the currently loaded model without digging through settings.
- Send a crafted `<|ACT:emotion=happy|>` tag or sample text and instantly observe the orchestration result.
- Iterate rapidly on the acting prompt without switching tabs or polluting chat history.
- Verify that an emotion label actually maps to a visible parameter change on the model.
- Click an emotion name and see the model react immediately on the Stage.

The result is a slow, opaque feedback loop where users guess at prompt phrasing and hope the model interprets it correctly.

---

## Layout & Elements

The Rehearsal Room sidebar is split into two main zones:

### 1. Top Zone — Prompt Editor

A textarea for `modelExpressionPrompt`, styled identically to the one in [`CardCreationTabActing.vue`](file:///Users/richardpinedo/Projects.nosync/airi/airi_dasilva333/packages/stage-pages/src/pages/settings/airi-card/components/tabs/CardCreationTabActing.vue). Includes:

- **Save button** — persists changes to the active card via `cardStore.updateCard()`.
- **Sparkle ✨ button** — opens the same AI prompt-crafting modal helper already used in `CardCreationTabActing.vue` ([line 101-109](file:///Users/richardpinedo/Projects.nosync/airi/airi_dasilva333/packages/stage-pages/src/pages/settings/airi-card/components/tabs/CardCreationTabActing.vue#L101-L109)). Reuses the existing `insertModelExpression` prop pattern so the helper palette is aware of the model's available tokens.

### 2. Bottom Zone — 2×2 Expression & Motion Grid

A horizontally split area with two columns:

#### Left: Available Emotions
- Displays a scrollable list of emotion tags (e.g. `happy`, `sad`, `angry`, `surprised`, `thinking`, `blush`, `whisper`) read from the active model's metadata.
- Normalized across Live2D / VRM / MMD / Spine — the user sees consistent labels regardless of backend (Live2D params → VRM blendshapes → MMD morphs → Spine slots).
- **Editable labels** — each tag has a pencil icon that opens an inline rename input. This maps to the existing emotion-key-to-display-name aliasing system so the user and the actor share a readable vocabulary.
- **Click to effectuate** — clicking a tag immediately sends the expression to the Stage (e.g., sets the model's `happy` parameter to 1.0 for a few seconds). No chat, no prompt — pure instant visual feedback.

#### Right: Available Motions
- Same pattern as emotions but for motion clips (e.g. `wave`, `nod`, `point`, `idle_loop`).
- Editable labels, click-to-effectuate on Stage.
- Read from the model's motion library metadata.

### 3. Sample Input & Orchestrate

Below the expression grid:

- **Sample textarea** — the user types raw sample text. Supports inline `<|ACT:emotion=happy|>` and `<|ACT:motion=wave|>` tags. Tags are visually highlighted/parsed in the input.
- **AI Generate button** — sends a prompt to the user's active LLM for the character: *"Generate some sample text that uses the available expressions to show the character as happy."* The LLM returns text with embedded `<|ACT:...|>` tokens matching the model's emotion/motion vocabulary. The result is inserted into the sample textarea.
- **Orchestrate (Play) button** — sends the sample input through the full acting pipeline (model expression prompt → LLM interpretation → emotion/motion extraction → Stage TTS + expression playback). Plays on the main Stage window. No chat history pollution — sandboxed test run.
- **Result summary** — after orchestration: *"Fired emotion: happy ✓  |  Motion: wave ✓  |  TTS: 2.1s  |  No errors"*

### 4. Utility Toggles

- **Raw TTS toggle** — disables the acting layer entirely. The sample text is sent straight to TTS with no emotion/motion injection. Lets the user A/B compare "with acting" vs "without acting" to gauge prompt effectiveness.
- **Stage guard** — if the Stage window is not open, the Orchestrate button is disabled with a warning: *"Stage window must be open to preview expressions."* The emotion/motion click-to-effectuate feature is similarly gated.

---

## Model Type Normalization

All four model types share a unified emotion/motion vocabulary:

- **Emotions** → parameter groups (Live2D params, VRM blendshapes, MMD morph targets, Spine bone animations).
- **Motions** → predefined animation clips (Live2D motions, VRM animation clips, MMD VMD sequences, Spine animations).

The Rehearsal Room reads the available tokens from the model's metadata. This data likely already exists in the per-model-type settings sections under **Settings → Models → [Live2D / VRM / MMD / Spine]** — we may be able to copy wholesale the existing token-list widgets from those sections, or build a unified abstraction that bridges all four cleanly.

---

## `<|ACT:...|>` Tag Syntax

Inline acting tags within the sample text instruct the system to trigger specific emotions or motions at the tagged position:

```
<|ACT:emotion=happy|> I am so happy to see you!
<|ACT:motion=wave|> Hello there!
<|ACT:emotion=sad,motion=nod|> I understand how you feel.
```

The sample input should parse and visually highlight these tags (e.g., colored pill badges) before orchestration.

---

## Deferred: Multi-Character Cards & `visual_assets`

This proposal scopes to **single-character cards**. Multi-character cards introduce a separate concern — bridging `visual_assets` concept stacks to per-actor emotion/motion sets, where each character may have a different model type and different available tokens. This is acknowledged as a bridge to cross separately.

---

## Answered Open Questions

| Question | Answer |
| :--- | :--- |
| Play on Stage or embedded mini-viewer? | Play on the main Stage. Disable orchestration + effectuation if Stage is not open — show a warning in the sidebar. |
| AI generate uses which model? | The user's active chat LLM for the current character. |
| Save snapshot for regression testing? | Not in v1. The prompt itself is persisted to the card — that's the source of truth. |
| Raw TTS toggle (disable acting layer)? | Yes — include as a utility toggle for A/B comparison. |

---

## User Flow

```
1. Open Chatbox → Rehearsal Room in left panel navigation
2. Emotion grid loads from model: [neutral, happy, sad, surprised, angry, thinking, blush]
   Motion grid loads: [idle, wave, nod, point]
3. User clicks "happy" in the emotion grid → Stage model immediately switches to happy expression
4. User clicks "wave" in the motion grid → Stage model plays wave animation
5. User clicks sparkle ✨ on the prompt editor → AI helper modal opens with model-aware expression tags
6. User types or AI-generates sample: "<|ACT:emotion=surprised|> Oh my goodness, is that really you?"
7. User clicks "Orchestrate"
8. Stage plays TTS audio, model expression changes to "surprised" at the tagged position
9. Result panel shows: "Fired: happy ✗, surprised ✓ | TTS: 2.1s | No errors"
10. User notices "happy" didn't fire — tweaks prompt phrasing, orchestrates again
11. User toggles Raw TTS to hear the line without acting for comparison
12. Iteration continues until prompt is dialed in
```

---

## Technical Surface

- **Registration Pattern:** The Rehearsal Room is a **Chatbox left-panel workspace surface**, not a settings page or a routed view. It follows the same pattern as `chat_world.vue`, `chat_studio.vue`, etc. Registration in `apps/stage-tamagotchi/src/renderer/pages/chat.vue` requires three changes:
  1. **Import** the component (alongside the existing `chat_*` imports at line 15-22).
  2. **Add to the `activeSurfaceComponent` map** (line 83-93) — e.g., `rehearsal: chat_rehearsal`.
  3. **Add a navigation button entry** to the `v-for` arrays in both the mobile overlay sidebar (line 661) and the desktop persistent sidebar (line 709).
  4. **Update the `useLocalStorage` type union** for `activeSurface` (line 81) to include `'rehearsal'`.
- **Component Path:** `apps/stage-tamagotchi/src/renderer/components/chat/chat_rehearsal.vue` — follows the `chat_*.vue` naming convention used by all other surfaces (`chat_world.vue`, `chat_studio.vue`, `chat_director.vue`, etc.).
- **Model Metadata Source:** Read available emotions/motions from the active card's model definition (`activeCard.extensions.airi.modules`) and the model loader's metadata.
- **Expression Effectuation:** Clicking an emotion/motion sends an immediate expression update to the Stage — likely through the existing store pathway that sets expression parameters (e.g., `live2dStore.setExpression` or equivalent).
- **Orchestration:** Reuses the same pipeline as chat ingestion — sends sample text through the LLM with the acting prompt injected, parses the response for `<|ACT:...|>` tags, plays TTS with expression keyframes on the Stage. Sandboxed — does not persist to chat history.
- **Prompt Storage:** `modelExpressionPrompt` is read/written via the card's extensions (`cardStore.updateCard()`), same path as `CardCreationTabActing.vue`.
- **Sparkle Helper Reuse:** Import the same helper modal/props pattern from `CardCreationTabActing.vue` — `actingModelExpressionOptions`, `actingGroupedExpressionTags`, `insertModelExpression`, `sparkle-click` emit.
- **Per-Model Widget Reuse:** Investigate the existing model-specific expression/motion list widgets under Settings → Models for each type (Live2D, VRM, MMD, Spine). These may be liftable wholesale into the Rehearsal Room, or a unified abstraction may be warranted.

---

## Model Settings Component Catalog

Each model type's "Character Customizations" section has a different shape, feature set, and persistence strategy. This catalog inventories all five source files so the Rehearsal Room MVP can normalize them into a unified interface.

### Source files

| Model | Component | Sub-component (expressions) |
|-------|-----------|-----------------------------|
| Live2D | `packages/stage-ui/src/components/scenarios/settings/model-settings/live2d.vue` | `live2d-customization.vue` |
| VRM | `packages/stage-ui/src/components/scenarios/settings/model-settings/vrm-expressions.vue` | *(inline)* |
| MMD | `packages/stage-ui/src/components/scenarios/settings/model-settings/mmd.vue` | *(inline)* |
| Spine | `packages/stage-ui/src/components/scenarios/settings/model-settings/spine.vue` | *(inline)* |

---

### A. Expressions / Emotions

All four model types expose a **read-only** list of named expression presets discovered from the model file. New expressions cannot be created at runtime — they are baked into the model formats (Live2D `.exp3.json`, VRM BlendShapeClips, MMD morph targets, Spine animation tracks). This makes a safe normalization baseline: every backend provides a discoverable, immutable list of named presets.

Raw parameter manipulation (individual sliders, bone values) is deferred — focus is on unifying the preset layer.

| Feature | Live2D | VRM | MMD | Spine |
|---------|--------|-----|-----|-------|
| **Store** | `live2dStore` (`@proj-airi/stage-ui-live2d`) | `modelStore` (`@proj-airi/stage-ui-three`) | `mmdStore` (`@proj-airi/stage-ui-mmd`) | `spineStore` (`@proj-airi/stage-ui-spine`) |
| **Key list** | `availableExpressions: {fileName, name}[]` | `availableExpressions: string[]` | `availableMorphs: string[]` | `availableAnimations: {name, duration}[]` *(overlay tracks)* |
| **Expression nature** | Named parameter-override presets (`.exp3.json`) | BlendShapeClips (glTF VRM extension) | Morph targets (PMX vertex groups) | Animation tracks (layered on idle) |
| **Activate/click** | `toggleExpression(fileName)` — sets params to 1.0/0.0 | `toggleExpression(name)` — sets blendshape to 1.0/0.0 | `handleMorphSelect(morph)` — sets single `previewExpression` *(UI limitation: currently single-select, but format supports simultaneous morphs)* | `toggleAnimation(name)` — toggles boolean per model ID |
| **Active state** | `activeExpressions: Record<string, number>` | `activeExpressions: Record<string, number>` | `previewExpression: Ref<string \| null>` | `activeAnimations: Record<string, Record<string, boolean>>` |
| **Editable labels** | ❌ *(not implemented yet)* | ❌ *(not implemented yet)* | ✅ `morphMappings: Record<string, string>` | ✅ `animationMappings: Record<string, string>` |
| **Label save target** | N/A | N/A | `localStorage('settings/mmd/morph-mappings')` | Component-local `ref` — **volatile** |
| **Visibility control** | ❌ *(not implemented yet)* | ❌ *(not implemented yet)* | ✅ `hiddenMorphs: string[]` | ✅ `hiddenAnimations: string[]` |
| **Visibility save target** | N/A | N/A | `localStorage('settings/mmd/hidden-morphs')` | Component-local `ref` — **volatile** |
| **ACT emotion mapping** | ✅ 7 slots: `happy, sad, angry, surprised, neutral, think, cool` — long-press modal | ✅ Same 7 slots — long-press modal | ❌ *(not implemented yet — no technical barrier)* | ❌ *(not implemented yet — no technical barrier)* |
| **Mapping persist** | `emotionMappings` → `extensions.airi.modules.live2d` | `emotionMappings` in store | N/A | N/A |
| **Favorite/star** | ❌ *(not implemented yet)* | ✅ `favoriteExpression: Ref<string>` | ❌ *(not implemented yet)* | ❌ *(not implemented yet)* |
| **Reset all** | ✅ | ✅ | ❌ *(single-select model)* | ✅ |
| **Wardrobe/Outfits** | ❌ *(not implemented yet — no technical barrier)* | ✅ "Build Outfit" → `{id, name, icon, type, expressions}` → `extensions.airi.outfits[]` | ❌ *(not implemented yet — format supports simultaneous morphs)* | ❌ *(not implemented yet — overlay combination works but can produce unpredictable results; should not restrict user creativity)* |
| **Preset vs custom** | No categories | Categorized: `presets` (has uppercase) vs `custom` (all lowercase) | No categories | No categories |

**Unified target:** All four get editable labels, visibility toggles, ACT emotion mapping (long-press → 7-slot modal), favorite/star, and Wardrobe bundles. The only in-progress work is building the UI — none of these hit a format-level barrier.

---

### B. Motions / Animations

Custom motion upload is out of scope for the Rehearsal Room — it is already handled by the model selector's "Add Local" button where users import both models and motions (`.vmd` for MMD, `.vrma` for VRM). Live2D and Spine do not support generic external motion injection at the format level.

| Feature | Live2D | MMD | Spine |
|---------|--------|-----|-------|
| **Key list** | `availableMotions` (from store watcher) | `availableMotions: string[]` + `customMotions` *(from IndexedDB)* | `availableAnimations: {name, duration}[]` |
| **Key shape** | `{name, fullPath, displayPath, group, index, sound?}` | `string` (filename) | `{name, duration}` |
| **Editable labels** | ✅ `motionMappings: Record<string, string>` | ❌ *(expressions only, not motions)* | ✅ `animationMappings: Record<string, string>` |
| **Label save target** | Card: `extensions.airi.modules.live2d.motionMappings` | N/A | Component-local `ref` — **volatile** |
| **Visibility control** | ✅ `hiddenMotions: string[]` | ❌ | ✅ `hiddenAnimations: string[]` |
| **Visibility save target** | Card: `extensions.airi.modules.live2d.hiddenMotions` | N/A | Component-local `ref` — **volatile** |
| **Idle cycle toggle** | ✅ `toggleMotionInCycle()` — key: `live2d:{group}:{index}:{fullPath}` | ✅ `toggleMotion()` — key: `mmd:{name}` | ✅ `toggleAnimationInCycle()` — key: `spine:{name}` |
| **Cycle save target** | Card: `extensions.airi.acting.idleAnimations[]` | Same | Same |
| **Click to preview** | `handleMotionSelect()` — `currentMotion {group, index}` | `handleMotionSelect()` — `currentMotion` string | `handleAnimationSelect()` — `currentAnimation.name` |
| **"None" option** | ✅ Click active again to deselect | ✅ Dedicated "None" row | ✅ Dedicated "None" row |
| **Duration display** | ✅ *(motion data has `Duration` field — not surfaced in UI yet)* | ✅ *(VMD has known frame count + frame rate — not surfaced)* | ✅ `animation.duration` |
| **Sound indicator** | ✅ Live2D-only — `.motion3.json` `Sound` field | ❌ *(VMD is keyframe data only)* | ❌ *(Spine format doesn't bundle audio)* |
| **Group badge** | ✅ Pill showing `motion.group` | ❌ | ❌ |

**Group badge strategy:** Live2D's motion groups (Idle, Tap, PinchIn, etc.) are an authoring convention. For MMD and Spine, simulate a single default group (e.g. "Animations") so the UI maintains a consistent top-level grouping concept across all model types.

**Unified target:** Add editable labels + visibility toggles to MMD motions. Persist Spine's `animationMappings`/`hiddenAnimations` to the card (currently volatile). Surface duration everywhere. Sound indicator remains Live2D-only (format-level constraint).

---

### C. Unified Interface Target

Normalize all four backends into a single list component for the Rehearsal Room (later backportable to each model settings page). Every entry row:

```
┌──────────────────────────────────────────────────────────────────┐
│ ● [group badge]  Display Name                          [∞] [✎] [👁] │
│   originalKey                                        (1.2s)  (♪)  │
└──────────────────────────────────────────────────────────────────┘
```

| Action | Icon | Normalizable? | Notes |
|--------|------|:-------------:|-------|
| **Activate** *(short press)* | — | ✅ All 4 | Toggle expression / preview motion |
| **Map to ACT** *(long press)* | 🎭 modal | ✅ All 4 | Map expression to 1 of 7 ACT emotion slots (`happy, sad, angry, surprised, neutral, think, cool`) |
| **Idle cycle** | ∞ | ✅ All 4 | Add/remove from `idleAnimations[]` with namespaced keys (`live2d:`, `mmd:`, `spine:`, `vrma:`) |
| **Rename** | ✎ | ✅ All 4 | Inline edit display name |
| **Visibility** | 👁 | ✅ All 4 | Hide/show from lists |
| **Wardrobe** | 👕 | ✅ All 4 | Bundle expression activations, save as named outfit. Spine caveat: overlay combinations can be unpredictable but should not be restricted |
| **Favorite** | ⭐ | ✅ All 4 | Mark as favorite — pure UI concept, no format dependency |
| **Duration** *(motions)* | 1.2s | ✅ All 4 | Animation length badge — all formats carry duration data |
| **Group badge** | pill | ✅ All 4 | Live2D uses real motion groups; MMD/Spine simulate a single default group for UI consistency |
| **Sound** *(motions)* | ♪ | Live2D only | Format-level constraint — `.motion3.json` carries audio; VMD/VRMA/Spine don't |
| **Reset all** | ↺ | ✅ All 4 | Clear all active expressions/motions |

---

### D. Persistence Target

All user-authored configuration (labels, visibility, ACT mappings, favorites) converges on the card's extensions namespace — one canonical place per model type, replacing the current fragmentation across localStorage, volatile refs, and store internals:

| Data | Target path |
|------|-------------|
| Expression labels | `extensions.airi.modules.{type}.expressionMappings` |
| Expression visibility | `extensions.airi.modules.{type}.hiddenExpressions` |
| Motion labels | `extensions.airi.modules.{type}.motionMappings` |
| Motion visibility | `extensions.airi.modules.{type}.hiddenMotions` |
| ACT emotion mappings | `extensions.airi.modules.{type}.emotionMappings` |
| Idle cycle list | `extensions.airi.acting.idleAnimations[]` *(already unified)* |
| Wardrobe/Outfits | `extensions.airi.outfits[]` |

The Rehearsal Room MVP reads/writes to these card paths. When each model settings page is later backported, it converges to the same paths.

---

### E. Control Strip Runtime Popovers & Overhaul Plan

The Control Strip (`packages/stage-ui/src/components/scenarios/layout/ControlStrip.vue`) has five actor-related popovers defined in the `control-customizer.ts` constants (`Actor & Wardrobe` section). These are **runtime surfaces** — they stay as popovers; the Rehearsal Room does not replace them. The Rehearsal Room is the configuration & understanding bridge: it helps the user discover what the model can do, map concepts, and set preferences. The popovers are for quick runtime access.

**Source:** `packages/stage-ui/src/constants/control-customizer.ts:202-260`

| Popover ID | Current Label | Type | What it shows | Verdict |
|---|---|---|---|---|
| `actor-expressions` | Expressions (Facial) | `menu` | 4-column grid of 7 ACT emotion emojis (😊😢😠😲😐🤔😎) + random shuffle. Resolves through `emotionMappings` to activate model expressions. | **Keep as-is.** Perfect design. Needs MMD/Spine support (they currently have no ACT mapping UI, so nothing to resolve — the Rehearsal Room fills that gap). |
| `actor-all-emotions` | All Emotions | `menu` | Flat scrollable list of every raw model expression. Click toggles on/off. Currently Live2D/VRM only. | **Keep, add activation.** The user should be able to activate expressions directly from this popover. Needs MMD/Spine support (format allows it — current "unsupported" is a UI gap). |
| `actor-motions` | Motions | `menu` | Flat scrollable playback list with "None" option. Pure play — no configuration. | **Keep as pure play.** Add an **Edit ✎ button** in the corner that deep-links to the Rehearsal Room (or model settings page) so the user can jump from consumption to configuration without hunting. |
| `actor-wardrobe` | Wardrobe (Outfits) | `menu` | 3-column grid of saved outfits (Base=amber, Overlay=sky). Filter row. Calls `cardStore.applyOutfit()`. Currently Live2D/VRM only. | **Perfect design.** Needs extended model type support — the Outfit type (`{id, name, icon, type, expressions}`) is renderer-agnostic. MMD and Spine overlays are technically supportable. |
| `actor-idle-animations` | Animation Cycler | `cycler` | Strip toggle button. Dispatches `control-strip:action` → `cycleAnimation()`. | **Likely redundant.** Motions and idle animations are the same list — the idle cycle is just motions with ∞ toggled on. The motions popover already surfaces which motion is active. If the strip needs a global "auto-cycle on/off" toggle, that's separate from listing motions and could just be a simpler checkbox. Consider merging into the motions popover or removing. |

**Data sources per popover (current state):**

| Popover | Live2D | VRM | MMD | Spine |
|---|---|---|---|---|
| Expressions | `live2dStore` via `emotionMappings` resolve | `modelStore` via `emotionMappings` resolve | ❌ no mapping data | ❌ no mapping data |
| Motions | `live2dStore.availableMotions` → `{key: "group:index", label}` | `customVrmAnimationsStore.animationKeys` (VRMA) | `mmdStore.availableMotions` → `{key, label}` | `spineStore.availableAnimations` → `{key: name, label: name}` |
| All Emotions | `live2dStore.availableExpressions` → `{name, isActive}` | `modelStore.availableExpressions` → `{name, isActive}` | ❌ shown as unsupported | ❌ shown as unsupported |
| Wardrobe | `extensions.airi.outfits[]` → `cardStore.applyOutfit()` | Same | ❌ shown as unsupported | ❌ shown as unsupported |
| Idle Cycler | Broadcast to renderer page | Same | Same | Same |

**Relationship to the Rehearsal Room:**

```
Rehearsal Room (Chatbox sidebar)          Control Strip (runtime popovers)
─────────────────────────────────────     ──────────────────────────────────
Configure: labels, visibility, ACT        Consume: fire expressions, play
mappings, favorites, idle cycles,         motions, apply outfits, toggle
outfits                                    all-emotions

  ↑ "Edit" button deep-links from          ↑ popovers stay lightweight
    popovers back to Rehearsal Room          for quick runtime access
```

The Rehearsal Room bridges the gap between *what the model can do* (raw expression/motion keys), *what the user understands as possible* (renamed labels, mapped ACT slots, favorited shortcuts), and *how to configure it all* (visibility, idle cycles, outfits). The popovers just use the result.

---

### F. Deferred: Multi-Character Selector

Once the unified emotion/motion control is stable, a character selector dropdown should be added to the Rehearsal Room header, following the same `visual_assets` parsing pattern used in `chat_studio.vue`:

- Parse `extensions.airi.visual_assets` to discover characters with model bindings (as the Studio tab does at `chat_studio.vue:95-204`)
- Each character maps to a model type + model ID, which determines the expression/motion vocabulary shown
- Fall back to the primary character (`modules.displayModelId`) for single-character cards (Gen 1 detection pattern)

This is a bolt-on after the core unified control is solid — adding it now would distract from the normalization work.
