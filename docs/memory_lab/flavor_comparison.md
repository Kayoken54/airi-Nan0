# Comparison Report: Gemini vs. ChatGPT (Flavor Audit)

The ChatGPT "Pro" model's rewrite is a high-recall experimental retrieval engine. It significantly deviates from our Orama-based path to focus on **abstraction** and **weighted reasoning**.

## 📊 Key Architectural Differences

| Feature | Gemini (Run 5) | ChatGPT (Pro Rewrite) |
| :--- | :--- | :--- |
| **Persistence** | Orama (Scalable, On-disk) | In-memory (Ephemeral, Research-focused) |
| **Retrieval Pool** | k=10 (Narrow) | k=30 (Wide) |
| **Ranking** | Hybrid + Soft Room Boost | Weighted RRF (Dense + Lexical + Heuristics) |
| **Abstraction** | Atomic Facts only | Session & Profile Summaries (Synthetic) |
| **Context Assembly** | Static Prompt | Category-Specific (Single-hop vs. Temporal vs. Open) |

---

## 🔍 Critical Analysis: High-Impact Gains

### 1. Synthetic Summaries (The Open-Domain Bridge)
ChatGPT generates **Session Summaries** and **Profile Summaries** (e.g., "Sam's overall personality based on all sessions").
- **Impact**: Category 3 (Open-Domain) questions usually fail because individual facts are too granular. Summaries provide the "gist" the LLM needs to answer high-level questions ("What kind of person is Sam?").
- **Verdict**: **CHERRY-PICK.** This is likely the key to breaking the 2% F1 ceiling.

### 2. Weighted RRF (Weighted Reciprocal Rank Fusion)
Instead of a simple additive boost, it computes ranks across multiple signals (Dense, Focus-Query, Lexical) and fuses them.
- **Impact**: Much higher precision for messy queries. Focuses on "what matters" (Names/Quotes) while keeping the embedding search as a fallback.
- **Verdict**: **CHERRY-PICK.** We can implement this on top of Orama's raw scores.

### 3. Category-Specific Context Assembly
ChatGPT sorts evidence differently for each question type:
- **Temporal**: Sorts facts by timestamp (Timeline view).
- **Open-Domain**: Prioritizes summaries first, then supporting facts.
- **Verdict**: **CHERRY-PICK.** This aligns perfectly with `airi-mem` research.

---

## 🎯 Proposed Strategy: "Run 6 Merger"

We keep the folders separate as "Benchmark Lab" flavors, but I recommend we immediately update **Gemini** (Run 6) with these three optimizations while retaining the Orama persistence layer.

> [!TIP]
> **Why keep Orama?** The ChatGPT in-memory version will eventually choke on memory if we scale to thousands of facts. Orama is our bridge to the real AIRI app.

> [!IMPORTANT]
> **Action**: I have already set up the `.bat` files for you. You can run `run-benchmark-chatgpt.bat` right now to see if its abstraction strategy actually beats our baseline.
