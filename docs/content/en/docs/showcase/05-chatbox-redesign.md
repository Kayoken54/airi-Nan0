# Chatbox Redesign

![Chatbox Redesign](/showcase/hero-05-chatbox-redesign.avif)

The main conversation workspace has been completely re-architected into a three-column layout where navigation, conversation, and context sidebars are separated into dedicated surfaces that never compete for screen space. A sliding left sidebar acts as the primary navigation hub — switch between Chat Messages, Studio Monitor, World Bible, Media Library, and Settings. On mobile, it operates as a responsive overlay drawer.

The right context panel displays Memory Cards (Echo chips, daily summaries, journal entries) and a lazy-loading Media Gallery in a unified collapsible header bar. A centered session switcher and quick LLM selector ("Brain Popover") sit in the titlebar. Naked-on-idle premium button styling keeps the interface clean, revealing hover states only on cursor movement.

The chat UX is packed with enrichments: real-time spoken highlights use the CSS Custom Highlight API to show the exact sentence being uttered without any DOM thrashing. Mood tags like `[happy]` or `[sad]` color-code chat bubbles with background tints and border glows. Screenplay actor formatting adds high-contrast dynamic chips with actor-aware colored text. Both user and assistant messages are inline-editable. Draft autosave preserves typed text across restarts. Timeline management lets you Fork & Switch, Trim Timeline, or Delete Following directly from the message action menu.

## Key Capabilities

- Three-column workspace: left nav, center chat, right context panel
- Centered session switcher and Brain Popover in the titlebar
- Real-time spoken highlights via CSS Custom Highlight API (zero DOM thrashing)
- Mood tags with color-coded chat bubbles
- Screenplay actor formatting with dynamic chips
- Inline editing for both user and assistant messages
- Draft autosave, configurable send key, context meter
- Timeline management: Fork & Switch, Trim Timeline, Delete Following
- Caption system with colored segments and actor-aware tracking

> See the [full feature breakdown](/en/docs/chronicles/feature-report#21-chatbox-redesign) in the Feature Report.
