# Production Transition Spec

## Purpose

This document defines the boundary between AIRI Memory Lab benchmark work and the eventual production memory system for AIRI. The archive repeatedly hints at this transition, but there is no single document that states what should graduate, what should stay experimental, and what operational constraints matter once the system leaves the benchmark lab.

This document is intentionally partial. The point is to start making those boundaries explicit now rather than waiting until implementation pressure forces ad hoc decisions.

## Scope

This spec covers:

- benchmark-to-production migration principles
- components likely to graduate
- components likely to remain lab-only
- operational constraints
- service boundaries
- background jobs
- UI and product implications

This spec does not fully define:

- exact production APIs
- deployment topology
- frontend implementation
- final persistence vendor decisions

## Core Principle

A strong benchmark run is not automatically a production-ready memory architecture.

Production readiness additionally requires:

- predictable latency
- storage hygiene
- update and invalidation behavior
- operational observability
- safe failure modes
- maintainable complexity

## What The Benchmark Is Good For

The benchmark lab is good for:

- testing retrieval ideas quickly
- measuring category-specific behavior
- comparing architecture patterns
- validating prompt and ranking hypotheses

The benchmark lab is not automatically good for:

- long-running memory hygiene
- concurrent user-facing workloads
- incremental storage growth over months
- robust background job management

## Components Likely To Graduate

Based on the archive, the following ideas appear likely to survive into production in some form:

- Orama or equivalent persistent retrieval store
- typed memory records
- temporal metadata
- category-aware retrieval shaping
- session summaries
- profile summaries
- evidence-first answer assembly
- soft room or taxonomy signals

## Components That May Stay Lab-Only

These are more likely to remain research tools unless they prove operationally cheap and robust:

- heavy multi-pass orchestration for every single query
- benchmark-specific answer compression logic
- category labels derived from benchmark datasets
- excessively hand-tuned fusion weights
- debug-heavy trace outputs in production request paths

## Production Memory Tiers

The archive suggests a production memory stack closer to:

- short-term recap memory
- sacred long-term journals
- dynamic derived memory

Suggested mapping:

- STMM for recent continuity
- LTMM for immutable manual or user-affirmed records
- DRMM for derived facts, episodes, and profile knowledge

## Operational Constraints

Production design should explicitly account for:

- latency budgets for retrieval and answer assembly
- background job cost for extraction and summarization
- storage growth
- contradiction handling
- degraded-mode behavior when summaries or profile synthesis fail
- versioning of prompts and schemas

## Suggested Latency Model

No final numbers are established yet, but the system likely needs two classes of work:

### Foreground Work

- retrieval
- candidate fusion
- answer context assembly
- minimal answer-time reasoning

This should be fast enough for conversational use.

### Background Work

- extraction
- summarization
- profile synthesis
- consolidation
- update and invalidation passes

This can be slower as long as it is observable and recoverable.

## Service Boundaries

The production system will likely need cleaner module boundaries than the benchmark harness.

Suggested boundaries:

- ingestion service
- retrieval service
- lifecycle or consolidation worker
- summary worker
- memory API
- UI-facing artifact formatter

## UI-Facing Artifacts

The archive references rich journal chips, episodes, facts, daily recaps, and personal insights. Production should decide explicitly which memory objects are user-visible and which remain internal.

Candidate visible artifacts:

- daily recaps
- session or episode summaries
- personal insights
- selected facts
- mood-linked artifacts

Candidate internal-only artifacts:

- debug traces
- rerank scores
- intermediate synthesis drafts
- raw extraction confidence scaffolding

## Safety And Failure Handling

Production should have clear degraded behavior.

Examples:

- if profile synthesis fails, retrieval should still work on facts and events
- if consolidation is delayed, new memories should still remain accessible
- if ranking confidence is weak, the system should prefer literal evidence over unsupported abstraction
- sacred journal content should never be silently rewritten by automated passes

## Deep Dives

### Deep Dive: Benchmark Logic vs Product Logic

Some benchmark behaviors are useful only because LoCoMo rewards them.

Examples:

- hyper-terse answer compression
- benchmark category hardcoding
- run-specific heuristics tuned to one dataset

These should be treated as lab logic unless a product justification exists.

### Deep Dive: Summaries In Production

Session and profile summaries are promising for product UX, but they create operational requirements:

- refresh timing
- invalidation when the underlying beliefs change
- authority relative to user-authored content
- visibility to the user

### Deep Dive: Consolidation

The strongest reference architectures in the archive hint that long-term quality comes from consolidation, not endless append-only storage. Production should likely introduce:

- reinforcement
- update
- invalidate
- supersede

even if the benchmark harness can get away without full lifecycle management.

## Considerations

- the production system should preserve benchmark learnings without inheriting benchmark-only complexity blindly
- any architecture that requires too many answer-time LLM calls may be too expensive or too slow
- dual-view memory may be highly valuable if clean facts and rich observations can coexist without confusion
- product trust depends heavily on handling changed facts and contradictions well

## Pending Decisions

- What exact latency budget is acceptable for user-facing retrieval?
- Which synthetic memory types should be visible in the UI?
- Should profile summaries be recomputed incrementally or periodically?
- How much answer-time synthesis is acceptable in production?
- Should the production system preserve benchmark-style category routing, or move to a more general query-intent system?
- What storage and migration plan should be used if the schema evolves rapidly?

## Open Problems

- no final production API contract exists yet
- benchmark and app schemas are not yet fully unified
- lifecycle workers and background scheduling are still mostly conceptual
- cost and latency envelopes have not been formally written down

## Proposed Next Step

The next production-facing design pass should produce:

- a module diagram
- one example request lifecycle
- one example background consolidation lifecycle
- latency targets
- a list of benchmark-only behaviors that will not ship

## Status

Status: Draft

This document should evolve alongside any effort to port benchmark learnings into the AIRI app or adjacent production memory services.
