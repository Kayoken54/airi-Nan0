# Memory Engine Integration Plan

The Memory Engine (ME) is the core orchestration layer responsible for maintaining a character's situational awareness, episodic records, and overarching relationship identity.

This document formalizes the architecture required to support the high-fidelity **Memory Hub**.

---

## 1. System Architecture

The ME is a service-oriented orchestrator that decouples temporal memory layers into specialized services.

### [ MemoryOrchestrator ]
The primary gateway that governs the memory lifecycle and coordinates cross-service triggers.

| Service | Temporal Role | Primary Artifact |
| :--- | :--- | :--- |
| **STMM** | Short-Term (0-7 Days) | `DailyBlock` (Active Pulse) |
| **Dream State** | Interpretive Highlights | `EchoChip` (The Echoes) |
| **LTMM** | Episodic Narrative | `SacredRecord` (Sentinel's Journal) |
| **Eternal Thread** | Relational Essence | `CanonicalThread` (Lifetime) |

---

## 2. Core Service Definitions

### A. STMM (The Active Pulse)
- **Role**: Maintains rich, situational awareness for the current conversation window.
- **Functional Interface**:
    - `generateDailyBlock(characterId, date, transcript)`: Summarizes a local day of dialogue into a high-density narrative.
    - `getActiveContext(characterId)`: Retrieves the N most recent blocks (default 3) for session injection.
- **Lifecycle**: Triggered automatically at midnight or on-demand via the "Rebuild" dashboard.

### B. Dream State (The Echoes)
- **Role**: Synthesizes interpretations and highlights during character idle time.
- **Functional Interface**:
    - `synthesizeDream(characterId, recentPulse)`: Analyzes recent blocks to produce interpretive metadata.
    - `getInFeedChips(characterId)`: Retrieves #mood tags and journal candidates for interleaved UI display.
- **Lifecycle**: Gated by **AFK-Detection** (User idle > 1hr). Limited to 4 synthesis runs per day to prevent semantic drift.

### C. LTMM (The Sentinel's Journal)
- **Role**: Stores durable, on-demand narrative records requested by the character.
- **Functional Interface**:
    - `commitSacredRecord(characterId, title, content)`: Append-only storage for the `text_journal` tool.
    - `hybridRecall(characterId, query)`: Performs keyword + semantic retrieval for grounding.
- **Lifecycle**: Purely on-demand. Managed via character toolkit invocation.

### D. Eternal Thread (The Lifetime Archive)
- **Role**: Preserves the versioned relational essence across long horizons.
- **Functional Interface**:
    - `initiateSoulBonding(characterId, rawHistory)`: Initial **7k -> 1k** canonical distillation for new characters.
    - `applyDailyDiff(characterId, blueprint, dayBlock)`: Merges new STMM highlights into the versioned thread.
    - `consolidateRebase(characterId)`: Collapses the diff-chain into a fresh 1k canonical base (**Canonical Thread**).
- **Lifecycle**: Operates on a stable versioning system with gated rebase approvals.

---

## 3. Data Structures & Schemas

### [ CanonicalThread ]
The "Relational Essence" artifact.
```typescript
interface CanonicalThread {
  id: string
  characterId: string
  version: number
  canonicalText: string // Hard cap ~1,000 tokens
  sourceArtifactId: string // Pointer to the raw 7,000 token source
  diffChain: string[] // Recent changes since last rebase
  metadata: {
    strength: 'compact' | 'standard' | 'rich'
    lastRebase: number
  }
}
```

### [ EchoChip ]
Interpretive metadata generated during the Dream phase.
```typescript
interface EchoChip {
  id: string
  type: 'mood' | 'flavor' | 'journal_candidate'
  content: string
  relevanceScore: number
  timestamp: number
}
```

---

## 4. The Relational Lifecycle

Provisioning a character's lifetime memory follows a strict 3-phase progression:

### Phase 1: Initial Bonding (7k -> 1k)
New characters or imported histories undergo a heavy consolidation pass. The engine identifies top-level relational facts and personality anchors.

### Phase 2: Daily Synthesis Handoff
As the character sleeps (AFK Transition), the **Dream State** identifies "Bonding-Worthy" moments from the **STMM**'s daily blocks and appends them as diffs to the **Eternal Thread**.

### Phase 3: Identity Rebase
When the diff-chain reaches a target density (e.g., 7 days of changes), the **Eternal Thread** performs a **Consolidation Rebase**, merging all diffs into a fresh, stable 1k canonical block to prevent drift.

---

## 5. Technical Milestones (Revised)

### Milestone 1: Provisioning & Initial Bonding
- [x] High-fidelity V3.1 Provisioning Terminal UI.
- [ ] Backend implementation of the 7k -> 1k distillation pipeline.
- [ ] Versioning support for the `CanonicalThread` storage.

### Milestone 2: Proactive Synthesis (The Echoes)
- [x] High-fidelity interleaved Chips UI.
- [ ] Integration of the Dream State synthesis hook into the AFK idle detector.
- [ ] Interpretive prompt layer for #mood and #flavor generation.

### Milestone 3: Sentinel's Journal (LTMM)
- [x] High-fidelity Emerald Vault UI.
- [ ] Refinement of the `text_journal` tool for characters.
- [ ] Hybrid search stabilization.

### Milestone 4: Operational Dashboard
- [x] Memory Hub (The 4-Quadrant Console).
- [ ] Unified "Update Logic" status monitoring.
- [ ] Cross-quadrant facelifts.
