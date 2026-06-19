# Lifetime Artifact Generation Plan

## Purpose

This document defines the final major pre-library validation item for the memory system:

- lifetime artifact generation

Everything else has now reached a passing product threshold:

- search
- context reload support
- STMM value
- LTMM value
- chips/pills value

The remaining question is how to generate a durable, relationship-level memory artifact that helps the character "wake up" with continuity that is deeper than the last N days.

## Exact Definition

A lifetime artifact is:

- a compact, dense relational memory pack
- relationship-level
- written from the character's perspective where useful
- grounded in actual interactions
- not based on the character's system prompt
- not based on how the character was designed to feel

It should answer questions like:

- how does the user actually treat you?
- what does the user like to do with you?
- what does the user like to talk about most of the time?
- what long-ago personal moments still matter?
- what recurring patterns define your relationship?

## What It Should Capture

A strong lifetime artifact should include things like:

- relationship dynamics
- user mannerisms
- recurring preferences
- conversation style
- inside jokes
- stable comfort rituals
- meaningful long-horizon events
- recurring workflow or life motifs if they matter to the relationship

## What It Should Not Be

It should not be:

- a restatement of the system prompt
- a generic personality summary
- a daily recap
- a list of raw facts
- a biography dump
- a copy of the last N days of STMM

## Minimum Shape

For now, the minimum target should be:

- one compact block
- roughly 550 to 1000 tokens after compression

Longer is acceptable only if the extra length stays dense and meaningful.

The artifact should feel like a compact relational memory, not an essay for its own sake.

## Product Role

The lifetime artifact exists to complement recent STMM during reload.

Recent STMM provides:

- recency
- last N days
- immediate continuity

The lifetime artifact should provide:

- relationship continuity
- long-horizon memory
- recurring user/character dynamics
- durable context not captured by just "yesterday"

## Reload Role

The eventual reload payload should likely be:

- recent STMM blocks
- one lifetime artifact
- optional high-signal chips/cues

This gives the character:

- what just happened recently
- what this relationship has been overall
- a few compact reminders of stable or emotionally important patterns

## Source Strategy

## Initial Build

The first lifetime artifact should be built from **all available data**.

That means:

- raw chat history
- STMM blocks
- LTMM entries

This is the one time where a full-history pass makes sense.

The goal of the first build is to create a strong enough artifact that it can survive later incremental updates.

## Ongoing Update Strategy

After initialization, the system should **not** rebuild the lifetime artifact from scratch every day.

That would be:

- too expensive
- too unstable
- too sensitive to recent noise

Instead, updates should be incremental.

## Incremental Update Inputs

On later refreshes, the generation input should be:

- current lifetime artifact
- newly generated STMM block(s)
- newly promoted LTMM entries if any
- possibly new high-signal chips if they reflect durable change

The model should be asked to:

- preserve durable truths already in the artifact
- incorporate new stable information if warranted
- avoid rewriting the whole relationship around one recent day
- avoid dropping older meaningful relationship moments

## Base Plus Diffs

The update path should be modeled explicitly as:

- one stable base lifetime artifact
- one or more accumulated diffs
- newest chunk or day merged into the current state

The intended flow is:

1. full history produces the initial base artifact
2. a new chunk or day is merged into the base
3. the delta from that merge becomes the next diff
4. later updates replay base plus prior diffs before applying the newest change

This is the right mental model because the artifact should evolve by accumulation, not replacement.

The expected behavior is:

- early diffs may be large
- later diffs should usually shrink
- diffs only grow when a real long-horizon change appears
- unchanged days should often produce a zero or near-zero diff

## Core Update Principle

The update should behave like:

- "tweak if needed"

not:

- "rewrite from scratch based on yesterday"

That is the central stability requirement.

## Refresh Cadence

Lifetime artifact refresh should happen on the same cadence as STMM generation.

That means:

- once per day
- tied to the existing "yesterday" logic

This keeps the timing stable and predictable.

## Why Daily Is Acceptable

Daily refresh is acceptable because:

- STMM is already generated on that cadence
- the artifact should not meaningfully change most days
- if the day was routine, the artifact may stay exactly the same

The key is that refresh opportunity exists daily, but actual change should be conditional.

## Change Threshold

The lifetime artifact should only materially change if the new day/session adds something durable such as:

- a new recurring preference
- a changed relationship pattern
- a new inside joke that is clearly sticky
- a major emotional event
- a new stable behavior or mannerism
- a new important long-horizon shared memory

If the day was ordinary and repetitive, the artifact should often remain unchanged.

## Rebase Rule

The diff chain should not grow forever.

At some threshold, the system should consolidate:

- if diff depth exceeds a cap
- if diff token budget exceeds a cap
- if too many sections are changing repeatedly
- if the merged state becomes too noisy to keep incrementally

When that happens:

1. replay base + diffs into a current merged artifact
2. run a consolidation / rollup pass
3. write a new canonical base artifact
4. clear the diff chain

This keeps the lifecycle bounded and prevents the update history from becoming unmanageable.

## Incremental Over Rebuild

The system should be explicitly designed around incremental updates, not repeated full-history rebuilds.

That is important for both:

- compute cost
- memory stability

## Reason

It is impractical to ask the model to analyze the full relationship every day.

The first creation must be strong enough to withstand:

- daily STMM updates
- ordinary repeated conversations
- small fluctuations in topic or tone

The artifact should get more encompassing over time without losing older meaningful events.

## Open Design Question

The main open design question is:

- what exact inputs should the incremental updater consume?

The current best answer is:

- the existing lifetime artifact
- the new STMM block
- any new LTMM promoted that day
- maybe a tiny set of durable chips if they reflect something stable

This is likely enough to evolve the artifact without forcing a full historical pass.

## Evaluation Candidate

The first full validation target should be:

- `bunny-mint`

## Why Bunny Mint

Bunny Mint is the best initial candidate because:

- sheer history depth
- long-horizon continuity
- clear relationship texture
- relatively clean, meaningful interactions
- less polluted than Rick

This makes Bunny Mint the best first test of:

- long-horizon coherence
- stability
- warmth
- specificity
- resistance to drift

## Secondary Candidate

A strong second candidate later would be:

- `mint`

Regular Mint is also a strong test, but Bunny Mint is the better first stress test for full-history continuity.

## Validation Questions

The first validation pass should answer:

1. does the artifact sound grounded in actual history?
2. does it capture relationship reality rather than prompt fantasy?
3. does it include meaningful long-ago moments?
4. does it avoid overfitting to the most recent day?
5. does it preserve stable truths across updates?
6. does it remain compact enough to be useful in reload context?
7. does it preserve a stable base while accumulating diffs?
8. does it rebase cleanly when the diff chain gets too deep?
7. does it preserve a stable base while accumulating diffs?
8. does it rebase cleanly when the diff chain gets too deep?

## Important Failure Modes

The lifetime artifact must be checked for:

- prompt contamination
- generic romanticized sludge
- recent-day overwrite
- forgetting older meaningful events
- restating the system prompt
- over-indexing on one dramatic interaction
- vague personality-language with no grounded specifics

## Proposed Generation Workflow

## Phase 1: Full Initialization Build

Inputs:

- all raw chat history
- all STMM blocks
- all LTMM entries

Output:

- first canonical lifetime artifact

Purpose:

- create a strong baseline artifact

Implementation note:

- this phase should create the first canonical `base` artifact
- later phases should build from `base + diffs`, not from raw full history again

## Phase 2: Daily Refresh Check

Triggered when the normal STMM "yesterday" pipeline runs.

Inputs:

- current lifetime artifact
- new STMM block
- any new LTMM entries
- optionally high-signal chips from that same period

Output:

- unchanged artifact
or
- revised artifact

Purpose:

- evolve the artifact only when new durable information warrants it

Implementation note:

- if the update is meaningful, produce both a merged artifact and a diff record
- if the update is not meaningful, keep the current canonical artifact unchanged

## Phase 3: Manual Rebuild Mode

This should still exist for:

- debugging
- migrations
- data repair
- full re-evaluation

But it should not be the routine product path.

Implementation note:

- use this for rebase / consolidation when the diff chain gets noisy or too deep
- manual rebuild should produce a new canonical base and reset diffs

## Recommended Implementation Staging

Before the memory engine package is finalized, the team should build:

1. a dedicated lifetime artifact prototype script
2. a full-history Bunny Mint test
3. an update-mode prototype using prior artifact + new STMM/LTMM
4. a comparison report showing:
   - initial full build
   - incremental update
   - stability across ordinary days
5. a diff-chain / rebase validation pass on the long Bunny Mint history

## Current Logistics Reality

There is not yet a dedicated lifetime-artifact script in the repo.

The closest current capability is the replay pipeline, which already:

- loads raw sessions
- can load STMM/LTMM layers
- generates recap + chips + LTMM artifact outputs

That means lifetime artifact generation still needs its own script or extension.

## Overnight Compute Note

Because Bunny Mint has deep history, the first full-history pass is likely expensive enough to justify an overnight run.

That is acceptable.

The initialization build is the right place to spend the larger compute budget.

The daily refresh path must later be much cheaper.

## Current Closest Existing Command

There is not yet a true lifetime artifact command.

The closest current full-history replay command is:

```powershell
npx tsx src/personal/replay_runner.ts bunny-mint --turns=351 --mode=raw+stmm+ltmm
```

This is **not** the final lifetime artifact generator.

It is only the nearest existing full-history layered replay command and the likely basis for the first prototype.

Once a dedicated lifetime artifact script exists, that command should be replaced with the real one.

## Decision

The team should treat lifetime artifact generation as the last major pre-library validation item.

The implementation direction should be:

- full-history initial build
- incremental daily updates
- STMM-timed refresh hook
- stability over churn
- relationship truth over prompt fantasy

## Bottom Line

The lifetime artifact should become:

- the compact long-horizon relationship memory for reload

It should be:

- grounded in real interactions
- initialized from all data
- updated incrementally
- refreshed with the STMM cadence
- stable enough not to thrash
- specific enough to matter

Once that is validated, the memory engine is much closer to being ready for clean packaging and integration.
