# The Great Merger Cheat Sheet (Run 6)

This document serves as the alignment bridge between the **Gemini Track** (Persistence & Precision) and the **ChatGPT Track** (Abstraction & Fusion).

## 🏢 Core Requirement: Orama Persistence
Unlike the benchmark-only in-memory bank, the Final Implementation **must use Orama**.
- **Reason**: AIRI needs to handle thousands of memories across months of interaction without choking memory.
- **Constraint**: All retrieval logic (RRF, Fusion) must be compatible with Orama's `search` results.

---

## 💎 Gemini's Contributions (The Foundation)
1.  **Room Taxonomy**: Implementing the "Memory Palace" logic with soft-boost signals (+30% affinity bonus) instead of hard gates.
2.  **Temporal Metadata**: Using a dedicated `temporal_marker` field in Orama to store relative/absolute dates without polluting the vector embedding text.
3.  **Scalable Vector Store**: Native integration with Transformers.js and Orama hybrid search.

---

## 🚀 ChatGPT's Contributions (The Force Multipliers)
1.  **Synthetic Abstractions**:
    - **Session Summaries**: "The GIst" of a single 20-30 turn session.
    - **Profile Summaries**: High-level speaker characterization (Essential for Open-Domain F1).
2.  **Weighted RRF (Reciprocal Rank Fusion)**:
    - Fusing Dense (Embedding), Lexical (BM25), and Heuristic (Names/Quotes/Rooms) ranks.
3.  **Focus Querying**:
    - Generating an "optimized query" from the raw question to highlight entities and quoted spans.
4.  **Category-Aware Prompting**:
    - **Context Assembly**: Timeline view for temporal questions; Summary-first for open-domain.
    - **Guidance**: Plugging in the `airi-mem` style advice for the LLM judge.

---

## 🤝 The Hybrid "V6" Architecture

| Component | Strategy |
| :--- | :--- |
| **Ingestion** | Gemini ExtractFacts + ChatGPT In-session Summaries. |
| **Storage** | Orama DB with `kind` (fact/summary) and `temporal_marker`. |
| **Retrieval** | Orama Hybrid Search (k=30) -> Weighted RRF Reranking. |
| **Prompting** | Category-specific context sorting (Timeline/Abstract). |
| **Output** | Category-aware answer generation with strict JSON constraints. |
