# In-Progress Journal: Run 6 - The Great Merger

## Active Goal
Executing **Run 6: The Great Merger**. Integrating high-fidelity abstraction layers (Session/Profile summaries) and weighted Reciprocal Rank Fusion (RRF) into the Orama-based Gemini pipeline to break the Open-Domain and Temporal F1 ceilings.

## Current Status
- [x] Run 5 Baseline (F1: 33.56%, LLM: 68.33%) established.
- [x] "The Great Merger" architecture implementation complete.
- [x] Applied Claude's 7 "Formatting Fixes" to bridge the LLM/F1 gap for C2 (Temporal) and C3 (Open-Domain).
- [/] Run 6 Ingestion in progress (Currently at Session 10+).
- [ ] Evaluation Phase 2.

## Technical Diff (Run 6: The Great Merger)

The current implementation (Run 6) incorporates the best patterns from the ChatGPT "Pro" research sandbox into our persistent Orama track:

### 🧩 Abstraction Layer
- **Session Summaries**: Synthesizes 1-3 "gists" after every session to provide narrative continuity.
- **Profile Synthesis**: Generates persistent personality/identity summaries for all detected speaker names (Speaker A/B, etc.).
- **Kind Field**: Orama schema now separates `fact`, `session_summary`, and `profile_summary`.

### ⚖️ Weighted RRF Fusion
- **Rank Consolidation**: Replaced additive multipliers with a **Reciprocal Rank Fusion (RRF)** formula.
- **Multi-Signal Input**: Combines Dense (Vector), Lexical (BM25), and Signal (Names/Quotes/Rooms) ranks.
- **Category Priors**: Automatically adjusts weights based on the question category (e.g., boosting summaries for C3 questions).

### 📐 Category-Aware Context Assembly
- **Timeline Sorting (C2)**: Temporal evidence is now sorted chronologically in the prompt with `[session; event time]` anchors.
- **Abstract Grouping (C3)**: Open-domain context puts high-level summaries at the top of the prompt to prime the model.

### 🛡️ Format Hardening (Claude feedback)
- **Terse Rules**: Added explicit "bare-value" constraints for Temporal/Open-domain questions to align LLM output with Gold answers.
- **Max-Tokens Locking**: Tightened `maxTokens` (40-60) per category to prevent "sentence padding" that ruins F1 scores.

## Next Steps
1. Complete Run 6 Ingestion and Evaluation.
2. Compare Run 6 F1/LLM deltas against Run 5 baseline.
3. If successful, port these patterns to the production `electron-tamagotchi` memory server.
4. (Optional) Run ChatGPT Flavor as **Run 7** for a direct "Orchestration vs Fusion" benchmark.

---

## 📈 Run 6 Ingestion Stats (Active)
- **Status**: Ingestion phase currently processing session ~10.
- **Yield**: Significant increase in Record count (~1.25x per session) due to synthetic summaries.
- **Stability**: Fast extraction (~40s per session) with high temporal yield.
