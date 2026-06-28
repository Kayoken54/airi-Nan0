# Proposal: AnimaDex AI-Assisted Multi-Character World Creator

This proposal details the design of an AI-driven, multi-character onboarding and card creation wizard that leverages the **AnimaDex** dataset (36k+ curated characters) as a discovery catalog, using an LLM to synthesize rich, multi-actor roleplay cards dynamically.

---

## 1. The Core Concept: "World Basket Builder"

Instead of mapping a single character from the catalog to a flat, static card, this wizard enables users to assemble a custom "World" containing one or more characters, configuring a personalized scenario that is synthesized by the LLM.

```
[Browse 36k Catalogue] ──> [Add Characters to Basket] ──> [Configure Story Prompts] ──> [LLM Synthesis] ──> [Multi-Actor Card]
```

---

## 2. Step-by-Step Wizard Flow

### Step 1: Character Selection (The Basket)
*   The user is presented with the AnimaDex character grid/list.
*   The user can browse, search, and click "Add to World" on one or more characters.
*   **Activation Condition**: The moment at least one character is added to the basket, the "Next" button lights up. However, the user can continue adding multiple characters (e.g., Hatsune Miku, Kagamine Rin, and Luka) to create a group scene.

### Step 2: Context & Story Prompts
After selecting the cast, the user is presented with a streamlined form of three simple, open-ended questions to outline the scene:

1.  **Setting & Location**: *"Where do you want this story to take place?"*
    *   *Placeholder*: "Leave blank to let the AI suggest a fitting location."
2.  **User Nickname / Identity**: *"What do you want the characters to call you?"*
    *   *Placeholder*: "Leave blank for the AI to make up a name."
3.  **Lore & Behavior Rules**: *"Do you want the characters to follow canon lore/personality?"*
    *   *Placeholder*: "Explain what you want instead (e.g., 'Make them tsundere', 'Set in a fantasy medieval AU')."

---

## 3. The LLM Synthesis Pipeline

When the user clicks "Generate", AIRI compiles the inputs and makes a structured call to the active LLM (using JSON schema output mapping).

### The Ingestion Payload
The system sends the following to the LLM:
*   Names, **copyright/series**, trigger words, and core tags of all selected characters in the basket (crucial for helping the LLM guide the roleplay/thematic direction, especially for less-known characters).
*   The user's answers to the setting, user nickname, and lore configuration questions.

### The Naming Rule
*   **Single Character**: If `selectedCharacters.length === 1`, the card's name is automatically assigned to that character's name (e.g., `name = selectedCharacters[0].name`).
*   **Multi-Character**: If `selectedCharacters.length > 1`, the card is named after the synthesized world/setting or group theme (e.g., `"Vocaloid Music Studio"` or `"Genshin Tavern Lounge"`).

### The Generated Output Schema
The LLM returns a structured JSON containing modular card metadata. Visual assets keys and prompts are generated deterministically by the frontend to prevent hallucinations, while the LLM populates descriptions and personalities:

1.  **id**: Sluggified, URL-safe formal name for the card identity (e.g., `multiverse-talent-agency`).
2.  **name**: The readable nickname / display name of the world (e.g., `Multiverse Talent Agency`).
3.  **scenario**: The active circumstance, starting conflict, and narrative premise of the roleplay (excluding static physical location details).
4.  **places**: A dictionary of 2 or 3 distinct sets representing the main story settings (e.g. `place_main`, `place_alt_1`):
    *   `name`: Readable name of the location (used for description headings).
    *   `description`: High-fidelity visual description of the setting (concatenated into the card's root `description` field).
    *   `prompt`: Generative prompt tags for Stable Diffusion / ComfyUI background generation (copied into `visual_assets[place_key].prompt`).
5.  **actors**: A dictionary mapped to the deterministic keys provided in the ingestion instructions (e.g. `actor_{name}` or `actress_{name}`):
    *   `short_description`: A super brief, low-resolution visual prose description of the character's baseline appearance and current attire (used directly in `visual_assets[actor_key].description`).
    *   `long_prose`: A high-fidelity visual description of the character's detailed physical appearance and default outfit (concatenated into the card's root `description` field).
    *   `personality_prompt`: The character's specific personality traits, behavior blueprints, speech style, and rules (concatenated into the card's root `system_prompt`).
    *   `greeting`: A single-actor in-character starting greeting prefixing dialogue with their respective `<|ACTOR:key|>` token. (During card assembly, the first character's greeting becomes the card's default `first_mes`, while other characters' greetings populate `alternate_greetings`).

---

## 4. Open Questions & Metadata Mapping

### 1. Ingestion & Prompt Mapping
*   What template prompts should we feed to the LLM to guarantee high-fidelity, in-character system prompts and greetings during synthesis?
*   How do we map physical traits (hair/eye color) extracted from AnimaDex `core_tags` to default model parameters if the user doesn't specify a custom 3D/2D avatar?

### 2. SQLite vs IndexedDB Context
*   AIRI uses **IndexedDB** (via `unstorage` / `localforage`) for all its runtime and user state persistence.
*   **Access Pattern**: The search step queries the local read-only SQLite database `animadex.db` (Route A) via Electron IPC, but once a card is synthesized, the completed multi-character card definition is saved natively into AIRI's IndexedDB `local:airi-cards` namespace.

