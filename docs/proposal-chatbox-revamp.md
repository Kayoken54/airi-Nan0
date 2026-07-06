# Proposal: Chatbox Revamp

## 1. Overview & Phased Roadmap
The goal is to evolve the AIRI Chatbox from a standard chat interface into a **hybrid conversation workspace** by introducing a fixed top header for session controls and streamlining the bottom input area.

We will execute this in two phases:
* **Phase 1 (MVP)**: Focuses on the top header's session selector, token metrics, brain button, settings ellipsis menu, and inline composer action endcaps. (COMPLETED)
* **Phase 2**: Focuses on the Context Artifact Band optimizations (Memories and Media Gallery collapsible headers, responsive rows, and the creative `[+ Add]` imagine modal). (COMPLETED)

---

## 2. Fixed Top Header
The top header transitions from a static title label into a functional **Control Hub**.

### Completed Features
* **Word "AIRI"**: Placed on the left as a clean brand identifier.
* **Premium Session Selector**: A stylized, premium dropdown to switch chat sessions instantly. Displays message counts on the right endcap of each session.
* **Token Metrics Pair**: Displays both global usage metrics and per-session metrics side-by-side in the top-right corner.
* **Brain Button**: Promoted to the top right to easily change the active LLM (opens downwards).
* **Vertical Ellipsis Settings (`⋮`)**: Placed on the far right, allowing users to toggle the active **Send Key Mode** (`Enter`, `Ctrl + Enter`, `Double Enter`).

---

## 3. Context Artifact Band (Memories & Media Gallery)
To prevent the bands from dominating vertical space, we introduce collapsible headers with persistent local storage state.

### Layout & Responsiveness
* **Label Poetry**: Renamed "Memory Tokens" to **Memories** (which comprises Short-Term Memory, Long-Term Memory, and Journal Moments).
* **Collapsible Panels**:
  * Each panel ("Memories" and "Media Gallery") has a header row with the title on the left and action buttons on the right.
  * An **eye icon / collapse toggle** (`i-solar:eye-bold` or similar) sits on the header. Toggling it collapses the content carousel beneath it, leaving only the header.
  * **Persistence**: The collapse state is stored in `localStorage` under keys `airi:chat:memories-collapsed` and `airi:chat:media-collapsed`.
* **Breakpoints**:
  * **Desktop**: If not collapsed, side-by-side or wide layouts are supported.
  * **Portrait**: Splits into two distinct, stacked rows if both are visible.

### Action Hooks
* **Memories Header Actions**:
  * **`+ New` Button**: Opens the `JournalMomentModal` to let the user generate a journal entry from the conversation history.
* **Media Gallery Header Actions**:
  * **`+ Add` Button**: Positioned in the header next to the collapse toggle. When clicked, opens a prompt dialog asking: *"What would you like to imagine a picture of?"* It routes the prompt directly to the image generator to append a new scene to the gallery.
  * **`View All` Button**: Triggers the `StageBackgroundDialogPicker` (Stage Style/Background selection dialog).

---

## 4. Input Composer (Textarea)
The input composer integrates inline quick-actions directly inside the text box border to keep the layout tight.

### Completed Features
* **Inline Magic Wand (Suggest response)**: A transparent square button (`w-8 h-8 rounded-xl bg-neutral-200/20`) inline on the right to suggest responses.
* **Inline Send / Greet Button**: A solid primary square button (`w-8 h-8 rounded-xl bg-primary-600`) inline on the far right.
  * **Greet Mode**: Renders a waving hand icon (`i-ph:hand-waving-bold`) when history is empty and input is clear.
  * **Send Mode**: Renders a paper airplane (`i-solar:plain-2-bold-duotone`) when typing text.

---

## 5. Relevant Component & Data Store File Paths
Below are the key code locations to target during implementation:

### Component UI Files
* **Header/Main Host**: [InteractiveArea.vue](file:///Users/richardpinedo/Projects.nosync/airi/airi_dasilva333/apps/stage-tamagotchi/src/renderer/components/InteractiveArea.vue)
* **Chat Page**: [chat.vue](file:///Users/richardpinedo/Projects.nosync/airi/airi_dasilva333/apps/stage-tamagotchi/src/renderer/pages/chat.vue)
* **Journal Moment Modal**: [JournalMomentModal.vue](file:///Users/richardpinedo/Projects.nosync/airi/airi_dasilva333/packages/stage-ui/src/components/scenarios/chat/JournalMomentModal.vue)

### Data Stores
* **Session Store**: [session-store.ts](file:///Users/richardpinedo/Projects.nosync/airi/airi_dasilva333/packages/stage-ui/src/stores/chat/session-store.ts)
* **Character Card Store**: [airi-card.ts](file:///Users/richardpinedo/Projects.nosync/airi/airi_dasilva333/packages/stage-ui/src/stores/modules/airi-card.ts)
* **Text Journal Store**: [memory-text-journal.ts](file:///Users/richardpinedo/Projects.nosync/airi/airi_dasilva333/packages/stage-ui/src/stores/memory-text-journal.ts)

