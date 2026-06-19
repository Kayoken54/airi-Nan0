# Memory Schema And Lifecycle Spec

## Purpose

This document defines the intended memory object model and lifecycle rules for AIRI Memory Lab. The archive already references facts, events, session summaries, profile summaries, STMM, LTMM, DRMM, and plast-mem-style consolidation, but those ideas are not yet unified into one authoritative schema and lifecycle document.

This document is meant to establish that shared language now, even where implementation is incomplete.

This document should prioritize product truth and UX constraints over premature implementation detail. Schema mechanics remain researcher-owned unless product behavior is directly affected.

## Scope

This spec covers:

- memory record types
- required and optional fields
- authority and mutability
- ingestion outputs
- lifecycle actions
- contradiction handling
- consolidation

This spec does not fully define:

- retrieval behavior
- prompt formats
- production storage engine
- UI rendering

## Memory Design Goals

The memory system should support:

- literal factual recall
- temporal event tracking
- speaker and profile abstraction
- durable identity preservation
- update and contradiction handling over time
- benchmark experimentation without losing sight of production needs

It should also explicitly support a strong "wake up again" experience after chat reset, where the system feels caught up rather than blank.

## Core Principle

Not all memories are equal. The system should distinguish:

- what happened
- what is currently believed
- what was observed verbatim
- what was summarized
- what is sacred and should not be rewritten

Some product rules are already settled:

- manual journal entries are sacred
- LTMM entries are protected
- STMM recap blocks are protected
- raw chat logs are not sacred and may be deleted by the user

## Record Families

The archive implies at least five major families of memory records.

### 1. Fact Records

Purpose:

- capture atomic, answer-friendly durable claims

Examples:

- preference
- identity
- relationship
- stable background fact

### 2. Event Records

Purpose:

- capture time-bounded happenings, episodes, or transitions

Examples:

- a trip
- a breakup
- a move
- a conversation topic anchored in time

### 3. Session Summary Records

Purpose:

- capture a compact narrative gist of one session

Examples:

- the overall arc of a conversation
- notable themes
- high-level interaction tone

### 4. Profile Summary Records

Purpose:

- capture a durable speaker-level or entity-level abstraction

Examples:

- personality sketch
- persistent interests
- recurring social or behavioral patterns

### 5. Journal / Sacred Records

Purpose:

- preserve high-authority manual or user-authored content that should not be overwritten by automatic synthesis

Examples:

- LTMM entries
- user-affirmed identity notes
- curated character journals

Product constraint:

- these are immutable by design
- they should not be edited or deleted by automated memory processes
- manual journal entries are considered the most sacred class currently identified in the archive
- curated or derived long-term entries may still be acceptable if they are presented as proper journal-style entries and do not violate the sacred append-only expectation once written

## Proposed Unified Field Model

Every record should have a minimal common envelope.

Required common fields:

- `record_id`
- `kind`
- `fact` or equivalent canonical content field
- `source_session`
- `timestamp`
- `confidence`
- `synthetic`

Recommended shared metadata:

- `observed_text`
- `subject`
- `room`
- `temporal_marker`
- `resolved_date`
- `who`
- `what`
- `where`
- `why`
- `embedding`
- `provenance`
- `status`

## Record-Type Expectations

### Fact

Recommended characteristics:

- short
- canonical
- answer-friendly
- semantically clean for embedding

### Event

Recommended characteristics:

- time-aware
- session-linked
- capable of timeline placement

### Session Summary

Recommended characteristics:

- compact
- theme-rich
- restrained from unsupported inference

### Profile Summary

Recommended characteristics:

- cumulative
- conservative
- grounded in repeated evidence

### Sacred / Journal

Recommended characteristics:

- immutable at the content layer
- citable by derived layers
- clearly marked as high authority

## Authority Model

One missing piece in the archive is authority ordering. The system needs one.

Proposed default authority tiers:

1. User-authored or manually curated journal records
2. Explicitly observed and repeated fact records
3. Event records with strong provenance
4. Session summaries
5. Profile summaries
6. Derived or speculative abstractions

Higher-authority records should be harder to overwrite and easier to cite.

Current product-facing rule:

- manual journal content outranks derived memory
- protected recap layers outrank ordinary synthesized interpretation
- raw chat logs are operational input, not sacred memory

## Lifecycle Stages

The current archive mostly covers ingestion and retrieval. A full memory system needs explicit lifecycle stages.

Proposed lifecycle:

1. Observe
2. Extract
3. Normalize
4. Store
5. Reinforce
6. Update
7. Invalidate or supersede
8. Summarize
9. Consolidate
10. Retire or decay where appropriate

Lifecycle rules must preserve the distinction between:

- protected memory artifacts that persist as authored or recorded
- raw conversational material that may be deleted by the user
- derived memory that may evolve as the system learns

## Lifecycle Actions

### New

Create a new record when evidence does not match an existing durable memory.

### Reinforce

Increase confidence or importance when the same fact is observed again.

### Update

Revise the current believed state when a durable fact changes over time.

### Invalidate

Mark a previous belief as no longer current while preserving historical truth.

### Supersede

Link an outdated record to a newer canonical replacement.

### Summarize

Compress multiple lower-level records into a higher-level synthetic artifact.

## Contradiction Handling

This is one of the most important unresolved gaps.

The system should avoid the naive append-only pattern where contradictory memories simply accumulate with no status semantics.

Proposed contradiction policy:

- do not delete historical records by default
- distinguish "was true then" from "is true now"
- let event records preserve timeline truth
- let fact records track current canonical belief
- use supersession links where the same attribute changes

Example pattern:

- old preference record remains historical
- new preference record becomes current
- profile summary updates to reflect the current state
- session summary remains historically fixed

Product constraint:

- protected memory layers should never be silently rewritten in place
- if beliefs evolve, the system should update derived understanding without pretending earlier protected records changed

## Temporal Semantics

Temporal handling should not be treated as optional metadata. It is central to memory validity.

Recommended temporal fields:

- raw mention via `temporal_marker`
- normalized anchor via `resolved_date`
- source session timestamp
- recency score or recency bucket if needed

## Deep Dives

### Deep Dive: STMM / LTMM / DRMM

The archive already names:

- STMM as recent short-term summaries
- LTMM as sacred long-term journals
- DRMM as derived dream or consolidation output

These can be mapped into the schema as storage tiers, not only UI concepts.

Suggested interpretation:

- STMM: ephemeral recap-oriented records
- LTMM: immutable high-authority journal records
- DRMM: dynamic derived semantic memory and episodes

The current product direction adds a sharper role for STMM:

- STMM exists primarily to support context reload after the user clears chat history
- when a new session starts after reset, the system should inject the last configured window of STMM recap blocks
- this injection is not only archival; it is meant to help the character wake up with continuity

The current product direction also adds a sharper role for long-horizon memory during reload:

- context reload should eventually include not just recent STMM blocks
- it should also include selected high-quality long-horizon facts, tags, or distilled cues about the user
- the goal is a better "waking up again" moment, not just a recap dump
- the ideal reload shape is two-part rather than one undifferentiated blob:
  - recent STMM recap blocks
  - separate high-value long-horizon continuity cues

### Deep Dive: UI Surface Implications

The current UI prototypes already imply that memory is not purely a backend concern.

Observed product shape from current screens:

- STMM is rendered as visible daily recap blocks
- LTMM is rendered as an append-only journal archive with lookup
- the live chat window already includes a lower strip that mixes recap-style blocks with image artifacts

This suggests the schema and lifecycle model should support not only large text blocks but also smaller chronological memory artifacts.

The current product direction is:

- STMM should eventually include visible semantic chips, tags, or pills alongside and between daily blocks
- those chips should accumulate chronologically as they are computed
- the memory strip in chat should become a mixed rail of recap blocks, semantic tags, and other lightweight artifacts rather than only large homogeneous cards
- current oversized STMM recap cards may eventually be collapsed into more compact date-first artifacts
- LTMM journal cards may also become narrower if needed to make room for denser semantic chips
- the preferred direction is greater density and flow across the rail, not preserving large recap cards at all costs

### Deep Dive: Facts vs Episodes

The benchmark code and reference architectures suggest a split between episodic and semantic memory. This doc adopts that distinction as first-class:

- event and session-summary records are episodic-leaning
- fact and profile-summary records are semantic-leaning

The system may still store them in one database, but the lifecycle rules should treat them differently.

## Considerations

- overly aggressive synthesis can erase provenance
- append-only memory is easier to implement but becomes noisy
- profile summaries are powerful but risky when evidence is thin
- immutable journals create authority but can conflict with later derived beliefs if not linked carefully
- not every benchmark artifact should become a permanent production memory type
- wake-up continuity is a product surface, not just a memory-engine side effect
- recap injection should help orientation without becoming bloated, robotic, or repetitive
- long-term derived memory may be useful, but only if it feels like a legitimate journal artifact rather than an opaque machine fact dump
- the memory UI is already evolving toward mixed artifact presentation, so lifecycle design should not assume every memory surface is a paragraph block
- the rail should optimize for chronological flow and semantic richness, even if that means compressing traditional STMM or LTMM card layouts

## Pending Decisions

- Should events and facts be separate `kind` values in every implementation?
- What exact fields are mandatory for profile summaries?
- How should confidence be updated when evidence is repeated?
- Should contradictions create new records, or mutate old ones plus history links?
- Should sacred records be searchable the same way as derived records?
- Which records are allowed to decay or be archived out of the main retrieval path?
- How should invalidated records be exposed to the answer model, if at all?

## Open Problems

- the system does not yet have a final canonical schema across benchmark and app tracks
- update and invalidate behavior is described more than implemented
- identity and preference change over time remains under-specified
- memory importance, decay, and recency policies are still largely conceptual

## Proposed Minimum Next Step

Even before full lifecycle engineering, the archive should converge on:

- stable `kind` values
- shared required fields
- current vs historical state semantics
- supersession links for changed facts
- authority tags for manually curated memories

The following product constraints should now be treated as settled enough for the archive:

- manual journals are sacred and immutable
- LTMM and STMM should not be overwritten by automated processes
- raw chat logs may be deleted by the user
- STMM is a core reload artifact
- reload context should eventually combine recent STMM with selected high-value long-horizon memory cues
- LTMM may contain curated derived entries if they are expressed as proper first-person journal entries
- LTMM trust hierarchy should remain mostly invisible to the user rather than explained explicitly in the UI
- semantic retrieval may query across all indexed memory layers behind one search experience rather than forcing the user to choose layers manually
- STMM should eventually support chronological semantic chips or pills between recap blocks
- the live chat memory strip should support a mixed sequence of larger memory blocks and smaller semantic artifacts
- STMM recap cards may be visually compressed to free space for higher-density semantic chips
- LTMM journal entries may become narrower so the feed can hold a denser mix of artifact types

## Status

Status: Draft

This should become the authoritative schema reference before any major production memory migration or large-scale consolidation work.
