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
1. Open Chatbox → Settings → Rehearsal Room sidebar tab
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

- **Sidebar Registration:** Follows the existing settings/devtools sidebar pattern. Route with `<route lang="yaml"> meta: layout: settings </route>`.
- **Component Path:** `apps/stage-tamagotchi/src/renderer/pages/devtools/rehearsal-room.vue` (or shared via `packages/stage-pages`).
- **Model Metadata Source:** Read available emotions/motions from the active card's model definition (`activeCard.extensions.airi.modules`) and the model loader's metadata.
- **Expression Effectuation:** Clicking an emotion/motion sends an immediate expression update to the Stage — likely through the existing store pathway that sets expression parameters (e.g., `live2dStore.setExpression` or equivalent).
- **Orchestration:** Reuses the same pipeline as chat ingestion — sends sample text through the LLM with the acting prompt injected, parses the response for `<|ACT:...|>` tags, plays TTS with expression keyframes on the Stage. Sandboxed — does not persist to chat history.
- **Prompt Storage:** `modelExpressionPrompt` is read/written via the card's extensions (`cardStore.updateCard()`), same path as `CardCreationTabActing.vue`.
- **Sparkle Helper Reuse:** Import the same helper modal/props pattern from `CardCreationTabActing.vue` — `actingModelExpressionOptions`, `actingGroupedExpressionTags`, `insertModelExpression`, `sparkle-click` emit.
- **Per-Model Widget Reuse:** Investigate the existing model-specific expression/motion list widgets under Settings → Models for each type (Live2D, VRM, MMD, Spine). These may be liftable wholesale into the Rehearsal Room, or a unified abstraction may be warranted.
