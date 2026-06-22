# Proposal: "Forward to LLM" VLM Captioning & Tagging Pipeline

This proposal outlines the design, UI integration, and backend implementation for the **Forward to LLM** strategy under `Settings > Modules > Vision`. It details how images are intercepted, processed client-side via local VLMs (BLIP, FastVLM, WD14 Tagger), and translated into rich textual contexts before being forwarded to text-only character models.

---

## 1. Architectural Concept: sight Decoupled from Voice

Currently, image processing in AIRI defaults to **Direct Response (Stand-in)** mode. If a user uploads an image, the conversation brain swaps to a commercial Vision LLM (e.g. Gemini 1.5 Flash). This often compromises the character's fine-tuned personality or native formatting styles.

By implementing the **Forward to LLM** strategy, we decouple the visual sensory system from the conversational voice:
1.  **Ingress Interception:** When a message with an image attachment is queued, the system intercepts it.
2.  **Local Visual Parsing:** The image is fed into a fast, local, on-device VLM (WebGPU/ONNX).
3.  **Context Injection:** The image is converted to a text block (e.g., prose scene description or Danbooru tags) and injected directly into the prompt stream as a system/user metadata overlay.
4.  **Text Routing:** The final message (now text-only) is sent to the character's primary, fine-tuned text-only model, preserving their authentic voice.

```
[User Image + Message]
          │
          ▼
┌──────────────────┐
│ IPC Interception │
└─────────┬────────┘
          │
          ├─► Route Image to Local VLM ──► (FastVLM, BLIP-1/2, or WD14)
          │                                          │
          ▼                                          ▼
┌──────────────────┐                       ┌───────────────────┐
│ Inject Text tags ◄───────────────────────┤ Prose / Tag Lists │
└─────────┬────────┘                       └───────────────────┘
          │
          ▼
┌──────────────────┐
│   Primary LLM    │ ──► Generates authentic in-character response
└──────────────────┘
```

---

## 2. Store & Configuration Expansion

We will update the vision store (`packages/stage-ui/src/stores/modules/vision.ts`) to persist the strategy selection and the specific local VLM pipeline type.

### Config State Fields
```typescript
export type VisionStrategy = 'direct' | 'forward'
export type LocalVlmPipeline = 'fastvlm' | 'blip-base' | 'blip-large' | 'wd14-tagger'

export const useVisionStore = defineStore('vision', () => {
  const strategy = useLocalStorageManualReset<VisionStrategy>('settings/vision/strategy', 'direct')
  const localVlmPipeline = useLocalStorageManualReset<LocalVlmPipeline>('settings/vision/local-pipeline-type', 'blip-base')

  return {
    strategy,
    localVlmPipeline,
    // ... rest of the existing stubs
  }
})
```

---

## 3. Settings UI Integration (`vision.vue`)

We will modify [vision.vue](file:///Users/richardpinedo/Projects.nosync/airi/airi_dasilva333/packages/stage-pages/src/pages/settings/modules/vision.vue#L321-L352) to bind the strategy selection directly to the store and expose pipeline configurations.

### UI Modifications
1.  **Enable Radio Options:** Remove the `:disabled="true"` and `[PLANNED]` badges from the "Forward to LLM" card.
2.  **Add Pipeline Selector:** When `strategy === 'forward'` is active, conditionally display a sub-panel to configure the local model routing type:

```
┌────────────────────────────────────────────────────────┐
│  Image Description Strategy                            │
│                                                        │
│  ( ) Direct Response                                   │
│      Allow the vision model to reply to the image.     │
│                                                        │
│  (o) Forward to LLM                                    │
│      Forward the description of the image to your      │
│      consciousness model.                              │
│                                                        │
│  ─── Local VLM Descriptor Pipeline ─────────────────── │
│  Local VLM Model Type:                                 │
│  ( ) FastVLM (0.5B) - Rapid, lightweight descriptions   │
│  (o) WD14 Tagger    - Danbooru concept tags (Anime art)│
│  ( ) BLIP-1 (Base)  - Moderate English prose           │
└────────────────────────────────────────────────────────┘
```

---

## 4. Pipeline Execution & Prompt Ingress

When the user clicks "Send" with an image attached:

### Step 1: Pre-processing Interception
Inside the chat/message orchestration layer:
```typescript
import { useVisionStore } from './stores/modules/vision'

async function processUserMessage(payload: ChatMessagePayload) {
  const visionStore = useVisionStore()

  if (payload.imageAttachment && visionStore.strategy === 'forward') {
    // 1. Resolve local descriptor
    const descriptionText = await runLocalVlmDescriptor(
      payload.imageAttachment,
      visionStore.localVlmPipeline
    )

    // 2. Format injection context based on the pipeline type
    let formattedText = ''
    if (visionStore.localVlmPipeline === 'wd14-tagger') {
      formattedText = `[IMAGE TAGS: ${descriptionText}]`
    }
    else {
      formattedText = `[IMAGE DESCRIPTION: ${descriptionText}]`
    }

    // 3. Merge into text body and drop image attachment before API dispatch
    payload.content = `${formattedText}\n\n${payload.content}`
    payload.attachments = payload.attachments.filter(a => a.type !== 'image')
  }
}
```

### Step 2: Injecting the Visual Context
The compiled message arrives at the primary LLM containing the textual representation of the image:
> **User Prompt:**
> `[IMAGE TAGS: 1girl, solo, holding cat, smiling, winter coat, snow background]`
> Look who I ran into today!

The text-only LLM immediately understands the visual layout of the scene (a girl wearing a winter coat in the snow holding a cat) and can react naturally, remaining completely in-character.

---

## 5. References & Model Hand-offs

For details on local WebGPU scheduling, GPU-executor priorities, and SwinV2/WD14 normalization steps, refer to:
*   [design-vision-system-support.md](file:///Users/richardpinedo/Projects.nosync/airi/airi_dasilva333/docs/design-vision-system-support.md#L35-L62): Model comparisons (BLIP vs. WD14) and preprocessing rules.
*   [proposal-destiny2-plugin.md](file:///Users/richardpinedo/Projects.nosync/airi/airi_dasilva333/docs/proposal-destiny2-plugin.md#L84-L92): Details on FastVLM client-side screenshot cropping execution.
