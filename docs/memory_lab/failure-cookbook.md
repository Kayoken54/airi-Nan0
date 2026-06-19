# Failure Cookbook

## Purpose

This document is a practical troubleshooting guide for AIRI Memory Lab. The archive already contains architecture narratives and some failure taxonomies, but it does not yet have an operator-facing cookbook that maps visible failures to likely causes and next actions.

This document is intentionally pragmatic. It is meant to help future run iteration, debugging, and post-mortem analysis.

## How To Use This Document

Start from the observed symptom, then scan:

- likely causes
- where to inspect
- what to test next
- what not to overcorrect

Not every diagnosis here is definitive. In several areas, the goal is to open a debugging thread even if the final answer is not yet known.

## Failure Pattern 1: Single-Hop Regresses

### Symptom

- `c4` drops sharply
- overall F1 drops broadly
- exact factual questions become less reliable

### Likely Causes

- retrieval candidate pollution
- summary flooding
- too-broad search surfaces
- answer generation becoming too abstract or verbose
- hard routing excluding the exact fact

### Where To Inspect

- top retrieved candidates
- evidence mix by `kind`
- answer prompt for single-hop
- whether room or taxonomy logic became a gate instead of a boost

### Good Next Tests

- reduce summary allowance for `c4`
- narrow primary search plans back to facts
- inspect whether exact evidence is present but buried
- compare raw answer length against prior stable runs

### Common Trap

- trying to "fix" single-hop by making retrieval even wider

## Failure Pattern 2: Temporal Questions Collapse

### Symptom

- `c2` crashes or drops sharply
- questions involving dates, ordering, or recency fail

### Likely Causes

- temporal markers missing or low quality
- time cues embedded into fact text in a noisy way
- no timeline ordering in context
- summaries crowding out dated evidence
- relative time not normalized

### Where To Inspect

- temporal marker yield during ingestion
- event vs fact balance
- context ordering for temporal questions
- whether the answer model is being asked for bare dates or narratives

### Good Next Tests

- increase visibility of event records and time-bearing facts
- sort context chronologically
- reduce summary priors for temporal categories
- inspect whether correct time evidence existed but was not selected

### Common Trap

- assuming the problem is purely answer prompting when evidence itself is weak

## Failure Pattern 3: Open-Domain Barely Moves

### Symptom

- `c3` remains near zero or low single digits
- LLM may show partial semantic understanding, but F1 remains poor

### Likely Causes

- summaries exist but there is no interpretation layer
- retrieved evidence is too literal
- profile summaries are weak or underused
- answer formatting is too terse or too vague
- contradictory evidence is confusing characterization

### Where To Inspect

- open-domain evidence packs
- whether summaries were retrieved but not used effectively
- whether synthesis or normalization exists
- LLM-vs-F1 gap

### Good Next Tests

- add or tighten a grounded synthesis pass
- separate evidence facts from abstract summaries in prompt layout
- improve profile summary quality
- inspect whether answers are semantically right but benchmark-misaligned

### Common Trap

- assuming more summaries alone will solve open-domain

## Failure Pattern 4: Multi-Hop Stalls

### Symptom

- `c1` remains low even when single-hop is strong
- answers capture one relevant fact but miss the needed combination

### Likely Causes

- candidate pool too narrow
- no cross-session diversity in evidence selection
- complementary facts being deduplicated away
- no bridge or sub-question retrieval strategy

### Where To Inspect

- candidate union size before rerank
- selected evidence session spread
- plan traces for multi-hop questions
- whether the top context contains only one side of the chain

### Good Next Tests

- widen candidate pool selectively for `c1`
- enforce multi-session coverage in evidence selection
- add bridge or sub-question plans
- inspect whether summaries are helping or hiding the missing link

### Common Trap

- replacing chaining with generic abstraction

## Failure Pattern 5: LLM Improves But F1 Does Not

### Symptom

- LLM judge rises while F1 remains flat
- answers feel more intelligent but benchmark score barely changes

### Likely Causes

- answers too long
- answers paraphrased instead of span-like
- explanation mixed into the answer field
- summaries improved understanding without improving extraction exactness

### Where To Inspect

- raw answer strings
- category-specific max token settings
- post-processing and compression rules
- judge prompt versus answer prompt mismatch

### Good Next Tests

- enforce shorter category-specific output
- strip framing phrases
- tune answer post-processing for dates and names
- compare same evidence under a stricter output instruction

### Common Trap

- interpreting higher LLM score as automatic benchmark success

## Failure Pattern 6: Memory Growth Causes Regression

### Symptom

- later runs with more indexed memories perform worse
- retrieval becomes noisy as the archive expands

### Likely Causes

- append-only storage with no lifecycle hygiene
- duplicated facts
- stale or contradictory facts
- weak ranking under larger search spaces
- no authority model

### Where To Inspect

- record count by kind
- duplicate and near-duplicate rates
- outdated beliefs still treated as equally current
- evidence budgets under larger memory pools

### Good Next Tests

- add dedupe and diversity constraints
- introduce supersede or invalidate semantics
- separate episodic and semantic retrieval paths
- inspect candidate purity as memory count grows

### Common Trap

- blaming the embedding model alone

## Failure Pattern 7: Hard Routing Causes Silent Misses

### Symptom

- reranker looks reasonable, but the correct fact never appears
- failures cluster around room, topic, or entity boundaries

### Likely Causes

- hard room gating
- brittle subject routing
- plan generation too narrow
- category inference locking the question into the wrong path

### Where To Inspect

- raw search plans
- candidate lists before rerank
- room and subject assignments
- fallback behavior when a route is low confidence

### Good Next Tests

- convert hard filters into soft boosts
- add a broad fallback fact plan
- compare route-limited retrieval versus global retrieval on the same question

### Common Trap

- trying to fix ranking when the problem is candidate generation

## Failure Pattern 8: JSON / Structured Output Fragility

### Symptom

- run crashes
- malformed intermediate outputs
- empty answers in bursts

### Likely Causes

- prompt too complicated for the model
- schema too brittle
- too many structured phases chained together
- token limits too tight

### Where To Inspect

- raw model outputs
- schema definitions
- retry logic
- cache collisions or stale cache reuse

### Good Next Tests

- simplify schema
- reduce required fields
- separate extraction from synthesis if both are failing
- validate cache keys and cache versioning

### Common Trap

- treating malformed JSON as random model behavior instead of prompt or schema design debt

## Deep Dives

### Deep Dive: Retrieval Failure vs Reasoning Failure

This is the central debugging distinction.

Retrieval failure means:

- the right evidence never made it into context

Reasoning failure means:

- the right evidence was present, but the answer still failed

This distinction should be checked before changing prompts, ranking, or ingestion.

### Deep Dive: Summary Flooding

Summaries are useful because they compress meaning. They are dangerous because they can outrank literal facts and make the model answer at the wrong level of abstraction. This is especially risky in temporal and single-hop categories.

## Considerations

- many regressions come from "good ideas used as gates"
- broader retrieval and stronger reasoning can each hurt exactness if not controlled
- early ingestion stats are suggestive, not conclusive
- latency and fragility matter if the architecture is meant to graduate beyond the lab

## Pending Decisions

- Should future debug traces be standardized enough to attach directly to each failure pattern?
- Should the archive include canonical "failure examples" for each category?
- Should there be a run-level checklist before approving a new architecture branch?
- Which failures are acceptable in benchmark-only research tracks but not in production-oriented tracks?

## Suggested Future Additions

- known-bad run case studies
- example debug screenshots or trace snippets
- a short "triage checklist" page linked from this document

## Status

Status: Draft

This document should be updated whenever a new run surfaces a new recurring failure mode or clarifies an old one.
