# AIRI Memory Lab Docs Archive Index

## Purpose

This index is the front door to the `docs/` archive. The folder now contains a mix of:

- architecture specs
- run journals
- benchmark history
- design explorations
- comparative analyses
- long-form chat research

Without an index, the archive is useful but hard to navigate. This document groups the material by purpose and recommends a reading order depending on what you need.

## Recommended Reading Order

If someone is new to the project and wants the fastest path to understanding, this is the recommended sequence:

1. [ultimate_hybrid_design_doc_detailed.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/ultimate_hybrid_design_doc_detailed.md)
2. [benchmark_history_and_outlook.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/benchmark_history_and_outlook.md)
3. [retrieval-and-ranking-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/retrieval-and-ranking-spec.md)
4. [memory-schema-and-lifecycle-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/memory-schema-and-lifecycle-spec.md)
5. [evaluation-and-benchmarking-methodology.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/evaluation-and-benchmarking-methodology.md)
6. [failure-cookbook.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/failure-cookbook.md)
7. [production-transition-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/production-transition-spec.md)

That sequence gives:

- the architecture
- the run history
- the retrieval logic
- the memory model
- the evaluation model
- the debugging model
- the production boundary

## Docs By Category

### 1. Core Architecture

These are the best entry points for understanding how the system is supposed to work.

- [ultimate_hybrid_design_doc_detailed.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/ultimate_hybrid_design_doc_detailed.md)
  Implementation-level system design for the current Ultimate Hybrid benchmark architecture.
- [ChatGPT Ultimate Hybrid Design Doc.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/ChatGPT%20Ultimate%20Hybrid%20Design%20Doc.md)
  Shorter architecture summary with emphasis on the tiered router and run genealogy.
- [retrieval-and-ranking-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/retrieval-and-ranking-spec.md)
  Central spec for search plans, rank fusion, evidence selection, and context assembly.
- [memory-schema-and-lifecycle-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/memory-schema-and-lifecycle-spec.md)
  Central spec for memory kinds, authority, lifecycle, contradictions, and consolidation.

### 2. Benchmarking And Run History

These explain what happened across runs and how to interpret performance movement.

- [benchmark_history_and_outlook.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/benchmark_history_and_outlook.md)
  Best single-file history of run evolution, score movement, and architectural genealogy.
- [evaluation-and-benchmarking-methodology.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/evaluation-and-benchmarking-methodology.md)
  Defines what a run is, how comparisons should be made, and how to interpret metrics.
- [in_progress.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/in_progress.md)
  Snapshot of one active run phase and the Run 6 merger framing.

### 3. Comparative And Strategy Docs

These are useful for understanding why particular architectural ideas were adopted.

- [cherry_pick_analysis.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/cherry_pick_analysis.md)
  Analysis of candidate improvements drawn from reference systems.
- [flavor_comparison.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/flavor_comparison.md)
  Comparison between Gemini-style and ChatGPT-style memory benchmark tracks.
- [great_merger_cheat_sheet.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/great_merger_cheat_sheet.md)
  Concise bridge document between the Orama-based track and the ChatGPT research track.

### 4. Failure And Debugging

These are the best docs when something breaks or regresses.

- [failure-cookbook.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/failure-cookbook.md)
  Practical troubleshooting guide organized by symptom and likely cause.
- [benchmark_history_and_outlook.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/benchmark_history_and_outlook.md)
  Useful as a historical failure record because it captures where earlier runs collapsed or regressed.

### 5. Product And UX Direction

These document how the benchmark work is expected to map into the eventual AIRI experience.

- [production-transition-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/production-transition-spec.md)
  Boundary between benchmark logic and production memory architecture.
- [memory-lifecycle-and-features.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/memory-lifecycle-and-features.md)
  High-level product value framing and adaptive indexing model.
- [design-prospective-rich-journal.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/design-prospective-rich-journal.md)
  Design direction for dreaming, triple-store memory, and rich journal UX.
- [rich-journal-mockups.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/rich-journal-mockups.md)
  Visual artifact and mood-expression examples for the stream-of-consciousness journal concept.

### 6. Raw Research Log

This is the least structured but highest-volume source of historical reasoning.

- [chatgpt-pro-chatlog.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/chatgpt-pro-chatlog.md)
  Long-form research and iteration log across many benchmark and architecture discussions.

Recommended use:

- use it as a deep reference
- do not use it as the first source of truth when a cleaner doc already exists

## Fast Paths By Need

### If You Need To Understand The Current Benchmark Architecture

Read:

1. [ultimate_hybrid_design_doc_detailed.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/ultimate_hybrid_design_doc_detailed.md)
2. [retrieval-and-ranking-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/retrieval-and-ranking-spec.md)
3. [evaluation-and-benchmarking-methodology.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/evaluation-and-benchmarking-methodology.md)

### If You Need To Understand Why The System Looks Like This

Read:

1. [benchmark_history_and_outlook.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/benchmark_history_and_outlook.md)
2. [cherry_pick_analysis.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/cherry_pick_analysis.md)
3. [flavor_comparison.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/flavor_comparison.md)
4. [great_merger_cheat_sheet.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/great_merger_cheat_sheet.md)

### If You Need To Work On Memory Schema Or Lifecycle

Read:

1. [memory-schema-and-lifecycle-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/memory-schema-and-lifecycle-spec.md)
2. [memory-lifecycle-and-features.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/memory-lifecycle-and-features.md)
3. [design-prospective-rich-journal.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/design-prospective-rich-journal.md)

### If You Need To Debug A Regression

Read:

1. [failure-cookbook.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/failure-cookbook.md)
2. [benchmark_history_and_outlook.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/benchmark_history_and_outlook.md)
3. [evaluation-and-benchmarking-methodology.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/evaluation-and-benchmarking-methodology.md)

### If You Need To Think About Production Integration

Read:

1. [production-transition-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/production-transition-spec.md)
2. [memory-schema-and-lifecycle-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/memory-schema-and-lifecycle-spec.md)
3. [design-prospective-rich-journal.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/design-prospective-rich-journal.md)

## Canonical vs Supporting Docs

To reduce archive drift, the following should be treated as the most canonical current references:

- [ultimate_hybrid_design_doc_detailed.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/ultimate_hybrid_design_doc_detailed.md)
- [retrieval-and-ranking-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/retrieval-and-ranking-spec.md)
- [memory-schema-and-lifecycle-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/memory-schema-and-lifecycle-spec.md)
- [evaluation-and-benchmarking-methodology.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/evaluation-and-benchmarking-methodology.md)
- [failure-cookbook.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/failure-cookbook.md)
- [production-transition-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/production-transition-spec.md)

Supporting docs should enrich or historicize those, not silently replace them.

## Pending Archive Improvements

- add a short glossary doc for recurring terms like C1/C2/C3/C4, STMM/LTMM/DRMM, RRF, Detective Mode, Bridge Mode, and dual-view memory
- add a run manifest template so future runs are documented consistently
- add backlinks between older run journals and the new canonical specs
- eventually split `chatgpt-pro-chatlog.md` into smaller reference docs once the archive stabilizes further

## Status

Status: Draft Index

This file should be updated whenever new canonical docs are added or when an older doc becomes superseded.
