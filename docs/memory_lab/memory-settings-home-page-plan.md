# Memory Settings Home Page Plan

## Purpose

Redesign the `Settings > Memory` landing page as a clear control center for the AIRI memory system.

This page should explain the memory stack, segment the major subsystems, and make the user immediately understand what each lane is responsible for before any deeper settings pages are opened.

This is a home page only.

Do **not** implement the subpages in this task.

## Design Goal

The page should feel like a deliberate product contract, not a placeholder settings screen.

It should answer four questions immediately:

1. What is memory here?
2. Why is it split into lanes?
3. What is active right now?
4. What can the user control later?

## Core Product Frame

Memory is character-centric.

The system is split into distinct lanes with different jobs, cadences, and budgets:

- Short-Term Memory
- Long-Term Memory
- Lifetime Archive
- Chips / LTMM Artifacts

The home page should present these as four separate control surfaces, not one merged settings blob.

## Visual Structure

Use a hub layout:

1. Top contract strip
2. Short explanatory intro
3. Four large memory lane cards in a 2x2 grid
4. Short footer explainer

### Top Contract Strip

This strip should contain 3-4 short status chips or labels such as:

- Character-centric
- Recent + durable
- Budgeted per lane
- Prototype stage

This gives the page a strong immediate identity.

### Intro Copy

Use one or two short paragraphs explaining that AIRI memory is segmented by purpose:

- recent context keeps the character current
- long-term memory preserves searchable durable facts
- the lifetime archive keeps relationship continuity across resets
- chips / LTMM artifacts preserve flavor and session texture

Keep this concise.

## The Four Lane Cards

Each card should include:

- a title
- a one-line purpose
- 3 key bullet points
- a review goal note
- one action button

### 1. Short-Term Memory

Purpose:

- recent daily context
- prompt injection for immediate continuity
- windowed and token-budgeted

Controls to preview on the card:

- window size
- token budget per block
- rebuild from recent history

Button:

- `Open Short-Term Memory`

### 2. Long-Term Memory

Purpose:

- durable archive
- character-scoped journal
- search-first retrieval

Controls to preview on the card:

- character filter
- search all memories
- synthetic LTMM experiment toggle

Button:

- `Open Long-Term Memory`

### 3. Lifetime Archive

Purpose:

- relationship-level continuity
- initial chunk build
- incremental daily updates
- diff chain and rebase lifecycle

Controls to preview on the card:

- initial chunk count
- daily increment mode
- diff depth
- rebase threshold
- final compression target

Button:

- `Open Lifetime Archive`

### 4. Chips / LTMM Artifacts

Purpose:

- visible output layer
- session flavor
- dream-run scheduling

Controls to preview on the card:

- flavor
- length
- max sessions per day
- trigger mode
- AFK / proactive gating

Button:

- `Open Artifacts`

## AFK Rule

AFK should be explained only in the `Chips / LTMM Artifacts` lane.

It does not belong as a primary concept on the other cards.

This is the only lane where proactive generation matters enough to need AFK gating as part of the explanation.

## Copy Tone

The page copy should be:

- clear
- direct
- technical but readable
- not overly lyrical
- not overly dense
- not generic settings boilerplate

The page should teach the user the memory model without making them read a spec.

## Recommended Card Copy

### Short-Term Memory

Recent context blocks that keep the character current.

### Long-Term Memory

Durable archive for searchable character memory and journal-like facts.

### Lifetime Archive

Relationship continuity that starts from a base build, then updates incrementally over time.

### Chips / LTMM Artifacts

Session-flavored outputs that can be triggered during idle or proactive windows.

## What To Avoid

Do not use:

- placeholder language like “mock data” in the main explanation
- vague prototype disclaimers as the primary framing
- a single merged memory card
- hidden complexity without a visible explanation
- subpage implementation in this task

## Product Reading

The page should feel like a system dashboard for memory:

- the user sees the lanes
- the user sees the purpose of each lane
- the user can reason about cadence and budget
- the user can later drill into one lane at a time

## Implementation Direction

The home page is the front door for the larger memory architecture.

It should be the place where the user learns:

- what each lane does
- when each lane runs
- why they are separate
- where the controls will eventually live

That is the product story the page should tell.
