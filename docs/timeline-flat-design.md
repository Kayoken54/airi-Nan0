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

| Memory Pillar | Storage Key / Location | Flat Universe Strategy |
| :--- | :--- | :--- |
| **1. Chat Sessions** | `local:chat/sessions/{sessionId}` | Tagged with `universeId`. Multiple sessions can share the same `universeId`. |
| **2. Text Journal (LTMM)** | `local:memory/text-journal/{userId}` | Each memory block is tagged with `universeId`. Queries perform a flat filter: `where entry.universeId === activeSession.universeId` (fallback to `'global'`). |
| **3. Short-Term Memory** | `local:memory/short-term/{userId}` | Daily summary blocks are tagged and queried by `universeId`. |
| **4. Echo Chips** | `local:memory/echo-chips/{userId}` | Emotional anchor chips are tagged and queried by `universeId`. |
| **5. Lifetime Artifact** | `local:memory/lifetime/{universeId}` | The synthesized character personality blueprint is isolated per `universeId`. |
| **6. Image Journal** | `localforage` index entries | Photo gallery metadata and custom backdrops are tagged by `universeId`. |

---

## 3. Core Database & Query Helpers

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
