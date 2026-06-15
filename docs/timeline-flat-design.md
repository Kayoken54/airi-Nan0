# Proposal: Flat Universe-Based Memory Isolation (Simplified Timeline Model)

This document outlines the simplified, flat **Universe-Based Memory Isolation** model for AIRI, which decouples conversation threads from the character memory banks. This design replaces the complex, Git-like nested tree inheritance model detailed in [timeline-nested-design.md](file:///docs/timeline-nested-design.md).

---

## 1. Architectural Pivot: Nested vs. Flat

In the previous nested architecture ([timeline-nested-design.md](file:///docs/timeline-nested-design.md)), conversation timelines were treated like branching Git commits, inheriting memory from ancestors using a recursive tree-climbing search engine.

While technically elegant, the nested model introduced significant practical issues:
1. **The New Session Dilemma**: Starting a fresh, empty conversation thread has no parent message turn. Linking it to a parent timeline to inherit memory was overly complex and unintuitive.
2. **Recursive Query Overhead**: Querying long-term memory (LTMM) required walking the parent timeline ancestry chain on every database scan, impacting performance.
3. **Compaction & Fork Fighting**: Branching conversations and daily memory summarization loops had to manage complex temporal barriers and inheritance gates.

### The Flat Solution: Decoupling Sessions from the Memory Bank
Instead of bound timelines, we introduce the concept of a **Universe** (or Group Slug):
* A **Universe** (`universeId` / `universeSlug`) is a flat boundary of shared memories, text journals, short-term blocks, echo chips, and lifetime artifacts.
* A **Chat Session** is a sequence of messages (dialogue history) associated with a single Universe.
* **Multiple Chat Sessions** can run concurrently inside the same Universe, sharing the same background memory and relationship status while maintaining independent chat bubbles.

```
                   [ UNIVERSE: "seaside-cottage-main" ]
                     /                              \
                    /                                \
       [ Chat Session A ]                     [ Chat Session B ]
    (Cozy Beach Hotpot Thread)             (Chloe Morning Escape Thread)
              |                                      |
              \--- Shared Memory Bank (LTMM, STMM) --/
```

---

## 2. Mapping the 6 Pillars of Memory to the Universe

By shifting to the Universe model, we simplify the database queries and data tagging across all 6 memory pillars:

| Memory Pillar | Storage Key / Location | Flat Universe Strategy | Schema Updates |
| :--- | :--- | :--- | :--- |
| **1. Chat Sessions** | `local:chat/sessions/{sessionId}` | Tagged with `universeId`. Multiple sessions can share the same `universeId`. | Add `universeId: string` to metadata. |
| **2. Text Journal (LTMM)** | `local:memory/text-journal/{userId}` | Each memory block is tagged with `universeId` and `sessionId`. Queries filter by `universeId`. | Add `universeId?: string` and `sessionId?: string` to `TextJournalEntry`. |
| **3. Short-Term Memory** | `local:memory/short-term/{userId}` | Daily summary blocks are tagged and queried by `universeId` and track original `sessionId`. | Add `universeId?: string` and `sessionId?: string` to `ShortTermMemoryBlock`. |
| **4. Echo Chips** | `local:memory/echo-chips/{userId}` | Emotional anchor chips are tagged and queried by `universeId`. | Add `universeId?: string` and `sessionId?: string` to `EchoChip`. |
| **5. Lifetime Artifact** | `local:memory/lifetime/{universeId}` | The synthesized character personality blueprint is isolated per `universeId`. | Keyed directly by `{universeId}`. |
| **6. Image Journal** | `localforage` index entries | Photo gallery metadata and custom backdrops are tagged by `universeId` and `sessionId`. | Add `universeId?: string` and `sessionId?: string` to `BackgroundEntry`. |

---

## 3. The Session Migration & Relinking Flow

Decoupling sessions and tagging individual memory elements with `sessionId` and `universeId` resolves a major implementation gap: **How do we migrate a storyline after the facts have already been created?**

In your Chloe GF Universe example:
1. You run a session under the default `"global"` universe. The AI writes text memories, generates selfies, and saves echo chips. All of them are saved with `sessionId = "{activeSessionId}"` and `universeId = "global"`.
2. You decide to isolate this timeline and switch the chat session to `"chloe-gf-uni"`.
3. **The Migration Resolver**:
   When the session's `universeId` is updated in the UI, the system runs a background migration transaction:
   * Query the Text Journal, STMM, Echo Chips, and Background stores for all entries matching `entry.sessionId === activeSessionId`.
   * Update their `universeId` property to `"chloe-gf-uni"`.
   * Persist the updated records.
4. **Outcome**: All text memories, daily summaries, emotional anchors, and generated gallery photos created during that session are cleanly pulled into the new universe. They disappear from the `"global"` timeline instantly, leaving the original universe completely untainted.

---

## 4. Core Database & Query Helpers

The query pipeline drops recursive ancestry checks entirely. The database filters become standard flat checks:

```typescript
// Proposed: packages/stage-ui/src/types/universe.ts
export interface Universe {
  id: string // Unique ID, e.g., "global", "seaside-alt"
  name: string // User-facing name, e.g., "Main Storyline", "Alternate Beach Path"
  characterId: string // The character card associated with this universe
  createdAt: number
}

// Proposed: Query Filter Helper
export function filterEntriesByUniverse<T extends { universeId?: string }>(
  entries: T[],
  activeUniverseId: string
): T[] {
  return entries.filter((entry) => {
    const entryUniverseId = entry.universeId || 'global'
    return entryUniverseId === activeUniverseId
  })
}
```

---

## 4. User-Facing UI Touchpoints & Workflows

### 4.1 Creating a New Chat Session
In the **Create Session** dialog:
* The user is presented with a dropdown: **Universe Context**.
* **Options**:
  * `Global (Default)`
  * `[Existing Universe Names for this character, e.g., Seaside Cottage]`
  * `Create New Universe...`
* If they select an existing universe, the new thread immediately utilizes all existing memories and relationship context of that world.
* If they select "Create New Universe," the system spawns a fresh `universeId` with a blank slate of memories.

### 4.2 Forking a Conversation
When a user forks a chat from a specific message:
1. The app creates a new chat session copying all messages up to that point.
2. It prompts the user:
   * **Keep in same Universe (Parallel Thread)**: The new thread shares the existing memory pool of the parent. Actions in either thread write to the same memory bank.
   * **Clone to New Universe (Alternate Timeline)**: Spawns a new `universeId`, copies the existing memory database records over to the new ID, and isolates all future memories of this fork.

### 4.3 UI Component Queries
* **Echo Chips Ticker**: Filters chips by `activeSession.universeId`.
* **Latest Text Entries / DNA Snaps**: Renders memories matching the active session's `universeId`.
* **Stage Background Picker / Image Journal**: Presets and journal photos are filtered by `universeId`.

---

## 5. Background Processes & Prompt Construction

### 5.1 The Dreaming Daemon
The background proactivity loop (`evaluateDreamState`) collects conversation logs to synthesize daily memories. Under the Universe model, the collector queries only chat sessions matching the target `universeId`. The resulting summaries and text journal blocks are saved and tagged with that `universeId`.

### 5.2 System Prompt Construction
The prompt builder reads memories, short-term blocks, and synthesized lifetime artifacts that match the active session's `universeId`:
```typescript
const universeId = activeSession.value?.universeId || 'global'
const stmContext = shortTermMemory.getBlocksForUniverse(universeId)
const lifetimeArtifact = await lifetimeMemory.getArtifactForUniverse(universeId)
```

---

## 6. Design Agreement Summary

By adopting the flat **Universe** model:
1. We preserve complete narrative continuity across multiple parallel chat threads of the same "world."
2. We eliminate the recursive tree-traversal lookup bugs and timestamp math.
3. We naturally resolve how brand-new threads hook into existing memory states.
4. We keep the database layer flat, maintainable, and highly performant.

---

## 7. Backward Compatibility & Legacy Migration Heuristics

To ensure smooth operation when users upgrade from earlier versions of AIRI, the database layer implements fallback defaults and a one-time "Smart-Heal" routine on startup:

### 7.1 Fallback Defaulting
* All existing entries (Text Journal, STMM, Echo Chips, Backgrounds) that do not possess a `universeId` field are treated as part of the `"global"` universe.
* Query filters use the safe fallback expression: `entry.universeId || 'global'`.

### 7.2 Smart-Heal Migration Heuristic
To allow legacy chat histories to be migrated to new universes in the future, the system must bind existing `null`-sessionId memory entries to their corresponding sessions. On boot, the migration manager inspects the sessions list per character:
1. **Single-Session Character**: If a character has **exactly one** chat session in their history, the system updates all legacy memories, daily blocks, and background images for that character, setting their `sessionId` to that single session's ID.
2. **Multi-Session Character**: If a character has **two or more** chat sessions in their history, their legacy memory `sessionId` fields are left as `null`. This prevents misattribution of memories, leaving them safely shared in the `"global"` memory pool.

