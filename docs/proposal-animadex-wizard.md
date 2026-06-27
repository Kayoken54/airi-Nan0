# Proposal: AnimaDex Character Creator Wizard & Multi-Character Integration

This proposal outlines the integration of the **AnimaDex** dataset (36k+ curated anime characters) into the **AIRI** character creation, vision, and visual state pipeline. It expands upon a simple single-character import flow, scaling it into a **multi-character concept builder** and a **smart vision cross-referencing system**.

---

## 1. Core Architectural Routes

We present two alternative integration paths for searching and querying the AnimaDex dataset within AIRI.

### Route A: Native Offline Integration (No Images)
*   **Database**: The 46MB SQLite metadata database (`animadex.db`) is bundled directly with the AIRI desktop distribution.
*   **Search**: A native Vue search modal is built inside the settings or card manager. Queries are run offline via Electron IPC to the local SQLite database (latency < 15ms).
*   **Visuals**: No images are displayed (except generic placeholders) to keep the base installer size compact.
*   **Action**: Selecting a character immediately packages their metadata to bootstrap the card wizard.

### Route B: Purpose-Built Hosted Directory (With Images)
*   **Database**: A hosted index on a free web tier (e.g., GitHub Pages, Cloudflare Pages/Workers).
*   **Search**: AIRI opens an embedded webview/iframe linking to the hosted companion page, displaying character tiles with CDN-hosted thumbnails.
*   **Action**: Clicking "Import to AIRI" triggers a custom JSON download or sends a cross-document `postMessage` event. AIRI intercepts this event to bootstrap the card wizard.

---

## 2. Multi-Character & Concept Integration (The "Basket" Model)

Rather than treating the wizard as a tool to create a single static character card, we pivot the import pipeline to be **multi-character first**.

```
[Search AnimaDex] ──> [Add to Basket (Queue)] ──> [Generate Multi-Actor Profile / Concepts]
```

### Multi-Character Basket Setup
*   **Queueing**: When browsing the AnimaDex catalog, the user can "add to basket" multiple characters (e.g., Hatsune Miku, Kagamine Rin, and Megurine Luka) before proceeding.
*   **Dynamic Actor Mapping**: Instead of duplicating prompt systems, each selected character from the basket is mapped to a distinct **Visual Asset Concept** (`actor_{name}`) inside the card's profile.
*   **Multi-Model Spawning**: At runtime, each character in the profile is bound to their respective Live2D/VRM model ID and prompt modifiers. The Director LLM can dynamically swap the active actor on the stage.

### Post-Creation: "Add Character" in Production Studio
*   **Context**: Based on the `proposal-visual-state-outfit-hook.md` specifications, the Production Studio tracks a character's "Registry of Concepts" (Identity, Artistry, Manifestation).
*   **The Feature**: We add an "Add Character" button in the Production Studio interface.
*   **Behavior**: Clicking the button opens the AnimaDex search popup. Selecting a character automatically creates a new additive **Actor Concept** (`actor_{slug}`) on the existing card.
*   **Result**: Users can easily transform any existing single-character card into a multi-character group stage post-creation.

---

## 3. Vision Integration: WD14 Tag Cross-Referencing

AIRI's local vision pipeline (specified in `design-vision-system-support.md`) supports the **SmilingWolf WD14 SwinV2 Tagger** for converting uploaded user images into comma-separated Danbooru tags.

```
[User Uploads Image] ──> [WD14 Tagger Extracts Tags] ──> [Cross-Reference Local AnimaDex DB] ──> [Suggest Trigger Words]
```

### How it Works
1. When the user attaches an image in chat, the local WD14 vision model processes the file and generates a list of active Danbooru tags (e.g., `1girl, aqua hair, twintails, detached sleeves, boots`).
2. AIRI queries the local 46MB AnimaDex database, matching the generated tag list against character `core_tags` and `trigger` vocabularies.
3. If a high-confidence character match is detected (e.g. `hatsune_miku`), a floating prompt tip appears:
   > *"We detected Hatsune Miku in this image. Would you like to automatically apply her trigger words (`hatsune miku, vocaloid`) and visual DNA to the current prompt?"*
4. Accepting the suggestion injects the character's exact prompt signature into the active generation cycle.

---

## Open Questions

### 1. Metadata Mapping & Translation
*   **Logic Mapping**: How do we best translate the raw AnimaDex fields into AIRI card attributes?
    *   What logic should be used to map AnimaDex `core_tags` into behavioral system prompt modifiers?
    *   How should the Stable Diffusion `trigger` prompt translate into the LLM system prompt definition?
    *   Should we auto-populate recommended voice/personality archetypes based on physical attributes (e.g., gender, hair/eye color, series theme)?

### 2. Image Retention & Local Storage
*   If we use Route B (hosted), when a character is imported, should AIRI attempt to download and save their thumbnail locally so they have an avatar inside the app? If so, where should this live in the local filesystem?
