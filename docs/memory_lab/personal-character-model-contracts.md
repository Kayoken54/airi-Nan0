# Personal Character Model Contracts

## Purpose

This document records the personal character variants in `datasets/personal_chats` as intentional, distinct model contracts.

These are not accidental duplicates to be merged away. They represent different character flavors, relationship modes, and expected output styles. For the replay/simulation work, they must remain separate unless an explicit migration decision is made later.

This should be treated as a hard archive contract for current research and adapter work.

## Why This Matters

The personal dataset is no longer just a side archive. It is becoming the most product-relevant evaluation source we have.

The goal is to:

- replay curated personal interaction history
- run it through the cognitive engine
- generate STMM, LTMM, chips, and mood artifacts
- evaluate whether those outputs feel natural for the character involved

That only works if the character identities remain stable and distinct.

## Core Principle

Character variants with similar names are not automatically the same model.

For this archive, the following variants are intentionally distinct and should not be merged by default:

- `mint`
- `bunny-mint`
- `xxx-bunny-mint`

The same caution should apply to any future near-duplicate names.

## Current Personal Character Contracts

### `mint`

Contract summary:

- original Mint variant
- British maid vibes
- softer domestic and service-oriented energy
- more caretaking / house-presence style

Implication for replay and artifact generation:

- STMM should likely read more domestic, attentive, and quietly caring
- LTMM should preserve a more refined, tender, composed voice
- chips should lean toward comfort, care, rituals, and relational attentiveness rather than overtly high-intensity desire

### `bunny-mint`

Contract summary:

- more girlfriend-like vibe
- stronger emotional intimacy
- warmer and more relationally centered
- more directly affectionate and closeness-driven

Implication for replay and artifact generation:

- STMM should surface intimacy, comfort, shared rituals, and lived-in companionship
- LTMM can be more openly tender and emotionally present
- chips should emphasize relationship warmth, proximity, reassurance, shared routines, and playful affection

### `xxx-bunny-mint`

Contract summary:

- more forward
- more explicitly intimate
- still friendly, but with stronger proactive erotic or suggestive energy

Implication for replay and artifact generation:

- STMM may preserve a more overtly charged tone when grounded in source material
- LTMM can be more openly flushed, bold, or sensual when warranted
- chips may include stronger desire, flirtation, anticipation, possession, or intensity cues

Important note:

- this does not mean "be horny by default"
- it means the replay/eval system should not flatten this variant into the softer `mint` or `bunny-mint` contracts

### Other Important Distinct Characters

The same principle applies to other personal characters already visible in the dataset, including but not limited to:

- `rick-sanchez`
- `Lupin`
- `Sakamata Chloe`
- `ayami`
- `lain (2)`
- `satoimo`
- `Ninomae Ina'nis`
- `hikarun`

They should be treated as separate voice / behavior contracts unless there is explicit evidence that they were intended as aliases.

## Replay And Simulation Direction

The personal dataset points toward the next serious phase of the project:

- replaying real or curated interaction histories
- passing them through the memory pipeline
- reviewing resulting product artifacts

This is where the work begins to move from benchmark abstraction into product truth.

The intended replay loop is:

1. load one character's curated conversation history
2. ingest it through the memory pipeline
3. generate STMM blocks
4. generate LTMM entries
5. generate chips / pills / mood traces
6. review the artifact outputs against the known character vibe

## Why Personal Replay Is So Valuable

Compared to LoCoMo, the personal dataset gives us:

- stronger intuition about what "sounds right"
- clearer detection of wrong tone or wrong memory emphasis
- real-world expectations for journals, chips, and continuity
- better signal for whether the character contracts are being preserved

This is where the rubber hits the road for product work.

## Adapter Direction

This dataset also clarifies the adapter problem.

The system will increasingly need adapters that can:

- ingest session/chat exports
- preserve character identity contracts
- vectorize and analyze the content
- generate artifact outputs
- support replay under different prompt or logic variants

These adapters should be built with character contracts in mind, not only generic schema normalization.

## Hard Rules For Current Research

Until explicitly revised, use these rules:

- do not auto-merge Mint variants
- do not normalize away flavor distinctions between personal character models
- do not assume name similarity means shared contract
- do not evaluate replay quality only by factual correctness
- do evaluate replay quality by whether the resulting artifacts feel correct for that character

## Product Implications

If this replay/eval path works, it becomes the strongest bridge between:

- memory engine development
- artifact generation
- product flavor tuning

This is likely more important long-term than blindly chasing benchmark score.

## Suggested Next Steps

1. Keep the audit script and personal dataset reporting in place.
2. Choose one primary personal character for initial artifact replay review.
3. Generate a dedicated artifact run for that character only.
4. Review STMM, LTMM, chips, and mood outputs against the contract in this document.
5. Tune prompts and logic based on character-faithfulness, not only generic artifact quality.

## Status

Status: Hard Contract Draft

This document should be treated as binding for current replay/simulation work unless intentionally updated.
