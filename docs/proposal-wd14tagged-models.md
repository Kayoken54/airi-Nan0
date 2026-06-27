# Proposal: Auto-Tagging Local Models via WD14 Image Tagger

This proposal details the integration of the **SmilingWolf WD14 Danbooru Tagger** (specified in `design-vision-system-support.md`) to automatically extract, store, and query visual tags for all models (VRM, Live2D, Spine, MMD) in the user's local collection. This turns the Model Selector into a semantically searchable library (e.g., searching "blonde", "swimsuit", "glasses" to find a matching model for a synthesized companion).

---

## 1. The Core Concept

By utilizing the vision system's image tagger on each model's preview/thumbnail image, we can automatically index their visual attributes without requiring manual tag entry from the user.

```
[Model Preview Image] ──> [WD14 Tagger (Local WebGPU)] ──> [Extract Danbooru Tags] ──> [Save to Model Metadata] ──> [Semantic Library Search]
```

---

## 2. Storage & Cloud Sync Integration

To track these tags, we will extend the model metadata schema:

### A. Schema Extension
Inside the `display-models` store (defined in `packages/stage-ui/src/stores/display-models.ts`), we will add a new field:
```typescript
interface DisplayModelMetadata {
  id: string
  name: string
  format: DisplayModelFormat
  // ... existing fields
  tags?: string[] // Auto-generated visual tags (e.g., ['blonde hair', 'glasses', 'blue eyes'])
}
```

### B. Cloud Sync Coordination
Since model metadata is tracked and synchronized (referenced in `docs/project-byos-cloud-sync.md`), this `tags` property will be serialized within the model's metadata block and synced to the user's BYOS (Bring Your Own Storage) drive, ensuring that tags are computed once and available across all the user's devices.

---

## 3. UI/UX Changes in the Model Selector

We will enhance the **Model Selector** dialog/screen (shown in the settings interface):

### A. The [Auto Tag] Toolbar Button
*   **Location**: Placed in the top toolbar of the Model Selector alongside the search and filter controls.
*   **Action**: Clicking this button initiates a batch job:
    1. Loads the local WD14 Tagger model via WebGPU (if not already loaded).
    2. Runs each model's `previewImage` (extracted from the model's binary/blob) through the tagger pipeline.
    3. Saves the resulting tags (filtered by threshold `> 0.35`) back to the model store.
*   **Progress**: Shows a non-blocking toast indicating the process (e.g., *"Tagging models: 4/12 completed"*).

### B. Badge and Reka Popover Display
*   To keep the card grid clean, tags are hidden by default.
*   **The Popover**: We will add a small visual badge (e.g. tag icon) to each model card. Hovering or clicking this badge triggers a **Reka-UI Popover** that displays a clean grid of the model's auto-generated tags (read-only, not user-editable).

### C. Visual Tag Filter Dropdown (NEW)
*   Similar to the existing **"Groups"** dropdown (which filters models by franchises/categories with counts like `Azur Lane (5)`, `Hololive (54)`), we will introduce a **"Tags"** filter dropdown in the toolbar.
*   **Dynamic Aggregation**: The UI dynamically aggregates all auto-generated model tags, counts their occurrences, and determines the **top 20 most popular tags** across the local collection.
*   **Interactive Filters**: Selecting tags in this dropdown (e.g., `blonde hair (12)`, `glasses (4)`, `swimsuit (8)`) dynamically filters the library, allowing users to find models visually without typing.

### D. Search Field Extension
*   The text search box in the Model Selector is updated to look through the `tags` array:
    ```typescript
    const filtered = models.filter(m =>
      m.name.toLowerCase().includes(query)
      || m.tags?.some(tag => tag.toLowerCase().includes(query))
    )
    ```
*   **Result**: Typing "blonde" immediately isolates all models displaying yellow/blonde hair. Typing "sailor uniform" isolates those models wearing school uniforms.

---

## Open Questions & System Decisions

### 1. Tag Pruning & Noise Filtering
*   **Decision**: We will build a blocklist of generic tags to keep the index clean.
*   **Initial Blocklist**: `1girl`, `1boy`, `solo`, `looking at viewer`, `simple background`, `white background`, `black background`, `grey background`.
*   **Next Steps**: Perform a curation pass after the first batch runs to identify other common layout/background descriptors to discard.

### 2. Auto-Run on Import vs. User Consent
*   **Decision**: Auto-tagging will **not** run automatically upon model import. Since loading and running the WD14 ONNX/WebGPU tagger model introduces non-trivial resource overhead and asset downloading, it requires explicit user consent.
*   **Flow**: Tagging remains a manual, user-triggered action via the **[Auto Tag]** or **[Image Tag]** button in the Model Selector.

