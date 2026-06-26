# Architectural Specification: Prefix Cache Alignment & Prompt Compilation Controls

This document outlines the standard for **Prefix Cache Alignment** across AIRI subsystems. It details the design of a DRY context-builder utility, global performance settings, and per-turn context overrides to minimize LLM latency/costs while maintaining fine-grained control over character memory.

---

## 1. The Core Caching Problem

For modern LLM providers supporting prefix caching (such as DeepSeek, OpenRouter, and Gemini), input prompts are cached sequentially starting from the first token.

1. **Prefix Invalidation**: Any dynamic tokens injected early in the sequence (e.g. active window titles, system load, or timestamps placed *above* the conversation history) completely invalidate the cache for everything following them.
2. **Context Count Mismatches**: Slicing the chat history to different lengths (e.g. 6 messages for proactivity, 15 for suggestions, and all messages for journaling) creates distinct context structures, preventing them from sharing cache hits.
3. **Optimized Layout**: To maximize cache reuse across different features, we must position the static system prompt and stable conversation history at the beginning (prefix) of the input array, and push volatile sensor telemetry and instructions to the absolute end (tail).

```
[System Prompt] -> [Sensor Data (Deltas)] -> [Conversation History] ❌ INVALIDS CACHE ON EVERY HEARTBEAT
[System Prompt] -> [Conversation History] -> [Tail/Sensor Telemetry] ✅ CACHE HITS SECURED
```

---

## 2. Subsystem Audit & Context Profiles

We have identified 4 distinct prompt-compilation flows that build overlapping context arrays.

### A. Proactivity Heartbeat
* **Path:** [proactivity.ts](file:///Users/richardpinedo/Projects.nosync/airi/airi_dasilva333/packages/stage-ui/src/stores/proactivity.ts#L540-L602)
* **Default Context:** Historical context (typically recent messages) paired with volatile telemetry (CPU load, active windows, idle seconds).
* **Caching Strategy:** Must leverage **Global Performance Controls** directly. It does not warrant its own settings panel or character-level controls. Volatile telemetry must be appended as a suffix block at the tail.

### B. Destiny 2 Event-Driven OCR Loop
* **Path:** [proposal-destiny2-plugin.md](file:///Users/richardpinedo/Projects.nosync/airi/airi_dasilva333/docs/proposal-destiny2-plugin.md)
* **Default Context:** Tactical officer system prompts, active game state telemetry (HUD crop text recognition), and chat history.
* **Caching Strategy:** Will leverage **Global Performance Controls** directly. Building dedicated plugin-level caching controls would introduce unnecessary complexity. Game telemetry crops are appended at the tail of the message array.

### C. Producer Lite (Reply Suggestion Generator)
* **Path:** [use-producer.ts](file:///Users/richardpinedo/Projects.nosync/airi/airi_dasilva333/packages/stage-ui/src/composables/use-producer.ts#L151-L222)
* **Default Context:** Reconstructs the system prompt, environment sensors, chat transcript, and generating instructions.
* **Caching Strategy:** Requires **Per-Turn Controls**. The user must be able to override global defaults on a turn-by-turn basis to define whether suggestions use the full session history or slice to the last $X$ turns.

### D. Journal Moments
* **Path:** [memory-text-journal.ts](file:///Users/richardpinedo/Projects.nosync/airi/airi_dasilva333/packages/stage-ui/src/stores/memory-text-journal.ts#L431-L501)
* **Default Context:** Active character system prompt, environmental context, and chat history.
* **Caching Strategy:** Requires strict **Per-Invocation Controls**. The user must be able to specify the exact history scope for the journal entry (e.g. journaling about the last narrative arc/last $X$ turns vs. summarizing the entire conversation history) to prevent the character from losing focus or drifting into unrelated historical details.

### E. VLM "Forward to LLM" Pipeline
* **Path:** [chat.ts](file:///Users/richardpinedo/Projects.nosync/airi/airi_dasilva333/packages/stage-ui/src/stores/chat.ts)
* **Default Context:** When forwarding is enabled, user message history and the image are sent to the VLM to produce a description.
* **Caching Strategy:** Will benefit from prefix cache alignment by placing the conversation history cleanly at the prefix so that repeated images/messages with identical history prefix cache hits are maximized, and volatile prompt-shims or instructions are kept at the tail.

---

## 3. Global LLM Performance Configurations

To govern default behavior for automated subsystems (Proactivity and Destiny 2) and act as a fallback for user-facing features, we introduce a new global settings store: `useSettingsLlmPerformance`.

### Store Schema (`packages/stage-ui/src/stores/settings/llm-performance.ts`)
```typescript
export interface LlmPerformanceSettings {
  prefixCacheAlignment: boolean // Aligns prompt segments to maximize prefix cache hits
  globalHistoryMode: 'full' | 'slice' // Default history scope
  globalSliceCount: number // Default message count when slicing (defaults to 6)
}
```

### Settings UI Mockup
This panel will be placed under **Settings > Behavior > LLM Performance**:
```
┌────────────────────────────────────────────────────────┐
│  LLM Performance & Cache Alignment                    │
│                                                        │
│  [X] Enable Prefix Cache Alignment                     │
│      Re-orders prompt segments (system -> history ->    │
│      telemetry) to optimize prefix cache hits.         │
│                                                        │
│  Default Conversation History Scope:                   │
│  ( ) Slice last [ 6  ] messages (Saves output tokens)  │
│  (X) Full History (Maximizes character context memory) │
└────────────────────────────────────────────────────────┘
```

---

## 4. The Unified Prefix Builder Utility (`useContextBuilder`)

To dry up context assembly across the four subsystems and handle global fallback logic, we define the `useContextBuilder` composable.

```typescript
import { useSettingsLlmPerformance } from '../stores/settings/llm-performance'

export interface ContextBuilderOptions {
  activeCard: any
  messages: any[]

  // Per-turn/Per-invocation Overrides:
  cacheAligned?: boolean
  historyMode?: 'full' | 'slice'
  sliceCount?: number

  // Telemetry & Instructions:
  injectSensors?: boolean
  instructionSuffix?: string
}

export function compileCacheAlignedPrompt(options: ContextBuilderOptions) {
  const performanceSettings = useSettingsLlmPerformance()

  // Resolve settings (use invocation overrides, fallback to global settings)
  const isCacheAligned = options.cacheAligned !== undefined
    ? options.cacheAligned
    : performanceSettings.prefixCacheAlignment

  const mode = options.historyMode !== undefined
    ? options.historyMode
    : performanceSettings.globalHistoryMode

  const sliceLimit = options.sliceCount !== undefined
    ? options.sliceCount
    : performanceSettings.globalSliceCount

  const systemMessages: Array<{ role: 'system', content: string }> = []

  // 1. Core System Prompt (The absolute static prefix)
  const baseSystemPrompt = buildSystemPrompt(options.activeCard)
  if (baseSystemPrompt) {
    systemMessages.push({ role: 'system', content: baseSystemPrompt })
  }

  // 2. Conversation History
  // Filters out system messages and formats the history turns
  const chatMessages = options.messages.filter(m => m.role === 'user' || m.role === 'assistant')
  const historyLimit = mode === 'slice' ? sliceLimit : chatMessages.length
  const conversationMsgs = chatMessages.slice(-historyLimit)

  const formattedHistory = conversationMsgs.map(m => ({
    role: m.role,
    content: extractRawText(m.rawContent || m.content)
  }))

  // 3. Volatile Sensor Payloads & Context Overlays
  // CRITICAL: Appended AFTER the static prefix or history to protect cache alignment
  const suffixDirectives: string[] = []
  if (options.injectSensors) {
    const proactivityStore = useProactivityStore()
    if (proactivityStore.sensorPayload) {
      suffixDirectives.push(`[ENVIRONMENTAL AWARENESS]\n${proactivityStore.sensorPayload}`)
    }
  }

  // Combine instructions and volatile telemetry into system instructions at the tail
  if (suffixDirectives.length > 0) {
    systemMessages.push({ role: 'system', content: suffixDirectives.join('\n---\n') })
  }

  // 4. Instructions / Actions (The tail of the prompt)
  const userMessages = [...formattedHistory]
  if (options.instructionSuffix) {
    userMessages.push({ role: 'user', content: options.instructionSuffix })
  }

  return {
    messages: isCacheAligned
      ? [...systemMessages, ...userMessages]
      : compileFlatLegacyPrompt(options) // Fallback to unaligned layout
  }
}
```

---

## 5. Subsystem Integration & UI Controls

### A. Proactivity Heartbeat
* **No UI Changes**: The proactivity loop calls `compileCacheAlignedPrompt` without passing `historyMode` or `sliceCount`, inheriting the global behavior settings directly.
* **Prompt Assembly**: Telemetry data (idle time, load, window titles) is pushed to the tail of the message chain.

### B. Destiny 2 OCR Plugin
* **No UI Changes**: The Destiny 2 OCR agent invokes the prompt builder utilizing global fallbacks.
* **Prompt Assembly**: The HUD recognition details (e.g. weapon loadouts, score differentials, super status) are formatted as a tail directive after the conversation history.

### C. Producer Lite (Per-Turn Controls)
* **UI Controls**: We add control toggles within the reply suggestions popover or settings sidebar.
  ```
  [Suggestions Options]
  History Source:
  (o) Use Global Default
  ( ) Full History
  ( ) Slices Last [ 6 ] Turns
  ```
* **Invocation**: Passes user selections directly to the suggestions request.
  ```typescript
  // Inside useProducer.ts
  const prompt = compileCacheAlignedPrompt({
    activeCard: activeCard.value,
    messages: options.messages,
    historyMode: localHistoryMode.value, // 'full' | 'slice' | undefined (for global fallback)
    sliceCount: localSliceCount.value, // number | undefined
    instructionSuffix: compiledInstructions,
  })
  ```

### D. Journal Moments (Per-Invocation Controls)
* **UI Controls**: When triggering a journal moment (e.g., from the conversation action menu), a modal or mini-overlay prompts the user to select the narrative context scope.
  ```
  [Create Journal Entry]
  Choose Context Window:
  ( ) Journal about the entire chat session (Full History)
  (o) Journal about the last [ 10 ] turns (Recent Arc)
      Prevents character from drifting or journaling about older topics.
  ```
* **Invocation**: Maps the selection to the invocation input for prompt generation.
  ```typescript
  // Inside memory-text-journal.ts
  async function createJournalMoment(input: {
    messages: any[]
    instructions?: string
    modelId: string
    providerId: string
    historyMode?: 'full' | 'slice'
    sliceCount?: number
  }) {
    // Passes overrides directly to useContextBuilder / compileCacheAlignedPrompt
  }
  ```
