# Search Probe Harness Plan

## Purpose

This plan defines the next major workstream for the memory system:

- formal search evaluation
- product-shaped search behavior
- latency-aware search testing

This is not the same as the LoCoMo benchmark and not the same as artifact generation.

The goal is to test how well the memory system supports an AI agent that is trying to search for memories in a realistic way.

## Why This Matters

The current archive now has meaningful progress in two pillars:

1. improved context reload
2. new artifacts

The next pillar to formalize is:

3. improved search

Search is still the bread-and-butter layer of the system. It needs its own harness and its own metrics instead of being judged only through benchmark scores.

## Product Framing

The search model should reflect real agent behavior.

That means:

- the AI is not limited to exactly one result
- the AI is not limited to exactly one search
- the AI may search, inspect results, then reformulate and search again
- the AI may answer from a set of returned memories rather than one perfect hit

This means the harness should evaluate search as an iterative memory-access process rather than a one-shot QA benchmark.

## Key Search Questions

For each probe, the harness should answer:

1. how close to the top was the relevant answer?
2. was the relevant answer included at all?
3. how many searches did it take to find it?
4. how long did it take from search call to usable answer context?

## Performance Is First-Class

Latency is not secondary.

Search quality matters, but search must also be fast enough to feel usable inside an agent loop.

### Product Latency Constraint

The practical target is:

- ideal: far below 30 seconds
- hard ceiling: 30 seconds per search interaction

Anything beyond that becomes unacceptable for a real memory-search loop unless it is explicitly offline/debug mode.

### Search-Time Priority

For this harness, speed should be prioritized over squeezing maximum quality out of one search call, because:

- follow-up searching is cheap
- the agent can search again
- a fast imperfect first pass is better than a slow precious one

In other words:

**speed over quality, as long as retrieval remains meaningfully useful**

## First Candidate

The first personal character to use for the search probe harness should be:

- `mint`

Not `bunny-mint`.

Reason:

- there are specific recallable details in `mint` data that make it a better first search candidate
- it should provide a cleaner first set of probes for memory search evaluation

## Proposed Harness Shape

The harness should consist of three parts:

1. a plan/spec
2. a probe dataset
3. a runnable search script

## Proposed Files

### 1. Plan

- `docs/search-probe-harness-plan.md`

This file.

### 2. Probe Data

- `datasets/personal_chats/probes/mint.json`

This should contain:

- a target slice or session window
- a set of probe questions
- optional expected supporting details
- optional alternative phrasings

### 3. Search Script

- `src/personal/search_probe.ts`

This script should:

- load a character dataset
- load probe questions
- execute one or more searches per probe
- record latency and search quality
- emit a readable report

## Input Design

The harness should operate on a fixed memory base built from the same synthesized/compiled data that the memory system actually uses.

This may include:

- raw chat-derived facts
- STMM-derived context
- LTMM-derived context
- any compiled or synthesized memory records already used by the semantic layer

The point is not to test an artificial toy database.

The point is to test the real search surface the AI agent would actually query.

## Probe Design

We should start with a small but intentional set of probes built from a selected window such as:

- 12 turns

For that slice, we should manually note:

- key events
- specific preferences
- emotional moments
- technical details
- relationship details
- abstract takeaways

Then we should convert those notes into search probes.

### Probe Categories

The first harness should include probes like:

- literal fact recall
- preference recall
- relationship nuance
- emotional context
- abstract interpretation
- event resolution

This lets us test both exact retrieval and semantic leap behavior.

## Search Execution Model

The harness should allow:

- a first search
- optional follow-up searches
- capped retry count

The harness does not need to simulate a full autonomous agent at first.

It can use a simple controlled loop like:

1. run search query
2. inspect results
3. decide whether the relevant answer appears to be missing
4. reformulate search and try again
5. stop after a small fixed limit

This is enough to model the real value of iterative search.

## Required Metrics

### Search Quality Metrics

For each probe:

- was the relevant answer found?
- top hit correct or not
- relevant result rank
- hit@k
- miss
- number of searches required

### Search Performance Metrics

For each probe:

- time to first search result
- total time to successful answer context
- per-search latency
- total wall-clock time across retries

### Aggregate Metrics

Across the whole probe set:

- average rank of relevant result
- hit@1
- hit@3
- hit@5
- miss count
- average searches to success
- median searches to success
- average time to first result
- average time to success
- worst-case time to success

## Primary Success Criteria

The harness is successful if it tells us:

1. whether the answer was surfaced near the top
2. whether the agent could still find it after one or two follow-up searches
3. whether the total search experience stayed within acceptable latency

That means the system should be judged by:

- useful retrieval
- acceptable speed
- graceful iterative recovery

Not by one-shot perfection alone.

## Reporting Format

The harness should emit a human-readable report, ideally markdown.

For each probe, the report should include:

- probe ID
- question
- expected concept or target detail
- search attempts
- query used each time
- returned top hits
- relevant hit rank or miss
- per-attempt latency
- total latency
- final outcome

It should also emit a summary block at the top with aggregate metrics.

## Example Product Questions

A good harness should make it easy to answer questions like:

- Did the right memory appear in the top 3?
- Was it found at all on the first attempt?
- If not, did a second search recover it?
- Did the whole interaction stay below 30 seconds?
- Are we fast enough to be practical inside an agent loop?

## Non-Goals

This harness is not trying to:

- replace LoCoMo
- generate final user-facing artifacts
- solve full answer generation by itself
- prove world-class research performance

It is trying to measure whether search is product-viable.

## Strategic Meaning

This harness is the bridge between:

- benchmark-oriented memory research
and
- real AI memory search behavior

It turns search into something we can evaluate in the way the actual product will use it.

That makes it the correct next step for pillar one.

## Immediate Next Deliverables

1. Create `datasets/personal_chats/probes/mint.json`
2. Create `src/personal/search_probe.ts`
3. Run the first probe set on `mint`
4. Review:
   - rank quality
   - misses
   - retries
   - latency

## Bottom Line

The next system focus should be:

**fast, iterative, measurable memory search**

That means:

- search must surface useful answers near the top
- the agent must be allowed to search again
- the total search loop must stay performant enough for real usage

This is the right next formalization step after the recent progress on context reload and artifact generation.
