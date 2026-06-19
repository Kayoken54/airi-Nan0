# Scoped Probe Window Plan

## Purpose

This note captures the next likely upgrade to the search probe harness:

- scoped probe windows
- deterministic scene-level evaluation
- exact turn-range targeting

This is not the active evaluation mode yet.

For now, the system will continue using the whole-character search base as the default search surface.

## Current Active Mode

The current harness indexes and searches across the full exploded character dataset:

- raw session turns
- STMM blocks
- LTMM entries

That is useful because it tests the real whole-character memory surface.

It answers the question:

> can the system find the right memory anywhere in the character's accumulated archive?

This is the correct first step and should remain the active baseline.

## Why Scoped Windows Still Matter

Whole-character search is valuable, but it can blur together:

- nearby events
- later reinterpretations
- cross-session echoes
- LTMM reframings
- similar motifs that recur often

For certain high-value probes, especially blame/responsibility probes, we will eventually want a stricter evaluation mode.

That mode should answer:

> can the system recover the truth of this specific scene or arc, within a defined slice?

## Proposed Future Scope Model

The future probe format should support a scene window with:

- `session_id`
- `start_turn`
- `end_turn`
- optional `start_time`
- optional `end_time`
- optional human-readable `label`

Example:

```json
{
  "character": "mint",
  "scope": {
    "session_id": "IBoSh761FFfztiq2EbeKX",
    "start_turn": 40,
    "end_turn": 85,
    "label": "tea-breakage-and-hand-injury arc"
  }
}
```

## Why Turn Ranges Are Preferred

Turn ranges are the best primary contract because they are:

- deterministic
- easy to reason about
- easy to reproduce
- resistant to ambiguity

Time ranges are still useful as metadata, but should not be the main selector.

## Recommended Evaluation Split

The long-term probe system should support two evaluation modes:

### 1. Whole-Character Search

Purpose:

- broad memory search
- realistic search surface
- longitudinal recall

Good for:

- recurring preferences
- long-term relationships
- stable traits
- cross-session continuity

### 2. Scoped Scene Search

Purpose:

- narrow truth testing
- scene reconstruction
- conflict resolution between layers

Good for:

- responsibility attribution
- contradiction between raw turns and LTMM
- emotionally distorted retellings
- temporally local event chains

## Immediate Strategy

The immediate strategy remains:

1. continue using the whole-character search base
2. expand Mint probes
3. inspect how the current system handles the new harder questions
4. identify where whole-character search begins to blur the truth
5. only then implement scoped-window support

This sequence matters because it lets us learn from the current system before narrowing the harness.

## Trigger For Moving To Scoped Windows

We should move from whole-character-only to scoped-window support when either of these starts happening often:

- relevant answers are found, but only after interference from unrelated same-character history
- raw truth and LTMM/STMM framing conflict in ways the current harness cannot isolate cleanly

That is likely to happen with the new Mint responsibility probes, which is exactly why this note exists now.

## Bottom Line

Whole-character search stays active now.

Scoped windows are the next harness upgrade after we inspect the behavior of the expanded Mint probe set.
