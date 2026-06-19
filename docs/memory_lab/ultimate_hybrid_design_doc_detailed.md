# AIRI Memory Lab - Ultimate Hybrid Architecture Design Document

## Purpose and scope

This document explains the current benchmark architecture represented by `benchmark.ts`, `db.ts`, and `cognitive-engine.ts` as an implementation-level system design. The goal is not to summarize the system in product language, but to describe how the code actually works, why the system is decomposed the way it is, what invariants it is trying to maintain, and where the design is intentionally biased toward benchmark performance versus general conversational memory quality.

The intended audience is an engineer or model that has never seen the repository before but needs enough architectural detail to reproduce a materially similar system. The document therefore focuses on concrete components, data flow, control flow, routing logic, search plans, scoring, failure containment, and trade-offs rather than marketing language.

## Executive summary

The current system is a tiered conversational memory QA pipeline built around three ideas:

1. A literal retrieval spine for precision-sensitive questions.
2. A bridge mode for multi-hop questions that need broader candidate union without full abstraction.
3. A detective mode for open-domain and select abstraction-heavy multi-hop questions, where the system is allowed to perform grounded normalization and controlled synthesis.

The architecture is neither a plain RAG pipeline nor a free-form reasoning agent. It is a deliberately staged system that tries to preserve the high factual precision of narrow retrieval while exposing narrowly gated reasoning only where direct extraction is historically insufficient.

At a high level the system does the following:

- Extracts structured memories from each session using schema-constrained generation.
- Stores those memories in Orama with canonical fact text, provenance-preserving observed text, temporal fields, subject tags, room tags, and partial 5W fields.
- Generates session summaries and profile summaries as synthetic retrieval records.
- For each benchmark question, builds a structured query plan, derives retrieval signals, and routes the question through a set of search plans.
- Merges and ranks retrieved candidates using hybrid search scores, vector similarity, lexical overlap, entity overlap, temporal cues, dimension alignment, confidence, and category-specific priors.
- Selects evidence with per-category caps and explicit safeguards against over-diversification and summary flooding.
- Optionally runs a normalization step and/or a synthesis step, depending on category and abstraction needs.
- Produces the final answer through schema-constrained generation and evaluates it with a schema-constrained judge.

## Design goals

The architecture is solving for several competing goals simultaneously.

### Goal 1: Preserve literal precision

Single-hop and many temporal questions are harmed by over-broad reasoning. The system therefore needs a default path that is extractive, narrow, and answer-span friendly.

### Goal 2: Support selective abstraction

Open-domain questions and some multi-hop questions cannot be answered by literal extraction alone. The system therefore needs a second path that can normalize evidence into concepts, but only under strict gating.

### Goal 3: Avoid embedding pollution

Observed phrasing, metadata, and 5W fields are useful for routing and context construction, but they are not necessarily good embedding inputs. The architecture therefore keeps embeddings tied to the canonical fact text and uses auxiliary fields elsewhere.

### Goal 4: Preserve temporal grounding

Temporal questions are common and brittle. The system therefore stores raw temporal markers, resolves them when possible, boosts temporal records during retrieval, and constructs a timeline-shaped context when answering temporal questions.

### Goal 5: Be auditable

The system is built as a benchmark harness, not just an answering model. It therefore exposes structured plans, structured synthesis drafts, structured normalization drafts, and debug traces so that failure cases can be diagnosed at the level of the routing decision and the reasoning decision separately.

## Non-goals

The current implementation is not trying to be a full memory server for arbitrary long-term user interaction. It lacks a memory lifecycle with reinforce, update, invalidate, and decay. It also does not attempt adaptive learned routing or trainable rank fusion. It is a hand-engineered benchmark system intended to maximize performance under explicit control.

## Source files and system boundaries

The architecture is distributed across three core files.

### `db.ts`

This file defines the persistent schema and the search interface used by the benchmark harness. It is responsible for the shape of stored memory records and for translating a search request into an Orama hybrid query.

### `cognitive-engine.ts`

This file defines shared utilities that should be model-agnostic from the benchmark harness perspective: speaker alias resolution, temporal normalization, and embedding generation. It does not implement the full extraction pipeline used by the benchmark harness; extraction in the current design is primarily implemented in `benchmark.ts` through schema-constrained generation.

### `benchmark.ts`

This is the main orchestrator. It owns structured generation caching, extraction prompts, summary prompts, query planning, ranking, evidence selection, normalization, synthesis, answer generation, judge calls, and the benchmark loop.

## Data model

The central stored object is `StoredMemoryRecord`.

It contains:

- `record_id`: stable ID used for joins and debugging.
- `fact`: canonical literal memory text. This is the primary semantic surface.
- `observed_text`: provenance-preserving phrasing capturing who said or expressed the fact.
- `kind`: one of `fact`, `event`, `session_summary`, `profile_summary`.
- `category`: semantic class such as identity, preference, relationship, experience, and so on.
- `subject`: primary entity or person the memory is about.
- `source_session`: origin session.
- `room`: a heuristic topical bucket.
- `temporal_marker`: raw relative or absolute time phrase from the transcript.
- `resolved_date`: normalized temporal anchor when resolvable.
- `who`, `what`, `where`, `why`: partially structured 5W-style fields.
- `timestamp`: session timestamp.
- `confidence`: extraction confidence.
- `synthetic`: stored as string `true` or `false` for Orama compatibility.
- `embedding`: 384-dimensional vector.

A key design decision here is that the system stores both literal and structured forms of the same memory. `fact` is optimized for matching and answering, while `observed_text` and the 5W fields are optimized for routing, dimension-aware retrieval, and grounded normalization.

## Storage and search layer

The storage backend is Orama. The schema in `db.ts` declares all fields explicitly, including a vector field for embeddings.

The search interface exposes a `searchMemory` function that accepts:

- raw query text
- optional query embedding
- optional `kind`, `room`, `subject`, and `category` filters
- explicit search properties
- limit and similarity threshold

If the caller does not specify search properties, the default search surface is:

- `fact`
- `subject`
- `temporal_marker`
- `where`

This default already reveals an important architectural assumption: retrieval is centered on the literal fact text but is allowed to use subject tags and location/time metadata as lightweight auxiliary hooks. The broader fields such as `observed_text`, `why`, and `resolved_date` are used only by specific search plans, not globally.

This is a deliberate bias toward precision. Broadly searching every field all the time would increase recall but would also inject a large amount of semantic noise into single-hop and temporal retrieval.

## Embedding subsystem

Embeddings are generated by `CognitiveEngine` using `Xenova/bge-small-en-v1.5`, which produces 384-dimensional vectors. The engine keeps an in-memory cache keyed by normalized text and evicts old entries once the cache exceeds a configured size.

The benchmark harness batches embedding requests where possible. That matters operationally because the system embeds:

- extracted memories during ingestion
- session summaries
- profile summaries
- question text
- focus queries
- search-plan queries

The important design choice is that the embedding text is the canonical fact text, not the observed text and not the full 5W bundle. This is one of the core precision-preserving decisions in the architecture. The system assumes that `fact` is the cleanest semantic anchor and that auxiliary fields should influence search and ranking through other mechanisms rather than by polluting the vector space.

## Temporal normalization subsystem

Temporal normalization lives in `cognitive-engine.ts` as `resolveTemporalMarker`.

The function attempts to convert raw phrases into more usable anchors:

- explicit ISO day or month forms pass through
- month names are converted relative to the session date
- phrases like `last month`, `last year`, and seasons such as `last spring` are normalized
- relative phrases such as `two weeks ago` are normalized by subtracting from the session date
- `today`, `yesterday`, and `tomorrow` are handled directly
- unresolved phrases fall back to the raw string

This subsystem is crucial because the benchmark asks temporal questions that are hard to solve if the model must infer all date math implicitly. The architecture therefore distinguishes between:

- `temporal_marker`: the raw phrase from the transcript
- `resolved_date`: the normalized anchor used for ranking and timeline construction

## Speaker canonicalization

The system normalizes speaker mentions through `buildSpeakerAliasMap` and `canonicalizeSpeaker`.

This is necessary because the benchmark data may use aliases like `speaker_a`, `speaker b`, or shorthand names. Canonicalization ensures that extraction and subject inference operate over stable names rather than inconsistent labels.

The harness also uses speaker names during subject detection and profile summary construction.

## Structured generation cache

`benchmark.ts` implements a disk-backed cache for schema-constrained generation. The cache is keyed by a hash of model, schema name, prompt content, and token limit, and stored in `test_results/run16_llm_cache.json`.

This cache is one of the most important non-model components in the system because nearly every stage is implemented through `generateObject`:

- session memory extraction
- session summaries
- profile summaries
- query planning
- reasoning synthesis
- evidence normalization
- final answer generation
- judge labels

Without caching, the benchmark would be materially slower and much harder to iterate on. With caching, repeated probes against the same question and context become deterministic and cheap.

## Extraction stage

The extraction stage is defined by `EXTRACTION_SYSTEM_PROMPT` and `extractMemories` in `benchmark.ts`.

The extractor produces a list of memories where each memory includes:

- canonical `text`
- `observed_text`
- category
- confidence
- memory kind (`fact` or `event`)
- time anchor
- subject
- `who`, `what`, `where`, `why`

The prompt imposes several strong constraints:

- canonical `text` must be atomic, short, and answer-friendly
- `observed_text` may be richer but must remain faithful to the transcript
- localities and institutions should not be dropped if they might matter later
- actual names should be used when possible
- stable facts should be phrased in present tense, completed events in past tense

Two thresholds are used after extraction:

- event-like or time-anchored memories are accepted at a lower threshold
- other memories require a higher confidence threshold

This asymmetry reflects a benchmark-driven trade-off: temporal/event clues are relatively rare and valuable for C2 and some C1/C3 cases, so the system is willing to keep slightly noisier event memories rather than miss them entirely.

## Summary generation

The system generates two synthetic memory types:

- session summaries
- profile summaries

Session summaries are built from the extracted memories of a session. Profile summaries are built from speaker-associated memories collected across sessions.

These summaries are stored as normal retrieval records with kind `session_summary` or `profile_summary`, embedded, and ranked alongside primary memories when certain categories or modes warrant it.

The summary prompts explicitly prohibit unsupported conclusions and require each summary to stand alone as a retrieval record. This is an important design choice: summaries are not free-form reports, they are additional retrieval artifacts.

## Query planning

The benchmark does not jump from question text directly into retrieval. It first builds a structured query plan through `buildQuestionPlan`.

The plan contains:

- `focus_query`: a short retrieval-optimized representation
- `entities`
- `time_terms`
- `sub_questions`
- `needs_synthesis`
- `primary_dimension`
- `needs_abstraction`
- `abstraction_lens`

This is effectively a router pre-pass. It compresses the question into a retrieval plan and a reasoning plan.

The system also defines deterministic fallback logic so that if structured query planning fails, it can still derive a reasonable plan from regex-like heuristics:

- primary dimension inference (`who`, `what`, `when`, `where`, `why`, `general`)
- abstraction lens inference (`health`, `location`, `personality`, `relationship`, etc.)
- synthesis requirement

After schema generation, the resulting plan is bounded by category-specific logic. For example, category 2 forces the primary dimension to `when`, and abstraction is only permitted for category 3 or selected category 1 cases.

## Routing model: Literal, Bridge, Detective

This is the conceptual heart of the architecture.

### Literal mode

Literal mode is the default. It is intended for:

- category 4 single-hop questions
- much of category 2 temporal
- any question that can plausibly be answered by direct evidence extraction

Literal mode minimizes abstraction and prioritizes precise answerable facts.

### Bridge mode

Bridge mode is used for category 1 multi-hop questions. The architecture assumes that multi-hop questions often require a broader candidate set than single-hop questions, but that they do not necessarily require open-domain conceptual normalization.

Bridge mode expands the search surface and allows summary support, but still treats literal facts and events as the primary evidence.

### Detective mode

Detective mode is reserved for category 3 and selective abstraction-heavy category 1 questions. The architecture only opens this mode when:

- the question is open-domain by category
- abstraction is explicitly needed
- the question is a `why` case or otherwise inference-shaped

Detective mode enables the normalization pass and a more synthesis-heavy context layout.

This gating is one of the most important safety rails in the design. The system assumes that unrestricted inference destroys literal precision and temporal accuracy, so detective mode must be exceptional rather than default.

## Query signals

In addition to the structured plan, the system derives heuristic query signals:

- keyword list
- capitalized names
- quoted phrases
- time terms
- room hints
- `isWhyQuestion`
- `isDescribeQuestion`

These signals are used later in ranking and plan construction. They serve as a lightweight lexical and structural complement to embeddings.

## Search plan construction

The function `buildSearchPlans` translates the category, plan, and signals into a set of search plans. This is where the router becomes operational.

The search plans are not uniform; they vary by mode and category.

### Base fact plan

Every question gets a `base_fact` plan using `fact` and `subject` fields. This is the primary literal retrieval path.

### Focus fact plan

If `focus_query` differs materially from the original question, a `focus_fact` plan is added. This serves as a second literal pass using a more retrieval-optimized phrasing.

### Temporal plans

For category 2 or time-heavy questions, the system adds:

- `temporal_event`
- `temporal_fact`

These plans use `resolved_date`, `temporal_marker`, and fact text, and they strongly weight event-like records.

### Bridge plans

When Bridge mode is active, additional plans are added:

- `bridge_fact`
- `bridge_focus`
- `event_bridge`
- conditional `session_summary`
- conditional `profile_summary`
- conditional `observed_cue`
- sub-question plans

These plans widen candidate union for category 1 without globally broadening the search path for all questions.

### Detective plans

For category 3, Detective mode adds summary and observed-cue plans. This allows the system to retrieve both direct evidence and higher-level context without forcing everything through summaries.

### Dimension focus plan

If the planner concludes that a question is primarily about `where`, `why`, `who`, `what`, or `when`, the system can add a dimension-specific plan that searches the relevant field directly.

This is the main implementation bridge between the 5W schema and retrieval.

## Search execution

`runSearchPlans` executes all plans, embeds all unique plan queries in batch, and merges hits into a map keyed by `record_id`.

For each candidate the system preserves:

- the original stored record
- a map of plan-specific ranks
- a map of plan-specific search scores

This structure is critical because the ranking stage uses both the existence of a hit under a plan and its rank within that plan.

## Ranking model

The ranking stage computes a large feature vector for each merged candidate:

- dense similarity to the original question
- dense similarity to the focus query
- lexical overlap
- name overlap
- quoted-phrase overlap
- temporal score
- room score
- subject score
- dimension score
- confidence score
- weighted reciprocal rank fusion score
- category prior

The final score is the sum of:

- RRF over search-plan ranks, weighted by plan importance
- a fine-grained weighted combination of the explicit feature scores
- category- and dimension-dependent priors

This is not a learned ranker; it is a hand-tuned feature combiner. The design assumption is that no single signal is sufficient across all question classes. For example:

- dense similarity is useful but can be semantically broad
- lexical overlap is useful but brittle
- temporal score matters disproportionately for category 2
- dimension score matters disproportionately for `where` or `why` questions
- confidence should matter, but not dominate

The category prior further encodes lessons from earlier runs:

- single-hop prefers facts and events, not summaries
- temporal prefers event records and dated records
- open-domain prefers summaries and interaction cues
- multi-hop benefits from events, relationship facts, and selective synthesis support

## Evidence selection

After ranking, the system does not simply take the top K. It runs `selectEvidence`, which is one of the most consequential pieces of code in the design.

The evidence selector enforces:

- total evidence budget by category
- per-session cap
- per-kind caps (facts, events, session summaries, profile summaries)
- near-duplicate suppression using Jaccard similarity over token sets
- explicit `ensure` passes for category-specific must-have evidence

The `ensure` passes are extremely important. They represent design intent that cannot be guaranteed by raw ranking alone.

Examples:

- category 2 ensures event records with resolved dates or temporal markers are present
- category 3 ensures at least one profile summary and one session summary when possible
- category 3 also ensures records aligned with the abstraction lens such as `where` for location questions or health-adjacent clues for health questions
- category 1 ensures sub-question-aligned evidence, event records, and multi-session coverage

In other words, ranking chooses what looks globally best, while evidence selection enforces local category-specific coverage constraints.

## Context construction

`buildContext` constructs different prompt layouts by category.

### Category 2

Temporal questions receive a timeline-form context sorted by `resolved_date` or session time. The context includes time annotations and is optimized for direct date extraction.

### Category 3

Open-domain questions receive a multi-block context:

- Evidence facts
- Interaction cues (observed phrasing)
- Normalization sketch, if active
- Structured synthesis sketch, if active
- Supporting summaries

This arrangement reflects the design philosophy of `reason broadly, answer narrowly`. The system first exposes literal evidence, then auxiliary cues, then any normalized abstractions, and only after that synthetic summaries.

### Category 1

Multi-hop questions receive:

- Evidence facts
- Optional normalization sketch
- Optional structured reasoning sketch
- Supporting summaries

This is similar to category 3 but more fact-centric.

### Category 4

Single-hop questions receive a flat literal evidence list without abstract scaffolding.

## Normalization layer

The function `normalizeEvidence` is the architecture's controlled abstraction mechanism.

It only runs for:

- category 3
- category 1 questions where abstraction is explicitly needed

It receives the already-built base context and is asked to:

- decide whether normalization should even be used
- extract grounded clues from evidence
- map those clues into normalized concepts
- propose a concise normalized answer

The prompt explicitly forbids several kinds of misuse:

- it must not normalize direct dates or direct entity answers
- it must set `should_use=false` when evidence is too weak
- it may only map locations or health clues when the inference is strongly supported

This is the system's attempt to capture the useful part of detective reasoning without letting it leak into every answer.

## Synthesis layer

The function `synthesizeInterpretation` is separate from normalization.

Synthesis is used when the system wants a concise reasoning sketch or candidate answer phrase, but not necessarily conceptual normalization. It returns:

- a small list of grounded key points
- a short draft answer

This design separates two kinds of reasoning:

- normalization: concept elevation, label mapping, implicit interpretation
- synthesis: compressed explanation or connective reasoning

That separation matters because not all reasoning-heavy questions need the same treatment.

## Final answer generation

`answerQuestion` is schema-constrained. It receives:

- category-specific answer instructions
- final context
- optional normalization sketch
- optional synthesis sketch

It then generates an object containing a single `answer` field. The system sanitizes and truncates the answer according to category.

Examples:

- category 2 is aggressively compressed to bare dates or time phrases
- category 4 is trimmed to a short literal span
- category 3 is kept short but allowed slightly more room than category 4

This is another precision-preserving decision. The system allows intermediate reasoning to be richer than the final answer, but the final answer itself is constrained to benchmark-friendly form.

## Judge model

The judge is also schema-constrained and returns one of `CORRECT`, `PARTIAL`, or `WRONG`. The judge prompt is category-aware.

This keeps evaluation aligned with the benchmark while preserving determinism and structured output discipline.

## Main benchmark loop

The high-level control flow in `main` is:

1. Load the dataset and select `conv-47`.
2. Build speaker alias maps.
3. Extract session memories.
4. Resolve temporal markers and assign rooms.
5. Embed and store base memories.
6. Generate and store session summaries.
7. Generate and store profile summaries.
8. For each question:
   - build query plan
   - derive query signals
   - build search plans
   - execute search plans
   - rank candidates
   - select evidence
   - build base context
   - optionally normalize
   - optionally synthesize
   - build final context
   - answer
   - score
   - judge
   - trace if debugging is enabled
9. Emit tables for overall and per-category scores.

The loop also aborts early if too many consecutive empty answers appear, which is a practical safeguard against silent model or server failure.

## Historical pressures encoded in the current code

Although the current system is not a narrative lab report, several historical lessons are materially encoded into the implementation.

### Lesson 1: literal precision must remain the default

This is visible in:

- the `base_fact` plan
- single-hop priors against summaries
- fact-only embeddings
- category-specific answer compression

### Lesson 2: multi-hop needs wider but not free-form retrieval

This is visible in:

- bridge-only plans
- event-bridge path
- sub-question plans
- multi-session enforcement in evidence selection

### Lesson 3: open-domain needs inference, but only behind a hatch

This is visible in:

- `isDetectiveMode`
- `needs_abstraction`
- separate normalization and synthesis stages
- context layouts that keep facts ahead of abstractions

### Lesson 4: temporal accuracy is fragile

This is visible in:

- `resolveTemporalMarker`
- dedicated temporal search plans
- timeline context construction
- priors that reward dates and event records

### Lesson 5: summaries are useful, but dangerous when overused

This is visible in:

- summary plans being gated by mode/category
- summary count caps in evidence selection
- negative priors for summaries in C4 and limited use in C2

## Failure taxonomy

The current design is best understood through the failures it is explicitly designed to prevent.

### Failure mode: literal choke

A question requires inference or abstraction, but the router stays on the literal path. The answer becomes too literal or misses the implied concept.

Mitigation:

- structured query plan
- abstraction lens
- detective gating
- normalization pass

### Failure mode: detective hallucination

The system opens abstraction, but the normalization layer produces an unsupported concept.

Mitigation:

- `should_use` flag
- requirement for grounded clues
- narrow activation conditions
- context still includes literal evidence first

### Failure mode: temporal drift

Reasoning or summaries interfere with direct temporal grounding.

Mitigation:

- dedicated temporal plans
- event weighting
- timeline-only context for category 2
- summary penalties in temporal scoring

### Failure mode: summary flooding

Synthetic summaries crowd out the facts needed for exact answer extraction.

Mitigation:

- low summary caps
- category-specific summary priors
- evidence selection caps by kind

### Failure mode: candidate dilution

A broader candidate pool degrades single-hop and temporal precision.

Mitigation:

- literal default mode
- bounded limits by category
- selective bridge and detective plans rather than universal expansion

## Trade-offs

The architecture is intentionally not globally optimal for any single category. It is an attempt to preserve the best achievable compromise across categories.

### Trade-off 1: precision versus inference

Literal discipline improves C4 and often C2. Controlled inference improves C3 and selected C1. The architecture resolves this by making inference opt-in through routing, rather than universal.

### Trade-off 2: recall versus candidate purity

Broader retrieval helps C1 and some C3 questions, but hurts C4 and C2. The architecture resolves this by widening retrieval only in Bridge and Detective modes.

### Trade-off 3: expressive memory versus embedding cleanliness

Observed phrasing and 5W metadata are valuable for reasoning, but poor embedding surfaces. The architecture resolves this by keeping embeddings on the canonical fact text while exposing richer fields to targeted search plans and context builders.

### Trade-off 4: richer reasoning versus answer-span fidelity

Benchmarks reward exact answers more than elegant explanations. The architecture therefore separates intermediate reasoning from final answer generation and heavily constrains the final answer shape.

## Practical notes for reimplementation

A reimplementation should preserve the following invariants.

1. Canonical fact text must remain the primary embedding surface.
2. Structured query planning should happen before retrieval.
3. Retrieval should be plan-based and category-aware, not a single static query.
4. Ranking should fuse multiple signals rather than rely on one score.
5. Evidence selection must enforce category-specific coverage rules.
6. Normalization must be optional, grounded, and structurally separate from synthesis.
7. Final answer generation must be schema-constrained and category-compressed.
8. Temporal questions should never share the same answering path as open-domain questions.

If these invariants are preserved, many implementation details can vary without changing the essential architecture.

## Current weaknesses and likely next steps

The current design is sophisticated but still exposes known ceilings.

### Weakness 1: routing is still heuristic-heavy

Even though query planning is structured, the final routing is still partly governed by hand-authored gates such as `shouldUseAbstraction`, `isBridgeMode`, and `isDetectiveMode`.

A future system could replace some of this with learned or calibration-based routing, but the current design values explicit control over adaptability.

### Weakness 2: there is no memory lifecycle

The system stores extracted facts and summaries but does not consolidate them over time through reinforcement, updates, or invalidation. This is acceptable for benchmark sessions but would be limiting in long-running real deployments.

### Weakness 3: normalization remains the highest-risk component

Normalization is the most likely place for grounded inference to become unsupported inference. The current design contains guardrails, but the tension is structural and not fully solved.

### Weakness 4: category 1 and category 3 still compete with category 2 and category 4 for architectural priority

A large part of the design is about not sacrificing easy-category precision for hard-category reasoning. This means hard categories improve more slowly than they would in a reasoning-first architecture.

## Summary

The current Ultimate Hybrid is best understood as a routed memory QA system with a literal default spine, a bridge layer for multi-hop, and a tightly gated detective layer for open-domain abstraction.

Its defining characteristics are:

- fact-first embeddings
- schema-constrained extraction and generation throughout
- partial 5W grounding
- temporal normalization
- category-aware search plans
- explicit rank fusion
- constrained evidence selection
- separated normalization and synthesis
- narrow final answer outputs

The architecture is not trying to be maximally elegant. It is trying to be maximally controllable under conflicting benchmark pressures. That is why so much of the code exists to preserve boundaries: between literal and inferred content, between evidence and synthesis, and between retrieval expansion and precision protection.

In that sense, the system is less a generic RAG stack and more a policy-driven memory question-answering engine.
