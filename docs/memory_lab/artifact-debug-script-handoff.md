# Artifact Debug Script Handoff

## Purpose

This document is a direct handoff brief for the next research task.

The goal is to build an **artifact debug script** that ingests conversation data and emits the **user-readable work product** of the AIRI memory system rather than only internal engine traces.

We do not primarily want another low-level retrieval debug tool. We want a script that shows what the system is actually producing for product surfaces:

- STMM blocks
- LTMM entries
- semantic chips / pills / tags
- optional mood or expression traces
- optional wake-up payload previews

## Why This Matters

Right now we have spent a lot of time evaluating benchmark scores and internal routing behavior. That work was useful, but the product does not ship F1 or router logs. It ships memory artifacts.

The next useful debugging layer is:

- chat logs in
- readable memory artifacts out

This lets us compare versions of the system by what they actually generate for the product.

## Archive References

This handoff should not be read in isolation. It is supported by several existing docs in the archive.

### [artifact-harness-and-product-eval-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/artifact-harness-and-product-eval-spec.md)

This is the closest parent document for the current task.

Relevant parts:

- `Purpose`
- `Core Principle`
- `Product Outputs To Track`
- `Artifact Timeline View`
- `Chronological Memory Evolution View`
- `Wake-Up Payload Preview`
- `What Researchers Should Be Asked To Show`

Why it matters:

- it defines the shift from engine-debug-first to artifact-debug-first
- it explains why STMM, LTMM, chips, mood traces, and wake-up payloads are now the outputs that matter most

### [memory-schema-and-lifecycle-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/memory-schema-and-lifecycle-spec.md)

Relevant parts:

- `Core Principle`
- `Record Families`
- `Journal / Sacred Records`
- `Deep Dive: STMM / LTMM / DRMM`
- `Deep Dive: UI Surface Implications`
- `Proposed Minimum Next Step`

Why it matters:

- it defines what STMM and LTMM are supposed to be
- it establishes that manual journals are sacred
- it records the current product direction that STMM should eventually include semantic chips between recap blocks
- it records that the live chat rail should become a mixed artifact stream rather than only large recap cards

### [production-transition-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/production-transition-spec.md)

Relevant parts:

- `Production Memory Tiers`
- `UI-Facing Artifacts`
- `Deep Dive: Benchmark Logic vs Product Logic`
- `Deep Dive: Summaries In Production`

Why it matters:

- it explains which memory artifacts are likely to matter in the shipped product
- it supports the idea that benchmark work must eventually become visible product outputs

### [memory-lifecycle-and-features.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/memory-lifecycle-and-features.md)

Relevant parts:

- `The 3 Core Value Propositions`
- `The Adaptive Indexing Model (Triple-Format)`
- `Implementation Guardrails`

Why it matters:

- it states the three downstream goals that justify this script:
  - improved search of memories
  - improved context reloading
  - improved stream of consciousness
- it also reinforces the triple-format input idea behind raw chat, summaries, and journal layers

### [design-prospective-rich-journal.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/design-prospective-rich-journal.md)

Relevant parts:

- `The "Triple Store" Model`
- `The Rich Journal Feed`
- `UX: Peeking into the Mind`

Why it matters:

- it provides the product rationale for a mixed feed of different artifact types
- it supports the idea that users should be able to see episodes, facts, personal insights, and recaps as distinct artifact forms

### [rich-journal-mockups.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/rich-journal-mockups.md)

Relevant parts:

- `Mood Architecture: The Expression Bridge`
- `Hybrid Output: Stream of Consciousness (Visual Chips)`

Why it matters:

- it gives concrete examples of the kind of chips and mood-linked artifacts this script should eventually help review
- it reinforces that mood tags and visual chips are not side ideas; they are intended outputs

### [retrieval-and-ranking-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/retrieval-and-ranking-spec.md)

Relevant parts:

- `Success Criteria`
- `Debug And Observability Requirements`

Why it matters:

- it records that benchmark improvement is secondary to product usefulness
- it also records the heavier debug requirement, which this script narrows into artifact-first review

### [archive-index.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/archive-index.md)

Relevant parts:

- `Docs By Category`
- `Fast Paths By Need`

Why it matters:

- it gives a broader map of where this handoff sits in the archive and what companion docs the researcher should read first

## Mission

Create a script that:

1. Ingests one or more conversation/session inputs.
2. Runs the memory pipeline or a pipeline-compatible analysis pass.
3. Produces readable artifact files for review.
4. Organizes those files chronologically and by run.
5. Makes it easy to compare output quality across versions.

This mission is directly supported by:

- the artifact-first evaluation direction in [artifact-harness-and-product-eval-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/artifact-harness-and-product-eval-spec.md)
- the STMM / LTMM product semantics in [memory-schema-and-lifecycle-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/memory-schema-and-lifecycle-spec.md)
- the stream-of-consciousness and rich journal goals in [memory-lifecycle-and-features.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/memory-lifecycle-and-features.md), [design-prospective-rich-journal.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/design-prospective-rich-journal.md), and [rich-journal-mockups.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/rich-journal-mockups.md)

## Required Outputs

At minimum, the script should emit the following artifact classes when available.

### 1. STMM Output

Produce:

- daily or session-compacted STMM blocks
- clearly labeled by date / source session

Goal:

- show what recent recap memory would actually look like

Relevant archive support:

- [memory-schema-and-lifecycle-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/memory-schema-and-lifecycle-spec.md), section `Deep Dive: STMM / LTMM / DRMM`
- [memory-lifecycle-and-features.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/memory-lifecycle-and-features.md), section `The 3 Core Value Propositions`

### 2. LTMM Output

Produce:

- long-term journal-style entries
- clearly labeled by date / title / source

Goal:

- show what durable memory artifacts would actually look like in the archive

Relevant archive support:

- [memory-schema-and-lifecycle-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/memory-schema-and-lifecycle-spec.md), section `Journal / Sacred Records`
- [production-transition-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/production-transition-spec.md), section `UI-Facing Artifacts`

### 3. Chips / Pills / Tags

Produce:

- compact semantic artifacts extracted or synthesized during processing

Examples:

- mood tags
- topic tags
- relationship cues
- preference cues
- continuity cues
- any distilled semantic markers meant for the stream

Goal:

- show the "dense flavor" output this system could surface between larger memory blocks

Relevant archive support:

- [memory-schema-and-lifecycle-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/memory-schema-and-lifecycle-spec.md), section `Deep Dive: UI Surface Implications`
- [rich-journal-mockups.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/rich-journal-mockups.md), section `Hybrid Output: Stream of Consciousness (Visual Chips)`

### 4. Optional Mood / Expression Traces

If the current pipeline can produce them, include:

- mood labels
- affect or expression states
- session-level or event-level emotional cues

Goal:

- make it easier to evaluate whether the stream is becoming more expressive and grounded

Relevant archive support:

- [rich-journal-mockups.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/rich-journal-mockups.md), section `Mood Architecture: The Expression Bridge`
- [design-prospective-rich-journal.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/design-prospective-rich-journal.md), section `Mood: The Emotional Exhaust`

### 5. Optional Wake-Up Payload

If practical, produce a preview of:

- recent STMM blocks selected for injection
- selected long-horizon continuity cues
- the final assembled wake-up payload

Goal:

- evaluate whether reset / reload continuity is improving in a real product-facing way

Relevant archive support:

- [memory-schema-and-lifecycle-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/memory-schema-and-lifecycle-spec.md), section `Deep Dive: STMM / LTMM / DRMM`
- [artifact-harness-and-product-eval-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/artifact-harness-and-product-eval-spec.md), section `Wake-Up Payload Preview`

## Output Format

The outputs must be **human-readable** first.

Preferred formats:

- `.md`
- `.txt`
- `.json` only as a supplement, not the main review artifact

The script should optimize for files a human can skim and compare quickly.

## Folder Structure

The script should create a dated run folder, for example:

`artifact_debug_runs/YYYY-MM-DD_HH-mm-ss/`

Inside that folder, suggested subfolders are:

- `source/`
- `stmm/`
- `ltmm/`
- `chips/`
- `mood/`
- `wakeups/`
- `timeline/`
- `comparisons/`
- `engine_debug/` optional

The top-level emphasis should be the artifact outputs, not the engine internals.

## Timeline Output

One of the most important deliverables is a **chronological artifact timeline**.

For each session or ingest chunk, the script should ideally emit a readable file showing:

- source chat/session identifier
- generated STMM block
- generated chips
- any mood tags
- any LTMM-worthy entries
- any durable facts worth surfacing

Goal:

- let reviewers see how the system's memory artifacts evolve over time

## Comparison Support

The script should be designed so we can compare outputs across versions.

Examples:

- old STMM block vs new STMM block
- old chip stream vs new chip stream
- old LTMM entry vs new LTMM entry
- old wake-up payload vs new wake-up payload

This does not have to be fully automated on day one, but the output layout should make manual comparison easy.

## Input Support

The script should eventually support:

- benchmark datasets like LoCoMo
- exported real chat logs
- personal chat histories with consent
- single-session input
- multi-session chronological input

For the first version, it is acceptable to target one input format as long as the outputs are well structured.

## Product Questions This Script Should Help Answer

The point of the script is to help us judge output quality in product terms.

It should help us answer:

- Are the STMM blocks useful and readable?
- Are the LTMM entries believable and worth keeping?
- Are the chips meaningful or generic?
- Is the output stream getting denser and more flavorful?
- Does the wake-up payload actually feel like continuity?
- Are semantic improvements translating into tangible artifacts?

These questions are downstream of the three product goals already written in:

- [memory-lifecycle-and-features.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/memory-lifecycle-and-features.md), section `The 3 Core Value Propositions`

## Non-Goals

This script does **not** need to:

- be the final production pipeline
- perfectly score benchmark metrics
- expose every vector/ranking detail by default
- replace existing low-level debug tools

It should complement those tools by making the product artifacts visible.

## Research Priorities

When implementing this script, prioritize:

1. Readable outputs
2. Chronological organization
3. Artifact completeness
4. Easy comparison across runs
5. Optional deeper debug only when needed

## Nice-To-Haves

If time permits, useful additions would be:

- a single `index.md` per run folder
- HTML rendering for the artifact timeline
- side-by-side comparisons between two runs
- filtering by session, character, or artifact type
- a small wake-up payload simulator

## Suggested First Milestone

The first useful version should be able to do this:

1. ingest a conversation or benchmark session set
2. emit STMM blocks as markdown
3. emit LTMM entries as markdown
4. emit chips/tags as markdown or text
5. write a simple timeline file linking them all together

That alone would already give the team a much better product-facing debug loop.

## Deliverable Definition

The script should be considered successful when a reviewer can open the output folder and quickly understand:

- what went in
- what memory artifacts came out
- how those artifacts changed over time
- whether the outputs feel more useful than a previous run

That deliverable standard is aligned with:

- [artifact-harness-and-product-eval-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/artifact-harness-and-product-eval-spec.md), section `Suggested Harness Outputs`
- [archive-index.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/archive-index.md), especially the archive grouping around product and evaluation docs

## Status

Status: Research Handoff

This document is meant to be referenced directly when assigning the artifact debug script task to another researcher or agent.
