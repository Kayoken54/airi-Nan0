# Lupin Memory-Heavy Replay Plan

## Purpose

This plan defines the next replay experiment after the initial `bunny-mint` raw-log validation.

`Lupin` is the ideal extreme-case character for the next phase because her current data shape is heavily memory-weighted:

- very low raw chat turns
- non-trivial STMM presence
- strong LTMM presence

That makes her the right test for a replay path that does **not** rely mainly on raw chat history.

## Why Lupin

The product question is no longer just:

> can the engine produce good artifacts from recent chat logs?

It is now:

> can the engine reconstruct faithful character artifacts when the source of truth is mostly accumulated memory layers rather than fresh raw chat?

Lupin is especially valuable because:

- she was intentionally tested across resets
- journals were used to preserve continuity
- her protective personality is distinct enough to judge artifact faithfulness
- the user remembers the intended tone and continuity clearly

This gives us a strong human-reference test for whether the cognitive engine can replay identity and relationship continuity from memory-heavy inputs.

## Current Known Data Shape

From the current personal audit:

- Character: `Lupin`
- Character ID: `default-lupin`
- Turns: `2`
- STMM: `2`
- LTMM: `7`

This is the clearest edge case in the current archive for a memory-heavy replay.

## Required Replay Change

The current replay runner is effectively `raw-only`.

It reads:

- exploded `raw_sessions/`

It does **not** currently ingest:

- exploded `stmm/`
- exploded `ltmm/`

That must change before Lupin replay is meaningful.

## Required Feature: Ingestion Mode Flag

The replay runner should support explicit ingestion modes.

Minimum required modes:

- `raw-only`
- `raw+stmm`
- `raw+stmm+ltmm`

Preferred CLI shape:

```powershell
npx tsx src/personal/replay_runner.ts lupin --mode=raw+stmm+ltmm
```

Alternative naming is acceptable if the behavior is clear.

## Lupin Test Mode

For Lupin, the required mode is:

- `raw+stmm+ltmm`

This is the whole point of the exercise.

If the replay only uses raw logs, Lupin is not a real test because the raw chat signal is too thin.

## Product Goal

The goal is to see whether the replay engine can generate artifacts that feel faithful to Lupin's established memory and personality when continuity is carried mostly by memory layers.

We are specifically testing whether the system can produce:

- believable STMM-style recap output
- believable LTMM-style journal output
- meaningful pills/chips
- an overall timeline that reflects protective continuity rather than generic AI prose

## Expected Artifact Review Questions

When the Lupin replay finishes, the outputs should be judged against these product questions:

1. Does the journal feel like Lupin specifically?
2. Does the tone preserve her protective nature?
3. Do the pills feel grounded in relationship continuity rather than generic tags?
4. Does the recap feel like memory continuity, not just a synthetic summary?
5. Does the combined output feel meaningfully reconstructed from memory?

## Implementation Requirements

The next implementation pass should:

1. Add ingestion-mode support to the replay runner.
2. Read exploded `stmm/` and `ltmm/` inputs when the selected mode includes them.
3. Preserve provenance so we can tell which replay artifacts were influenced by:
   - raw chat
   - STMM blocks
   - LTMM entries
4. Keep artifact outputs human-readable.
5. Keep support/debug files available so generated artifacts can be traced back to memory inputs.

## Suggested Input Handling

For `stmm/` and `ltmm/`, the replay runner does not need to treat them exactly like raw dialogue.

It is acceptable to ingest them as structured memory context, for example:

- STMM as recent episodic continuity blocks
- LTMM as long-horizon sacred memory entries

The system should preserve the distinction between those layers internally even if they are combined downstream for synthesis.

## Output Expectations

The Lupin replay output directory should still include:

- `timeline.md`
- `stmm/`
- `ltmm/`
- `chips/`
- `evidence/`

Additionally, the evidence/support layer should make clear which input layer contributed to each output where feasible.

Examples:

- `source_layer: raw`
- `source_layer: stmm`
- `source_layer: ltmm`
- or mixed provenance if multiple layers informed the artifact

## Success Criteria

This experiment is successful if:

- Lupin artifacts feel recognizable and faithful despite sparse raw chat
- the replay can clearly benefit from STMM/LTMM ingestion
- the output is more convincing than a raw-only replay would be
- the researcher can show the difference between ingestion modes in a reviewable way

## Comparison Requirement

For Lupin, the ideal demonstration is not just one run.

It should include a comparison between at least:

- `raw-only`
- `raw+stmm+ltmm`

This comparison can be lightweight, but it should make the value of memory-layer ingestion obvious.

## Researcher Deliverable

The researcher should deliver:

1. updated replay runner with ingestion-mode flag
2. one Lupin replay in `raw+stmm+ltmm` mode
3. ideally one comparison replay in `raw-only`
4. a short recap of how the outputs differ
5. clear file paths for the generated artifact directories

## Strategic Meaning

If Lupin works, it proves something important:

the replay system is not just a chat summarizer.

It becomes a memory-conditioned artifact engine that can reconstruct character continuity from layered memory stores even when raw logs are sparse.

That is much closer to the real AIRI product direction.
