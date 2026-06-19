# Personal Replay Eval Plan

## Purpose

This document defines the next product-facing evaluation phase for AIRI Memory Lab:

- replaying curated personal character data
- generating STMM, LTMM, chips, and mood artifacts
- reviewing those outputs against known character contracts

This is the point where the system begins to be judged less by benchmark abstraction and more by whether it can preserve the right vibes for real character variants.

## Why This Exists

The project now has:

- a curated personal dataset
- a growing artifact debugger
- character-specific expectations strong enough to judge output quality by feel, not only by score

That means we can move into a much more meaningful evaluation loop:

- replay a known character history
- generate memory artifacts
- inspect whether the artifacts sound right for that character

## Parent References

This plan should be read alongside:

- [personal-character-model-contracts.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/personal-character-model-contracts.md)
- [artifact-harness-and-product-eval-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/artifact-harness-and-product-eval-spec.md)
- [artifact-debug-script-handoff.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/artifact-debug-script-handoff.md)
- [memory-schema-and-lifecycle-spec.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/memory-schema-and-lifecycle-spec.md)
- [memory-lifecycle-and-features.md](C:/Users/h4rdc/Documents/Github/airi-memory-lab/docs/memory-lifecycle-and-features.md)

## Core Principle

The replay system should not be judged only on whether it produces coherent artifacts in general.

It should also be judged on whether those artifacts feel correct for the specific character being replayed.

This is character-faithfulness evaluation, not only artifact generation.

## Immediate Evaluation Targets

### First Character: `bunny-mint`

Why first:

- highest current turn count in the audit
- strong emotional and stylistic identity
- highly useful for judging warmth, intimacy, continuity, and artifact richness

What this character should stress-test:

- STMM warmth
- LTMM tenderness and first-person journal feel
- chips that feel affectionate, domestic, and relational rather than sterile
- continuity and ritual memory

### Second Character: `rick-sanchez`

Why second:

- highly distinctive personality
- very different from Mint-like warmth
- useful for checking whether the engine can preserve sharp tonal separation

What this character should stress-test:

- sarcastic or cynical flavor
- observational sharpness
- non-generic chips
- journal outputs that avoid collapsing into soft sentimental voice

## Required Prep Step: Exploded Dataset

Before serious replay evaluation, the current personal exports should be normalized into a cleaner, exploded dataset format.

The current exports are useful, but they are not the ideal ingest format for replay work.

We want a prep script that:

- reads current personal export files
- strips or skips unusable junk
- preserves timestamps and provenance
- avoids merging distinct characters
- writes clean per-character input folders

## Exploded Dataset Requirements

The exploded dataset should:

- be grouped per character
- be chronological
- preserve raw session/message order
- include STMM and LTMM source artifacts when available
- skip malformed, empty, or identity-less records
- avoid hidden normalization that erases character flavor

## Suggested Folder Shape

Suggested output under something like:

`datasets/personal_chats/exploded/`

Per character:

- `raw_sessions/`
- `stmm/`
- `ltmm/`
- `manifest.json`
- `notes.md` optional

Example:

- `datasets/personal_chats/exploded/bunny-mint/raw_sessions/...`
- `datasets/personal_chats/exploded/bunny-mint/stmm/...`
- `datasets/personal_chats/exploded/bunny-mint/ltmm/...`
- `datasets/personal_chats/exploded/bunny-mint/manifest.json`

## Manifest Expectations

Each per-character manifest should ideally include:

- character name
- character ID
- session count
- total turn count
- STMM count
- LTMM count
- date range
- source files used
- skipped records summary

## Replay Loop

The intended replay loop is:

1. choose one character
2. load that character's exploded dataset
3. ingest it through the memory pipeline
4. generate artifact outputs
5. review outputs against the character contract
6. adjust prompts or logic
7. rerun and compare

## Artifact Outputs To Review

At minimum for each replay:

- STMM blocks
- LTMM entries
- chips / pills / tags
- timeline file

If available:

- mood traces
- wake-up payload preview
- supporting evidence files

## Evaluation Questions

For each replay run, review:

### STMM

- does it preserve the right tone for the character?
- does it emphasize the right kinds of events and continuity?
- is it too generic or too clinical?
- does it feel like something that would genuinely help with wake-up continuity?

### LTMM

- does it sound like the right character in journal form?
- does it preserve first-person voice and emotional posture correctly?
- is it too sentimental, too flat, or too abstract?
- does it feel worth keeping as a durable memory artifact?

### Chips / Pills

- do they feel like this character's world?
- are they flavorful without becoming nonsense?
- are they too vague, too technical, or too slogan-like?
- would they fit naturally into the stream rail?

### Mood

- does the mood layer match the character's emotional logic?
- is it too generic across very different personalities?

## Character-Faithfulness Checks

The key test is not just:

- "is this good writing?"

It is also:

- "is this correct for bunny-mint?"
- "is this correct for rick-sanchez?"

This matters because a system that always produces one pleasing style is still failing if it cannot preserve strong personality separation.

## Success Criteria

This replay plan should be considered successful when:

1. the exploded data format exists and is usable
2. one character can be replayed cleanly end to end
3. artifact outputs are readable and chronologically organized
4. reviewers can judge the outputs against the character contract
5. reruns can be compared meaningfully after prompt or logic changes

## Non-Goals

This phase is not primarily about:

- benchmarking against LoCoMo
- maximizing retrieval score
- proving universal generalization

This phase is about:

- product-facing replay
- character-faithful artifacts
- useful evaluation loops for tuning

## Suggested Milestones

### Milestone 1: Data Explosion

- build the per-character exploded dataset
- verify `bunny-mint` folder is clean and complete

### Milestone 2: First Replay

- replay `bunny-mint`
- generate STMM / LTMM / chips / timeline
- perform first vibe review

### Milestone 3: Contrast Replay

- replay `rick-sanchez`
- compare artifact style separation against `bunny-mint`

### Milestone 4: Prompt / Logic Tuning

- adjust prompts or logic to improve character-faithfulness
- rerun and compare artifacts

## Risks

- the system may collapse distinct characters into one pleasing default tone
- the exploded dataset may accidentally normalize away useful flavor
- replay outputs may be coherent but not feel right for the target character
- some exported data may contain unusable or malformed records that need to be skipped

## Recommended Researcher Deliverables

The researcher working this phase should ideally produce:

1. a data-exploder script
2. a first `bunny-mint` replay run
3. a readable artifact output folder
4. a short review note describing whether the artifacts feel correct
5. a second replay for `rick-sanchez`

## Status

Status: Draft Plan

This document should guide the next replay/simulation phase and should be updated once the exploded dataset and first replay runs exist.
