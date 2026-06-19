# State Of System

## Current Position

The memory system is past the proof-of-concept stage.

The following are now working well enough to count as validated:

- search
- layered context reload
- STMM generation
- LTMM generation
- chip/pill generation
- heavy semantic archive building
- compressed lifetime context distillation

This is no longer just a collection of scripts.

It is an emerging memory stack with distinct layers and distinct jobs.

## What We Learned

### Search

Search is product-usable.

The strongest retrieval signal is not raw chat alone.

The main retrieval layers now appear to be:

- STMM for most meaningful recall
- raw turns for a few narrow exact moments
- LTMM for a smaller number of long-horizon details

### Context Reload

Recent STMM blocks are necessary but not sufficient.

They provide recency, but they do not fully preserve relationship identity.

That gap is now being filled by a lifetime context layer.

### Artifacts

The system can produce user-facing and system-facing artifacts that are meaningfully different from the raw conversation:

- STMM recap blocks
- semantic chips/pills
- LTMM journal entries
- semantic archive state
- distilled lifetime context pack

## What Is Working Now

### Retrieval Cache

Per-character Orama caches now exist.

They are fast to build and useful for retrieval.

For Bunny Mint, the cache build indexed:

- 301 raw turns
- 11 STMM blocks
- 3 LTMM entries

### Semantic Archive

The heavy archive build created a rich intermediate memory state.

It is intentionally verbose and redundant.

That is acceptable because it is not the final reload artifact.

### Distilled Context Pack

The second-pass distillation produced a compact reload-grade memory pack.

It is now in the right size range for actual context use.

## Important Current Numbers

For Bunny Mint:

- raw archive size: about 6k to 7k tokens
- distilled context pack: about 550 to 725 tokens
- target reload budget: roughly 1000 tokens or less

That is the key success of the current pipeline.

## Algorithm Summary

### Retrieval

Current retrieval uses:

- hybrid search
- per-character embeddings
- Orama persistence
- layered ranking/provenance

### Archive Build

Current archive build uses:

- chunked full-history ingestion
- semantic extraction per chunk
- final synthesis over chunk summaries

### Distillation

Current distillation uses:

- a compression pass
- a refinement pass
- explicit sectioning
- aggressive dedupe
- caveman-style token trimming

## What We Did Not Choose

We did not choose a single monolithic solution.

We did not choose:

- a raw archive dump as the final memory product
- a one-shot essay artifact as the final reload layer
- a pure benchmark-only architecture

Instead, we chose a layered pipeline:

1. raw history
2. retrieval cache
3. semantic archive
4. distilled lifetime context pack

## Current Bottleneck

The remaining work is budget and update strategy.

The open question is no longer whether the memory system can work.

The open question is:

- how much compute should be spent on each layer
- how often should the lifetime layer refresh
- how much should be user-opt-in versus default
- how should backlog and consolidation be handled

## Next Design Step

The next step is not another full rebuild.

The next step is an **incremental lifetime update mechanism**.

That mechanism should:

- start from the existing distilled lifetime pack
- ingest new STMM and LTMM updates
- preserve older durable facts
- add new stable facts when warranted
- avoid re-summarizing the full relationship every day

In other words:

**full build once, then incremental evolution.**

## Why This Matters

If the system rebuilds everything from scratch too often:

- it wastes compute
- it increases drift
- it makes reload quality less stable

If the system updates incrementally:

- the lifetime layer stays stable
- the user sees predictable behavior
- the memory budget becomes manageable

## Budget Model

The future product should likely expose separate controls for:

- recent STMM depth
- lifetime context budget
- dream / consolidation cadence
- backlog policy
- proactive mode and AFK gating

AFK should be treated as a supporting guardrail for proactive behavior, not as a standalone surveillance feature.

## Current Best Direction

The current best direction is:

- keep search and retrieval caches generic
- keep lifetime context generation separate
- keep lifetime context compressed and budgeted
- update lifetime context incrementally
- make the user explicitly opt into heavier behavior

## Bottom Line

Today’s result is a legitimate success:

- the archive layer works
- the distillation layer works
- the final context pack is in a useful range

The next task is to make that context pack evolve over time without rebuilding the whole world every day.

## Lifetime Update Model

The lifetime layer should not behave like a one-shot essay generator.

It should behave like a **base artifact plus accumulated diffs**.

That means:

1. build an initial lifetime pack from the full archive
2. treat that pack as the stable base
3. on each new refresh, merge the current base with the newest chunk or day
4. compute the delta between the old pack and the updated pack
5. store that delta as the next diff layer
6. replay the base plus diffs when a fresh lifetime context is needed

This matches the stability goal the user described:

- 8 chunks produce the first durable base
- chunk 9 updates the base and yields diff 1
- chunk 10 updates base + diff 1 and yields diff 2
- later chunks keep layering diffs on top of the same base

The expectation is that diffs should get smaller over time if the relationship is stable.
When the relationship changes meaningfully, the diff can grow again.

This is the right model because it:

- preserves long-horizon continuity
- avoids full rebuilds every day
- keeps the reload pack compact
- makes update history auditable
- lets the system stabilize around durable facts instead of recent noise

In practice, the lifetime artifact is now a **versioned memory object**, not a static paragraph.
