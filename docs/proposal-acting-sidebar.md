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

## The Downstream AI Mapping Philosophy (The Naming Bridge)

One of the most critical aspects of the Rehearsal Room is establishing the bridge between technical assets and semantic understanding.

```
[Raw Asset Keys]              [Renamed Mapped Labels]         [AI & Suggestion Engines]
expression_1_2.json   ───>   "happy"                ───>     LLM understands "happy",
ParamEyeLX            ───>   "wink"                 ───>     writes <|ACT:emotion="happy"|>
```

### Why Renaming Matters
When a 3D model (Live2D, VRM, MMD, or Spine) is loaded, its native keys are often system filenames (`expression_01.exp3.json`), bone IDs (`ParamEyeLX`), or localized strings. The LLM and the suggestion engines have no context for what these mean:
- **No Semantic Context:** An LLM cannot logically deduce that `expression_1_2.json` represents embarrassment, so it will never generate it.
- **Orchestration Failure:** If the LLM generates a tag like `<|ACT:emotion="happy"|>`, it fails to trigger anything because there is no `happy` key native to the model.

### The Downstream Flow
By renaming these keys in the Rehearsal Room:
1. **Downstream Propagation:** The new human-readable label (e.g. `happy`, `sad`, `smug`) is persisted directly to the active character card extensions.
2. **Instruction Injection:** The suggestion engine reads the card's mapped labels and injects them into the `modelExpressionPrompt` instructions so the LLM learns the valid vocabulary.
3. **Dialogue Generation:** The LLM and the Suggestion generator can write natural sentences embedded with clear, human-readable `<|ACT:emotion="happy"|>` tags.
4. **Visual Execution:** When the tag is received by the Stage, it maps back to the corresponding raw asset file and executes the visual reaction.

---

## Sandbox Orchestration & Pipeline Integration (DRY Principle)

To prevent duplication of audio/visual parsing and timing code, the Rehearsal Room's play button hooks directly into the **shared Speech Runtime Pipeline** instead of creating a custom speech playback lane.

```
Rehearsal Room (Chatbox Process)                Stage Window Host (Renderer Process)
───────────────────────────────                ────────────────────────────────────
1. Parse playground text
2. openIntent({ ownerId }) ──(BroadcastBus)──>  Host receives intent stream
3. Loop parts:                                  Host invokes pipeline:
     - writeSpecial(tag)                          - TTS Generation
     - writeLiteral(text)                         - Slice alignment
4. writeFlush() / end()                           - Captions & synchronized animation
```

### How the Integration Works:
1. **Host Discovery:** The Stage window host (`ControlStripHost.vue`) registers itself as the audio/speech execution host via the `speechRuntimeStore`.
2. **Remote Intent Streaming:** When the play button is clicked in the Rehearsal Room:
   - It opens a runtime intent via `speechRuntimeStore.openIntent({ ownerId: activeCardId.value })`.
   - Under the hood, this uses the VueUse-backed cross-window event bus to forward tokens to the registered Host.
3. **Token Slicing:** The sandbox text is parsed using the same regex pattern utilized by the main chat orchestrator:
   ```typescript
   const parts = content.split(/(<\|(?:ACT|DELAY|ACTOR)[^\r\n]*?(?:\|>|>))/gi)
   ```
4. **Ingestion Execution:** The loop streams parts to the intent:
   - Tags (starting with `<|`) are sent to `intent.writeSpecial(part)`.
   - Plain text is sent to `intent.writeLiteral(part)`.
   - After processing, the player dispatches `intent.writeFlush()` and `intent.end()`.
5. **Downstream Benefits:** This ensures any fixes applied to the main chat audio slicing, tag synchronization, or caption overlay are instantly shared by the sandbox playground.

---

## Layout & Elements

The Rehearsal Room sidebar is split into three main zones:

### 1. Top Zone — Prompt & Instruction Builder

A textarea for `modelExpressionPrompt` designed for prompt-crafting.
* **Save button** — persists changes to the active card via `cardStore.updateCard()`.
* **Sparkle ✨ Generate Instructions** — opens the suggestion helper palette. It reads the current model's mapped, human-readable labels and drafts a complete instruction block teaching the AI how to use those labels in context.

### 2. Middle Zone — Rehearsal Playground Sandbox

Instead of static, semantic mock presets (like "Basic Joy"), the playground uses a **structural syntax template engine** that dynamically injects active keys.

#### Dynamic Presets / Templates:
These buttons are rendered dynamically based on whether `expressions.length > 0` and `motions.length > 0`:
* **Template 1: Single Leading Tag**
  - Generates: `<|ACT:emotion="[exp1]"|> Hello world!`
* **Template 2: Leading & Trailing Tags**
  - Generates: `<|ACT:emotion="[exp1]"|> This is a sandbox test. <|ACT:emotion="[exp2]"|>`
* **Template 3: Combined Emotion + Motion Tag**
  - Generates: `<|ACT:emotion="[exp1]",motion="[mot1]"|> Moving and speaking.`
* **Template 4: Dual Combos**
  - Generates: `<|ACT:emotion="[exp1]",motion="[mot1]"|> Starting off... <|ACT:emotion="[exp2]",motion="[mot2]"|> and transitioning.`

#### AI Custom Templates (`{sparkle} Create More`):
* A button that prompts the active character's LLM to generate 3 additional structural templates utilizing random combinations of mapped expressions and motions, rendering them as clickable temporary preset pills.

#### Playground Actions:
* **Play Endcap (Clapperboard button)** — Streams tokens to the `speechRuntimeStore` intent, triggering Stage playback.

---

### 3. Bottom Zone — Expressions & Motions Explorer

A view listing available parameters, loaded dynamically from the active model.

#### Advanced Filtering & "Treasure Hunting" Toggles:
To help users navigate through raw model files, the explorer includes specific filters:
* **Show Hidden** — Toggles the visibility of items marked hidden.
* **Hide Numeric** (or "Show Numeric" toggle)
  - *Context*: Unnamed or internal parameters are often exported with purely numeric names (`blendshape_01`, `123`). These are usually garbage, but occasionally hide working custom animations.
  - *Tip (Shown when toggled on)*:
    > [!TIP]
    > You are seeing all the internal keys for this model. Some of them might have working expressions. Click through them to see if any produce meaningful faces; if so, rename the key.
* **Hide Capitalized** / **Hide Functional** (under VRM/MMD)
  - *Context*: Capitalized keys (`MouthSmileLeft`, `BrowDownRight`) usually serve a mechanical/functional purpose rather than a semantic expression.
  - *Tip (Shown when toggled on)*:
    > [!TIP]
    > You are observing functional keys that serve a mechanical purpose (e.g. `MouthRight`) rather than semantic expressions. There is often a hidden gem in here; click through them to test.

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
| **Store** | `live2dStore` | `modelStore` | `mmdStore` | `spineStore` |
| **Key list** | `availableExpressions: {fileName, name}[]` | `availableExpressions: string[]` | `availableMorphs: string[]` | `availableAnimations: {name, duration}[]` |
| **Expression nature** | Named parameter-override presets (`.exp3.json`) | BlendShapeClips (glTF VRM extension) | Morph targets (PMX vertex groups) | Animation tracks (layered on idle) |
| **Activate/click** | `triggerEmotion(name)` | `triggerEmotion(name)` | `previewExpression = name` | `playOneShotAnimation(name)` |
| **Active state** | `activeExpressions: Record<string, number>` | `activeExpressions: Record<string, number>` | `previewExpression: Ref<string \| null>` | `activeAnimations: Record<string, Record<string, boolean>>` |
| **Editable labels** | ❌ *(not implemented yet)* | ❌ *(not implemented yet)* | ✅ `morphMappings: Record<string, string>` | ✅ `animationMappings: Record<string, string>` |
| **Label save target** | N/A | N/A | `localStorage('settings/mmd/morph-mappings')` | Component-local `ref` — **volatile** |
| **Visibility control** | ❌ *(not implemented yet)* | ❌ *(not implemented yet)* | ✅ `hiddenMorphs: string[]` | ✅ `hiddenAnimations: string[]` |
| **Visibility save target** | N/A | N/A | `localStorage('settings/mmd/hidden-morphs')` | Component-local `ref` — **volatile** |
| **ACT emotion mapping** | ✅ 7 slots: `happy, sad, angry, surprised, neutral, think, cool` — long-press modal | ✅ Same 7 slots — long-press modal | ❌ *(not implemented yet)* | ❌ *(not implemented yet)* |
| **Mapping persist** | `emotionMappings` → `extensions.airi.modules.live2d` | `emotionMappings` in store | N/A | N/A |
| **Favorite/star** | ❌ *(not implemented yet)* | ✅ `favoriteExpression: Ref<string>` | ❌ *(not implemented yet)* | ❌ *(not implemented yet)* |
| **Reset all** | ✅ | ✅ | ❌ *(single-select model)* | ✅ |

---

### B. Motions / Animations

| Feature | Live2D | MMD | Spine |
|---------|--------|-----|-------|
| **Key list** | `availableMotions` | `availableMotions: string[]` + `customMotions` | `availableAnimations: {name, duration}[]` |
| **Key shape** | `{name, fullPath, displayPath, group, index, sound?}` | `string` (filename) | `{name, duration}` |
| **Editable labels** | ✅ `motionMappings: Record<string, string>` | ❌ *(expressions only)* | ✅ `animationMappings: Record<string, string>` |
| **Label save target** | Card: `extensions.airi.modules.live2d.motionMappings` | N/A | Component-local `ref` — **volatile** |
| **Visibility control** | ✅ `hiddenMotions: string[]` | ❌ | ✅ `hiddenAnimations: string[]` |
| **Visibility save target** | Card: `extensions.airi.modules.live2d.hiddenMotions` | N/A | Component-local `ref` — **volatile** |
| **Idle cycle toggle** | ✅ `toggleMotionInCycle()` | ✅ `toggleMotion()` | ✅ `toggleAnimationInCycle()` |
| **Cycle save target** | Card: `extensions.airi.acting.idleAnimations[]` | Same | Same |
| **Click to preview** | `triggerMotion(group)` | `playOneShotAction(name)` | `playOneShotAnimation(name)` |

---

### C. Unified Interface Target

Normalize all four backends into a single list component for the Rehearsal Room. Every entry row:

```
┌──────────────────────────────────────────────────────────────────┐
│ ● [group badge]  Display Name                          [∞] [✎] [👁] │
│   originalKey                                        (1.2s)  (♪)  │
└──────────────────────────────────────────────────────────────────┘
```

---

### E. Persistence Target

To ensure that expression/motion mappings and visibility settings are shared across all characters using the same model, and to allow automatic cross-device backups via Cloud Sync, all metadata converges directly on the **Display Model metadata entry** (stored in `localforage` and reconciled in the S3 remote `manifest.json`):

| Data | Target Path (in DisplayModel entry) |
|------|-------------------------------------|
| Expression labels / ACT maps | `model.emotionMappings: Record<string, string>` |
| Expression visibility | `model.hiddenExpressions: string[]` |
| Motion labels | `model.motionMappings: Record<string, string>` |
| Motion visibility | `model.hiddenMotions: string[]` |
| Favorite expressions | `model.favoriteExpressions: string[]` |

When old character cards are loaded, a one-time migration runs to sweep any legacy mappings stored in `card.extensions.airi.modules.{type}` into the display model's entry, cleaning the card namespace.

---

## Model Test-Case Homework (Model Finder Checklist)

Use the following catalog to hunt for and register specific models in the local environment that match each test-case requirement. Fill in the filename or ID for each slot.

### A. VRM Models
- [ ] **Numeric Keys:** A model containing purely numeric or generic system-generated keys (e.g., `1`, `002`, `blendshape_10`).
  - *Model Filename/ID:* _____________________
- [ ] **Capitalized/Functional Keys:** A model that has camelCase or capitalized functional keys (e.g. `MouthSmileLeft`, `BrowDownRight`).
  - *Model Filename/ID:* _____________________
- [ ] **Multi-Emotion Blend:** A model that has high-quality blendshapes that can be mixed simultaneously without mesh tearing or model collapse.
  - *Model Filename/ID:* _____________________

### B. Live2D Models
- [ ] **Ready-to-Go Expressions:** A model with clean, pre-built named expression files (e.g., `happy.exp3.json`, `sad.exp3.json`).
  - *Model Filename/ID:* _____________________
- [ ] **Raw Filename Keys:** A model with raw technical filenames (e.g., `exp_09_12.exp3.json`) to trigger the rename banner.
  - *Model Filename/ID:* _____________________
- [ ] **No Expressions:** A model that has zero expression files in its asset folder.
  - *Model Filename/ID:* _____________________
- [ ] **With Motions:** A model containing motion clips.
  - *Model Filename/ID:* _____________________
- [ ] **Motions with Sound:** A model containing `.motion3.json` files that reference audio files.
  - *Model Filename/ID:* _____________________
- [ ] **Motions with Sound & Caption:** A model where motions trigger both audio and built-in text captions.
  - *Model Filename/ID:* _____________________
- [ ] **No Motions:** A model that has zero motion files.
  - *Model Filename/ID:* _____________________
- [ ] **Empty Asset Set:** A model that has neither motions nor expressions (completely blank).
  - *Model Filename/ID:* _____________________

### C. MMD Models
- [ ] **Unicode/Shift-JIS Keys:** A model with morph targets named in Japanese Shift-JIS (e.g., `まばたき`, `にっこり`).
  - *Model Filename/ID:* _____________________
- [ ] **ASCII/English Keys:** A model with morph targets named in standard ASCII/English.
  - *Model Filename/ID:* _____________________
- [ ] **No Morph Targets:** A static MMD PMX model (e.g., a background prop or accessory) with no morph targets.
  - *Model Filename/ID:* _____________________
- [ ] **With Built-in Animations:** A model that has default PMX VMD animations bundled.
  - *Model Filename/ID:* _____________________

### D. Spine Models
- [ ] **Varying Track Durations:** A model with multiple animation tracks having different explicit durations.
  - *Model Filename/ID:* _____________________
- [ ] **No Animations:** A model with no animation tracks (only the default setup pose).
  - *Model Filename/ID:* _____________________
- [ ] **Multiple Skins:** A model that has multiple skins configured in the skeleton.
  - *Model Filename/ID:* _____________________
- [ ] **Multiple Skeletons:** A ZIP containing multiple skeleton variants/files.
  - *Model Filename/ID:* _____________________

---

## Answered Open Questions

| Question | Answer |
| :--- | :--- |
| Play on Stage or embedded mini-viewer? | Play on the main Stage. Disable orchestration + effectuation if Stage is not open — show a warning in the sidebar. |
| AI generate uses which model? | The user's active chat LLM for the current character. |
| Save snapshot for regression testing? | Not in v1. The prompt itself is persisted to the card — that's the source of truth. |
| Raw TTS toggle (disable acting layer)? | Yes — include as a utility toggle for A/B comparison. |
