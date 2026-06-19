# Evaluation And Benchmarking Methodology

## Purpose

This document defines how AIRI Memory Lab benchmark runs should be framed, compared, and interpreted. The archive already contains run histories and performance tables, but it lacks a stable methodology document that explains what a run is, how metrics should be read, and what kinds of comparisons are fair.

This document is meant to prevent future confusion when multiple flavors, branches, prompts, and retrieval architectures are being tested in parallel.

## Scope

This spec covers:

- run definition
- benchmark setup
- output metrics
- category interpretation
- comparison hygiene
- regression analysis
- run documentation expectations

This spec does not define:

- the full benchmark codebase
- retrieval internals
- production monitoring

## What Counts As A Run

A benchmark run should be treated as a coherent experiment, not just a code snapshot.

A run should have:

- a name or numeric identifier
- a code state
- a model configuration
- a benchmark target
- fixed prompts and settings for that run
- an output report

If any of those change materially, the result should be treated as a distinct run.

## Required Run Metadata

Every run record should ideally preserve:

- run ID
- flavor or architecture label
- model name
- benchmark target
- retrieval strategy summary
- ingestion strategy summary
- notable prompt changes
- major schema changes
- report timestamp

## Benchmark Target

The current archive is centered on LoCoMo, especially `conv-47`.

That means current methodology should explicitly state:

- primary sample is `conv-47`
- total evaluated questions are expected to be 150 unless the benchmark configuration changes
- categories are interpreted in the LoCoMo sense

If additional samples or full-dataset variants are added later, this document should be extended rather than assuming `conv-47` remains the only comparison basis forever.

## Core Metrics

The archive currently references three main metrics.

### F1

Interpretation:

- strict lexical-overlap-oriented benchmark metric
- sensitive to formatting, verbosity, and answer span exactness

Meaning:

- strong signal for benchmark alignment
- not a complete measure of semantic correctness

### NemoriF1

Interpretation:

- alternate overlap-oriented metric used in the archive
- likely intended as a second exactness-sensitive measure

Meaning:

- useful for validating whether improvements are consistent across similar token-level scoring schemes

### LLM Judge

Interpretation:

- semantic correctness proxy
- more tolerant of paraphrase than F1

Meaning:

- useful for checking whether the model "understood" the question and evidence
- dangerous if used alone because verbose or abstract answers may look semantically good while scoring poorly on benchmark exactness

## Category Structure

The archive consistently refers to:

- `c1` multi-hop
- `c2` temporal
- `c3` open-domain
- `c4` single-hop

Interpretation guidelines:

- `c4` is the best precision sanity check
- `c2` tests time grounding and ordering discipline
- `c1` tests candidate breadth and evidence chaining
- `c3` tests abstraction and synthesis

## Reading The Metrics Correctly

Recommended interpretation rules:

- high F1 and high LLM is the strongest result
- high LLM and low F1 often means good reasoning but poor formatting or overlong answers
- low LLM and low F1 usually means retrieval or reasoning failure
- stable single-hop with improved hard categories is usually better than broad gains caused by answer drift

## Fair Comparison Rules

Two runs should only be compared directly when the following are approximately stable:

- same benchmark target
- same category definitions
- same evaluation harness
- same scoring code
- same or clearly documented model family

If a comparison mixes different models, prompts, or judging setups, the archive should label that comparison as directional rather than apples-to-apples.

## Regression Analysis Rules

When a run regresses, analysis should not stop at overall F1.

Required regression questions:

- which categories moved?
- did ingestion yield change?
- did retrieval breadth change?
- did answer length drift?
- did LLM and F1 diverge more or less than before?
- was the regression broad or localized?

## Deep Dives

### Deep Dive: F1 vs LLM Gap

A recurring theme in the archive is that systems often know more than their F1 suggests.

This gap usually indicates one or more of:

- answer too verbose
- answer slightly paraphrased
- answer semantically right but benchmark-misaligned
- summaries improving understanding without improving exact extraction

This is why category-specific answer shaping matters.

### Deep Dive: Ingestion Metrics As Leading Indicators

The archive often treats ingestion stats as early predictors.

Examples of useful ingestion indicators:

- total facts
- total events
- temporal marker count
- summary count
- extraction time per session
- failure rate

These do not replace final evaluation, but they often explain results later.

## Run Documentation Expectations

Each run should ideally produce:

- one short summary doc or journal note
- one result table
- one technical diff summary
- one interpretation of gains and regressions

This keeps the archive useful when many runs accumulate.

## Considerations

- benchmark gains can come from answer formatting rather than deeper memory quality
- a run can improve one category while harming the overall system design
- production value and benchmark score are related but not identical goals
- faster ingestion is useful, but should not be celebrated if evidence quality drops
- a more complex architecture should beat simpler baselines by enough margin to justify operational cost

## Pending Decisions

- Should there be a required run manifest file for every future benchmark?
- Should benchmark prompts be versioned explicitly in the archive?
- Should partial-run or preliminary results be stored as first-class artifacts?
- Should new metrics be added for latency, ingestion cost, or retrieval stability?
- Should we separate "research score" and "production score" criteria?

## Open Problems

- methodology is still partly reconstructed from chat logs and journals
- some historical runs may not be fully reproducible from archived notes alone
- LLM judge methodology should be frozen more explicitly
- cross-model comparisons remain somewhat noisy

## Proposed Standard Run Template

Each future run entry should include:

- objective
- code delta
- ingestion stats
- overall metrics
- category metrics
- latency notes
- interpretation
- next decision

## Status

Status: Draft

This document should become the archive's reference point whenever a new run is introduced or compared to older runs.
