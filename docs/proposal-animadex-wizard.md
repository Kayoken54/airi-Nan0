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
*   Names, copyright/series, and core tags of all selected characters in the basket.
*   The user's answers to the setting, user nickname, and lore configuration questions.

### The Naming Rule
*   **Single Character**: If `selectedCharacters.length === 1`, the card's name is automatically assigned to that character's name (e.g., `name = selectedCharacters[0].name`).
*   **Multi-Character**: If `selectedCharacters.length > 1`, the card is named after the synthesized world/setting or group theme (e.g., `"Vocaloid Music Studio"` or `"Genshin Tavern Lounge"`), while individual actors are split into discrete visual/acting concepts.

### The Generated Output Schema
The LLM returns a structured JSON matching AIRI's schema:
1.  **System Prompt & Scenario**: Composed text placing the characters in the defined setting, reflecting the custom lore/behavior rules.
2.  **Greetings**: A list of alternate greetings, styled contextually to the environment and the user's nickname.
3.  **Actor Concept Registry**:
    *   Creates a concept block for each character (`actor_{name}`).
    *   Embeds their specific trigger words, core tags, and maps them to their visual assets (Live2D/VRM display models).

---

## 4. Open Questions & Metadata Mapping

### 1. Ingestion & Prompt Mapping
*   What template prompts should we feed to the LLM to guarantee high-fidelity, in-character system prompts and greetings during synthesis?
*   How do we map physical traits (hair/eye color) extracted from AnimaDex `core_tags` to default model parameters if the user doesn't specify a custom 3D/2D avatar?

### 2. SQLite vs IndexedDB Context
*   AIRI uses **IndexedDB** (via `unstorage` / `localforage`) for all its runtime and user state persistence.
*   **Access Pattern**: The search step queries the local read-only SQLite database `animadex.db` (Route A) via Electron IPC, but once a card is synthesized, the completed multi-character card definition is saved natively into AIRI's IndexedDB `local:airi-cards` namespace.
