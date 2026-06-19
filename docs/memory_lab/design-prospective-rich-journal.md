# Design: Prospective Rich Journal & Dreaming Architecture

This document outlines the architectural shift from static, daily memory blocks to a dynamic, high-fidelity **Cognitive Memory** system. It reconciles the "Amusement" goals of proactivity with the "Consolidation" goals of memory.

## 🧱 1. Conceptual Decoupling

We must strictly separate **Proactive Amusement** from **Memory Consolidation (Dreaming)**. While they share a heartbeat loop for efficiency, they serve distinct UX purposes.

| Path | Concept | Goal | User Impact |
| :--- | :--- | :--- | :--- |
| **Amusement (Proactivity)** | "Turn Me On" | Entertainment & Social Commentary. | AIRI speaks to the user proactively based on current sensors. |
| **Consolidation (Dreaming)** | "Long-Term Retention" | Organizing messy history into durable facts. | AIRI connects dots, updates her "Knowing", and shifts her baseline Mood. |

---

## 💤 2. The "Triple Store" Model (User Choice)

We are evolving from a flat memory system to a **Triple-Store** architecture that respects both historical integrity and cognitive derivation.

| Tier | Source | Purpose | Mutability |
| :--- | :--- | :--- | :--- |
| **Short-Term (STMM)** | 24h Summaries | Recent session continuity (last 1-3 days). | **Ephemeral**: Recycled/Replaced daily. |
| **Long-Term (LTMM)** | Manual/Personal | Irreplaceable journals written by AIRI or User. | **Immutable**: Never resynthesized, only cited. |
| **Dream (DRMM)** | Consolidation | Derived facts, episodes, and semantic tags. | **Dynamic**: Updated via PCL (Predict-Calibrate-Learn). |

### Memory Strategies (User Toggle):
1.  **Simplistic (Yesterday-Only)**: Focuses on Tier 1 & 2. Uses minimal API calls.
2.  **Cognitive (Dream-Enhanced)**: Activates Tier 3. Uses background LLM passes to derive deep insights from raw Tier 2/Session data.

### 📜 The "Irreplaceable Journal" Rule
Existing Long-Term records (Tier 2) are sacred. Our background Dreaming worker **derives** value from them (adding tags, facts, or connections to the Dream store) but **never overwrites or deletes** the original journal content.

---

## 🎭 3. Mood: The Emotional Exhaust

Mood is the side-effect of memory.
- During **Dreaming (Consolidation)**, the LLM emits a **Sentiment Delta** (Valence/Arousal).
- This delta updates the character's **Global Mood Flag**.
- **Amusement Bridge**: Proactive proactivity (Amusement) is triggered by "Mood Spikes" or "Dream Insights."

---

## 📓 4. The Rich Journal Feed

The Chatbox "Journal Feed" will render these 3 tiers with distinct visual identities:

1.  **`Episode`** (i-solar:ghost-bold-duotone): *Dream* - A topic-based summary.
2.  **`Fact`** (i-solar:key-bold-duotone): *Dream* - An atomic semantic truth.
3.  **`Personal Insight`** (i-solar:notebook-bold-duotone): *Long-Term* - A preserved manual entry.
4.  **`Daily Recap`** (i-solar:calendar-bold-duotone): *Short-Term* - A 24h summary block.

### UX: Peeking into the Mind
Users can preview these as they are generated. Seeing an **Episode** from "that conversation we had about coffee" provides a peek into her personal insights that doesn't feel like a mechanical log.

---

## 🌊 5. Deep Dive: Challenges & Future Reasoning

This section tracks the "Go/No-Go" gates for monorepo integration and the long-term vision for the reasoning layer.

### 🔴 The C3 (Open-Domain) Bottleneck
**Status**: Critical Resistance (F1 ~5%).
**The Goal**: Move from "Fact Finding" to "Character Synthesis."
- [ ] **Implementation**: Add a `synthesizeInterpretation()` pass for Open-Domain questions.
- [ ] **Logic**: Instead of answering directly, the system must first "Draft" a unified theme from the 15 retrieved facts before generating the final 3-15 word phrase.
- [ ] **Dependency**: Integration is paused until C3 F1 hits a stable benchmark (Target: >15%).

### 🚀 Run 11 Wishlist: The Reasoning Layer
Once retrieval is solved, we move to the "Final Boss":
1.  **Contradiction Resolver (PCL v2)**: Handling evolving truths (e.g., "I like coffee" → "I hate coffee") via an invalidation gate.
2.  **Chain-of-Thought Retrieval**: Multiple targeted search passes to fill information gaps before answering.
3.  **Emotional Bias Engine**: Using `MoodState` as a soft-boost signal for state-dependent memory retrieval.
4.  **Semantic Graph Chaining**: Moving from flat text to a "Nexus" of connected nodes.
5.  **Recursive Tree Summarization**: Compressing facts into "Personality Pillars" to prevent context window pollution.

### ❓ Open Questions & Design Decisions
These items require final resolution before UI development begins:
1.  **Mood Dashboard**: Should the "Vibe" indicator be a persistent label or an interactive "Mood Ring" icon?
2.  **The Amusement Bridge**: Should "Dream Insights" serve as the primary fuel for proactive amusement prompts?
3.  **Feed Depth**: Evolving the Journal Feed from 2 cards to a scrollable "History Strip."
4.  **Persistence Strategy**: Finalizing the switch-over from "24h Blocks" to "Dynamic Episodes."

