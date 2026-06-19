# Run Timing Audit

## Purpose

This document audits benchmark runtime data across the archived AIRI Memory Lab runs.

The goal is speed, not perfect reconstruction. Some runs were documented well and include explicit total duration. Others only preserve partial ingestion timings or informal notes. This file separates those cases so the archive is still useful without pretending the missing data exists.

## Scope

This audit is based on timing data found in:

- `test_results/run_*.txt`
- `test_results/run14b.txt`
- `test_results/run_2026-*.txt`
- selected notes in `docs/chatgpt-pro-chatlog.md`

This is an audit of what is documented, not a reconstruction from source code.

## Summary

Known total run durations currently span from roughly **53 minutes** to **186 minutes** for runs with explicit completion time recorded.

Broad observed spread:

- fastest documented full run: **Run 13 at 53.35 minutes**
- slowest documented full run: **Run 16 at 186.48 minutes**
- common documented range for many stronger runs: roughly **70 to 140 minutes**

Important caution:

- faster is not always better
- some of the fastest runs were unstable, broken, cached, or otherwise not trustworthy
- some slower runs were doing heavier orchestration, more summaries, or more reasoning passes

## Confirmed Total Durations

These runs have explicit full-run duration captured in the archived result files.

| Run | File | Duration | Notes |
| :--- | :--- | :--- | :--- |
| 5 | `test_results/run_5.txt` | 70.58 minutes | Gemini / signal-over-gate baseline after Run 4 regression. |
| 6 | `test_results/run_6.txt` | 58.61 minutes | Great Merger era; notably fast relative to output quality. |
| 7 | `test_results/run_7.txt` | 78.93 minutes | ChatGPT sandbox run with explicit benchmark-finished line. |
| 8 | `test_results/run_8.txt` | 104.73 minutes | Gemini / plast-mem-influenced track. |
| 9 | `test_results/run_9.txt` | 79.57 minutes | Run file contains the same completion line twice. |
| 11 | `test_results/run_11.txt` | 128.93 minutes | Heavy synthesis-oriented Gemini run. |
| 12 | `test_results/run_12.txt` | 141.40 minutes | Full duration recorded, but limited detail in the artifact. |
| 13 | `test_results/run_13.txt` | 53.35 minutes | Fastest documented full run, but this run is historically known as broken. |
| 14 | `test_results/run_14.txt` | 118.91 minutes | Gemini 5W / detective era. |
| 14B | `test_results/run14b.txt` | 111.62 minutes | Hardened follow-up to 14A. |
| 15 | `test_results/run_15.txt` | 136.05 minutes | ChatGPT over-integrated / abstract-heavy run. |
| 16 | `test_results/run_16.txt` | 186.48 minutes | Slowest documented run; heavy Ultimate Hybrid orchestration. |

## Timestamped Duplicate / Alternate Artifacts

These appear to duplicate named run artifacts or capture the same run under a timestamped filename.

| File | Duration | Likely Match |
| :--- | :--- | :--- |
| `test_results/run_2026-04-10T22-42-39-463Z_gemini.txt` | 118.91 minutes | Likely same result family as Run 14. |
| `test_results/run_2026-04-11T03-29-00-292Z_gemini.txt` | 111.62 minutes | Likely same result family as Run 14B. |

These should not be counted as separate benchmark runs unless a later audit proves they represent distinct executions.

## Partial Timing Only

These runs do not currently have a clearly captured total completion time in the archive, but they do preserve some timing information.

### Run 3

Observed in `test_results/run_3.txt`:

- session-level extraction timings are present
- examples include:
  - session 1: 53.9s
  - session 2: 31.7s
  - session 3: 21.3s

Missing:

- no explicit full-run duration line found in the current artifact

### Run 4

Observed in `test_results/run_4.txt`:

- session-level ingestion timings are present
- examples include:
  - session 1: 197.1s
  - session 8: 190.4s
  - session 17: 165.8s

Missing:

- no explicit full-run duration line found in the current artifact

### Early Runs 1 And 2

Observed in `test_results/run_1.txt` and `test_results/run_2.txt`:

- score tables are preserved

Missing:

- no explicit duration line found
- no detailed ingestion timing found in the current archived files

### Run 10

Observed in `test_results/run_10.txt`:

- the file exists and contains benchmark detail

Missing:

- no explicit total runtime was surfaced by this audit pass

This file should be revisited in a deeper pass if Run 10 timing matters.

## Informal Timing Clues From Notes

The chat log and notes also preserve some non-canonical but still useful timing clues.

Examples:

- `docs/chatgpt-pro-chatlog.md` records an **average extraction time of ~50s per session** for Run 5.
- Run 6 was described as roughly **40s per session** in notes during ingestion.
- early ChatGPT sandbox runs were repeatedly described as **2x-3x slower** than leaner Gemini-style tracks.
- the benchmark history doc explicitly notes that one ChatGPT sandbox phase imposed an added **18-minute cost**.

These notes are useful directional signals, but they should not replace explicit run-duration data.

## Timing Spread By Style

Even with incomplete documentation, a broad pattern is visible.

### Faster / Leaner Runs

Examples:

- Run 6 at 58.61 minutes
- Run 5 at 70.58 minutes
- Run 9 at 79.57 minutes

Common traits:

- less orchestration than the heaviest ChatGPT paths
- more bounded retrieval and prompting
- stronger attention to speed / practicality

### Mid-Weight Runs

Examples:

- Run 8 at 104.73 minutes
- Run 14 at 118.91 minutes
- Run 14B at 111.62 minutes
- Run 11 at 128.93 minutes

Common traits:

- heavier extraction or synthesis
- more structured reasoning
- more expensive temporal / inference handling

### Heavyweight Runs

Examples:

- Run 15 at 136.05 minutes
- Run 12 at 141.40 minutes
- Run 16 at 186.48 minutes

Common traits:

- heavier orchestration
- more structured generation stages
- more brittle normalization or synthesis in some cases
- higher risk that added runtime does not translate into proportional product value

## Important Caveats

- Run 13 is the fastest documented full run, but it is historically a broken run and should not be used as a speed target.
- Run 15 contains suspiciously tiny ingestion timings for many sessions, likely due to caching or logging behavior rather than true cold-run extraction speed.
- Some runs may mix cold-run and warm-cache behavior.
- Some runs may record extraction timings but not the true end-to-end wall-clock cost equally.

## Recommended Use

Use this file to answer:

- which runs were operationally cheap or expensive
- what rough runtime spread exists across flavors
- whether a new research direction is plausibly too slow for production

Do not use this file to answer:

- which run is best
- which run should ship
- whether a run is valid without reading its quality and stability notes

## Recommendations For Future Documentation

Every future run artifact should record, at minimum:

- total wall-clock duration
- ingestion duration
- evaluation duration
- average session extraction time
- average question-answer time
- whether the run was cold-cache or warm-cache

Optional but high value:

- per-stage breakdown
- model-loading overhead
- summary-generation overhead
- normalization / synthesis overhead

## Proposed Next Step

If the team wants a tighter timing history later, the next pass should:

1. inspect `run_10.txt` manually for any hidden timing lines
2. backfill missing early-run timing from shell history or chat notes where possible
3. add a standard runtime header to all future result files

## Status

Status: Draft Audit

This document should be updated whenever new run artifacts land or older missing durations are recovered.
