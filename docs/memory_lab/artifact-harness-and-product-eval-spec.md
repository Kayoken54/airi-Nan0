# Artifact Harness And Product Eval Spec

## Purpose

This document defines a product-shaped evaluation harness for AIRI Memory Lab.

The benchmark work so far has been useful, especially for retrieval, temporal grounding, and open-domain reasoning. But the real product does not ship "F1." It ships:

- STMM recap blocks
- LTMM journal entries
- semantic chips and tags
- mood traces
- wake-up continuity payloads
- searchable memory artifacts

The purpose of this spec is to shift evaluation toward those tangible outputs.

## Why This Exists

The current research loop is heavily benchmark-oriented. That has value, but it also creates a risk:

- researchers keep improving raw numbers
- the product team still does not know whether the outputs feel better
- improvements may not translate into richer, denser, or more trustworthy memory artifacts

This harness exists to solve that problem.

## Core Principle

The system should be judged primarily by the quality of the memory artifacts it produces, not only by internal engine traces or benchmark score.

The new default question should be:

> What better product artifact does this architecture produce?

not:

> Did this change raise F1 by a few points?

## Evaluation Layers

This harness should evaluate the system at the artifact layer first, with lower-level debug only when needed.

### Primary Evaluation Layer

Inspect:

- STMM blocks
- LTMM entries
- chips and pills
- mood or expression tags
- wake-up payloads
- search result usefulness

### Secondary Evaluation Layer

Inspect:

- retrieval candidates
- routing outputs
- evidence selection
- synthesis drafts

### Tertiary Evaluation Layer

Inspect:

- full prompts
- raw model outputs
- scoring traces
- vector and ranking details

The goal is not to eliminate engine debugging. The goal is to stop leading with it when product artifacts are what really matter.

## Product Outputs To Track

The harness should explicitly track the following outputs.

### 1. STMM Blocks

Input:

- raw chat logs over a recent time window

Output:

- daily or periodic recap blocks

Questions:

- are they coherent?
- are they dense enough?
- are they too long?
- do they preserve the right emotional or social context?
- do they feel useful during context reload?

### 2. LTMM Entries

Input:

- summary context
- long-horizon history
- candidate durable facts

Output:

- append-only journal-style entries

Questions:

- do they read like real journal artifacts?
- are they emotionally and narratively coherent?
- do they preserve first-person voice when appropriate?
- do they feel worth keeping?

### 3. Semantic Chips And Pills

Input:

- ongoing analysis during STMM, LTMM, or context-refinement passes

Output:

- compact semantic artifacts
- tags
- chips
- small insight markers

Questions:

- are they meaningful?
- are they flavorful?
- are they too generic?
- are they chronologically useful?
- do they add nuance between larger memory blocks?

### 4. Mood And Expression Traces

Input:

- memory analysis and interpretation passes

Output:

- mood tags
- expression cues
- affect-linked artifacts

Questions:

- do they feel grounded in the interaction?
- are they too noisy?
- do they make the stream feel more alive?

### 5. Wake-Up Payloads

Input:

- last N STMM blocks
- selected long-horizon cues
- optional high-value durable facts or chips

Output:

- the hidden continuity payload injected at session restart

Questions:

- does it feel like the character actually woke up informed?
- is it too bloated?
- does it include the right long-horizon continuity?
- does it improve the "start again" moment in a tangible way?

### 6. Search Result Usefulness

Input:

- natural-language user or agent query

Output:

- surfaced memory artifacts
- answer context

Questions:

- are the results useful even if not perfectly benchmark-aligned?
- can an agent interpret the returned evidence effectively?
- does unified search across memory layers feel powerful?

## Artifact Timeline View

One of the most important harness outputs should be a chronological artifact timeline.

For each ingested session or chunk, the harness should show:

- source chat slice
- generated STMM block
- chips or pills emitted during analysis
- mood or expression tags
- extracted durable facts
- any LTMM-worthy outputs

This allows researchers and product reviewers to inspect how memory artifacts emerge over time, rather than only seeing final aggregate metrics.

## Chronological Memory Evolution View

The harness should also support a broader longitudinal view across many sessions.

This should show:

- how STMM blocks accumulate
- how chips appear between them
- how LTMM entries emerge
- how continuity cues evolve
- where the system starts to feel richer or flatter over time

This is especially important because product value depends heavily on long-horizon feel, not only one-off answers.

## Wake-Up Payload Preview

The harness should provide a dedicated "wake-up preview" mode.

Given a reset point, it should show:

- which STMM blocks are selected
- which long-horizon cues are selected
- which chips or facts are included
- the final injected continuity payload

This should become a first-class evaluation artifact, because context reload is one of the most important real product moments.

## Search And Recall Demo View

The harness should support query demonstrations that are product-shaped rather than benchmark-shaped.

For each query, it should show:

- query text
- returned artifacts
- which artifact types were surfaced
- assembled answer context
- optional answer

This helps answer the real product question:

> Is this search meaningfully better than keyword search?

## Dataset Direction

LoCoMo should remain useful as a regression and reasoning benchmark, but it should not be the only evaluation environment.

The product harness should eventually support:

- exported real chat logs
- personal conversation datasets
- character-specific histories
- session-by-session ingestion
- artifact generation across realistic chat flows

This would allow evaluation against the actual product surfaces instead of only a third-party benchmark.

## Ground Truth Philosophy

Not every product artifact needs strict gold labels.

This harness should support a mix of:

- hard expectations where possible
- comparative evaluation between old and new outputs
- qualitative product review
- usefulness judgments

Examples:

- "old wake-up payload vs new wake-up payload"
- "old chip stream vs new chip stream"
- "old STMM recap vs new STMM recap"

Some improvements are real even when they are hard to score with traditional exact-match metrics.

## What Researchers Should Be Asked To Show

Any major research change should ideally demonstrate improvements in at least one of:

- STMM block quality
- LTMM journal quality
- chip quality
- mood trace quality
- wake-up payload quality
- semantic search usefulness

If a change improves benchmark score but produces no better product artifacts, it should be treated as lower-value work.

## Suggested Harness Outputs

At minimum, each evaluation run should be able to emit:

- session artifact timeline
- chronological memory evolution view
- wake-up payload preview
- search demo outputs
- optional benchmark metrics

## Suggested Folder Structure

A run artifact folder could eventually contain:

- `timeline/`
- `wakeups/`
- `search_demos/`
- `stmm/`
- `ltmm/`
- `chips/`
- `mood/`
- `benchmarks/`
- `engine_debug/`

The key is that product-facing artifacts should be top-level, while lower-level engine traces can sit underneath them.

## Relationship To Heavy Debug

This spec does not replace heavy debug. It refocuses it.

Old mindset:

- capture everything because maybe it matters

Better mindset:

- capture the product artifacts first
- drill down into engine traces when artifact quality is wrong

## Real Product Goals

The harness should reinforce the three real goals already identified for this branch of work:

1. More meaningful consciousness streams in STMM logs
2. Better agent-driven semantic search
3. Better mixed stream output in the chat log using denser and more flavorful artifacts

## Considerations

- a benchmark gain without better artifacts may not be worth much product attention
- artifact quality needs both density and trustworthiness
- richer chips are only useful if they remain grounded enough to feel believable
- the harness should support chronological inspection because memory value emerges over time
- the best evaluation setup will likely mix quantitative and qualitative review

## Pending Decisions

- what exact format should chips and mood traces be exported in?
- which artifact views should be HTML/UI-based versus plain files?
- how much of the wake-up payload should be exposed directly in review tools?
- should there be a formal review rubric for "flavor quality"?
- how should personal datasets be anonymized or permission-scoped when used for product evaluation?

## Open Problems

- LoCoMo is not naturally aligned with the full product artifact story
- product artifact quality is harder to score automatically than benchmark QA
- the project does not yet have a dedicated artifact-eval harness implementation
- artifact review can become subjective without agreed examples and baselines

## Proposed Next Step

Build a first lightweight harness that can take:

- chat logs in
- STMM blocks out
- LTMM entries out
- chips out
- wake-up payloads out

and organize them chronologically per run so the team can start comparing real product outputs rather than only model scores.

## Status

Status: Draft

This document should guide the next phase of evaluation work, especially if the team wants research effort to track real product outcomes rather than purely academic benchmark movement.
