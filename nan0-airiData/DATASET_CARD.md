# Dataset Card

## Identity and status

- Name: Nan0 Collaboration Export
- Version: `0.1.0-candidate`
- Created: `2026-07-18T18:03:43Z`
- Repository branch: `main`
- Repository HEAD: `6cfa8a26aff1b8165175fa1ff20e601ed2f45fc4`
- Extraction/validator script version: `1.0.0`
- Manual-review status: required; Kyo has not granted final approval
- License status: private collaboration material; terms require Kyo's final approval

## Purpose

This package provides a small, inspectable reference for Nan0's outward conversational character and safe behavioral mechanisms: continuity, uncertainty, refusal, attention, silence, goals, pending intentions, lived time, and autonomous expression.

It is not a complete training corpus, not a personality specification, and not a dump of Nan0's internal state.

## Scope and sources

Source categories were local persisted outward conversation, categorical timeline/decision/attention/goal/intention/temporal records, Nan0 runtime source and tests, and approved architecture documentation. Electron paths are redacted. No consented Discord export or Nan0 Observatory JSONL file was present. Journal stores were found but not opened because no journal entry was individually approved.

The source inventory was created before extraction. The local state was live and advanced during the audit; the manifest records both the inventory snapshot and the later safe-evidence snapshot instead of silently rewriting history.

## Provenance classes

- `REAL_PUBLIC`: authentic outward dialogue with no substantive rewrite.
- `SANITIZED_REAL`: authentic outward dialogue or categorical runtime evidence after minimal, documented privacy removal.
- `SYNTHETIC_DERIVED`: newly written, non-historical material based only on verified outward behavior or public mechanisms.

Synthetic material is never represented as an event that actually happened. Every synthetic record sets `historicalClaim` to `false`.