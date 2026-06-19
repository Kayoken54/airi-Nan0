# AIRI Memory: Lifecycle, Features, and Adaptive Indexing

This document defines the real-world use cases and data lifecycle requirements for the AIRI Memory system. It bridges the gap between raw benchmarking and actual UX implementation.

## 🚀 The 3 Core Value Propositions

The "Ultimate Hybrid" system is being built to deliver three specific downstream improvements:

1.  **Improved Search of Memories**: Moving beyond simple keyword matching to a "Thinking Search" (Hybrid Router) that understands multi-hop and deductive intent.
2.  **Improved Context Reloading**: Enhancing the "Model Reset" experience. Instead of just injecting raw narrative summaries (STMM), the system will inject a "Hybrid Briefing" composed of distilled context and logical facts.
3.  **Improved Stream of Consciousness**: Generating real-time "Visual Chips" in the chat feed to provide a visible, persistent trail of AIRI's internal reasoning and mood.

---

## 📂 The Adaptive Indexing Model (Triple-Format)

Since AIRI's raw chat logs are ephemeral (deleted on reset), the memory indexer must be an **Adaptive Reader** capable of processing data in three distinct formats:

### 1. The Raw Adapter (High-Fidelity)
*   **Source**: Active `{role, content}` chat logs.
*   **Role**: Real-time extraction of 5W fields and "Visual Chips."
*   **Impact**: Captures detail before it is lost or summarized.

### 2. The Summary Adapter (Narrative Layer - STMM)
*   **Source**: Daily Narrative Memory Blocks (Short-Term Memory).
*   **Role**: Backfilling "Vibes," "Pending Tasks," and unresolved "Social Tensions" that aren't captured in atomic facts.
*   **Impact**: Provides continuity during model resets.

### 3. The Journal Adapter (Sacred Layer - LTMM)
*   **Source**: User-triggered manual entries.
*   **Role**: Indexing immutable identity facts and direct user observations.
*   **Impact**: Serves as the high-authority ground truth for the "Identity" of the character.

---

## 🎭 Implementation Guardrails

- **Immutable Historical Integrity**: The system derives value from STMM/LTMM but never overwrites original narrative content.
- **Mood-Expression Mapping**: All reasoning passes emit one of the 6+1 standardized mood tags (Happy, Sad, Surprised, Angry, Neutral, Think, Cool) to drive VRM/Live2D models.
- **Gated Abstraction**: Inference is used only for "Detective" questions to preserve the literal accuracy of historical facts.
