# Proposal: Attention Ecology Proof-of-Concept (RWKV-7 Vibe Island)

This proposal outlines the design and implementation roadmap for a lightweight **Proof-of-Concept (PoC)** to validate the use of local WebGPU RWKV-7 recurrent states for continuous environmental grounding, visual telemetry feedback, and ambient vibe drift.

---

## 1. Objectives

1.  **Validate RNN State Accumulation**: Prove that streaming constant, semantic sensor inputs into the RWKV-7 hidden recurrent state (RNN state) shifts the model's internal weights predictably over time.
2.  **Zero-Token Telemetry**: Verify that we can retrieve a coherent "ambient mood" from the state vector *without* keeping or parsing a chronological list of event logs in the LLM prompt.
3.  **Real-Time Visual Feedback**: Render the dynamically shifting vibe as a visual indicator on the desktop **Control Island** to observe state decay and accumulation during daily usage.
4.  **Soul-Controlled Expression**: Dynamically switch the character's active idle animations based on the subconscious mood state.

---

## 2. Technical Design: The Input Ticker

To prevent pre-calculating time-window averages in JavaScript, the system delegates history aggregation entirely to the linear RNN mechanics of RWKV-7 ($h_t = W \cdot h_{t-1} + U \cdot x_t$). The hidden state vector $h_t$ naturally decays past tokens while accumulating new ones.

We structure this input stream across two evolutionary phases:

### Phase 1: Binary Action Loop (MVP)
*   **Sensor Source**: Active keyboard/mouse input detection from `proactivityStore`.
*   **Tick Rate**: Every 5 seconds, evaluate the user's active/idle state.
*   **Ticker Value (Single Token)**:
    *   **`ACT`**: Active typing or mouse clicks within the last 5 seconds.
    *   **`IDLE`**: Mouse/keyboard untouched for 5 seconds.
*   **WebGPU State Update**: Run a forward-only state-update pass, feeding the single token.

### Phase 2: Category Regex Router (Target)
*   **Sensor Source**: Active window focus (retrieved via `active-win`) combined with input activity.
*   **Router Logic**: Match the active application process and window title against user-configured regex rules in the UI, mapping them to a dominant category token for the 5-second tick:
    *   `.*(VS Code|Cursor|Antigravity|Xcode).*` ──► **`CODE`**
    *   `.*(Discord|Slack|Telegram|Signal).*`   ──► **`CHAT`**
    *   `.*(Youtube|Steam|Epic Games|Cyberpunk).*` ──► **`PLAY`**
    *   `.*(Brave|Chrome|Safari).*`             ──► **`BROWSE`**
    *   *No active input / screen untouched:*   ──► **`IDLE`**
*   **Aggregation Selection**: If multiple activities occur during a 5s tick, the system maps to the *most dominant* active token (the one active for the largest fraction of that tick).

---

## 3. The 3 Core Subconscious Outputs

Rather than prompting the local model to write conversational responses constantly (which would be extremely resource-heavy and spammy), the recurrent subconscious state compiles three distinct downstream signals:

### A. Vibe & Focus States (UI & Animation Routing)
*   **Frequency**: Polled every 60 seconds using a lightweight token classification prompt.
*   **Behavior**: Evaluates the hidden state vector to return a single state keyword (`FOCUSED`, `RESTLESS`, `DRIFTING`, `COMPANIONABLE`).
*   **Routing**: Used to toggle active Live2D idle animation cycles and change visual indicators on the interface.

### B. Context-Aware Prompt Modifiers (Inference Grounding)
*   **Frequency**: Parsed only when the user explicitly sends a message.
*   **Behavior**: Serializes the current subconscious state into a compact tag block appended to the system prompt builder (e.g. `[VIBE: FOCUSED/CODING]`).
*   **Routing**: Influences the primary cloud LLM's conversational tone (e.g., matching response length and energy to whether the user has been intensely coding or idle).

### C. Internal Soliloquy (The Subconscious Thoughts Stream)
*   **Frequency**: Triggered on high-salience delta events (e.g., transition from 20 mins of `CODE` to `PLAY`).
*   **Behavior**: The local model generates a short, silent internal monologue entry (e.g., `(He's been hacking away at that code for a while, looks like he's taking a break now...)`) which is written to a hidden subconscious log.
*   **Routing**: When the user eventually speaks, the primary LLM reads this internal log to reference what the character was "thinking" during the quiet periods, enabling organic, context-rich dialogue (e.g. *"You've been typing like crazy for the last half hour, taking a breather?"*).

---

## 4. Soul-Controlled Animations & Interaction Feedback

To make the character's physical presence on screen reflect their inner state, we link the subconscious outputs directly to the 3D model's idle animation cycle.

### A. Constrained Animation Output
Instead of generating generic mood categories, the 60s polling classifier can run a constrained generation pass forced to choose from the character's supported idle animations array (e.g. `idleLoop`, `energetic`, `shy`, `confidentPose`, `cool`, `kawaiiKaiwai`).
*   **The Mechanism**: The local WebGPU runner applies logit biases to restrict predictions to the exact strings corresponding to active animation enums.
*   *Example*: If your logs show intense workspace focus (`CODE` ticks), a supportive character's state will drift and classify to `shy` or `confidentPose`. If you switch to games (`PLAY`), it maps to `energetic` or `blingBang`.

### B. The Interaction Feedback Loop (Reward Injection)
To allow the model to evaluate the "effectiveness" of its mood selections:
1.  Whenever the user sends a message, the system injects a special **`[REWARD: INTERACTION]`** token into the recurrent state.
2.  If the model switches to a specific animation (e.g. `cool`) and the user immediately sends a message, the interaction acts as a **positive reinforcement** signal on that recurrent state path.
3.  If the model switches to an animation (e.g. `crabDance`) and the user does not interact for a long duration, the state decays naturally without reinforcement, indicating low engagement for that transition.

---

## 5. UI Touchpoint: The Control Island Indicator

To enable real-time observation and calibration, we integrate the vibe indicator directly into the **Control Island** component.

```
┌──────────────────────────────────────────────┐
│  [ ● VIBE ]  AIRI: Active (Focus Mode)  [ _ ]│
└──────────────────────────────────────────────┘
     ▲
     │  Indicator Color:
     ├── Green  (FOCUSED / CODE)
     ├── Yellow (RESTLESS / PLAY)
     ├── Blue   (BROWSE)
     └── Purple (COMPANIONABLE / IDLE)
```

1.  **Vibe Indicator Dot**:
    *   A small, glowing indicator dot is added next to the character status in the Control Island.
    *   The color dynamically maps to the current recurrent vibe.
2.  **Telemetry Popover**:
    *   Hovering over the indicator dot reveals a miniature popover showing the real-time state weights:
        ```text
        Subconscious State Saturation:
        - Code Focus: 75% (last 10m)
        - Chat/Idle: 25% (last 10m)
        Current Vibe: FOCUSED
        ```

---

## 6. Fine-Tuning & Calibration Strategy

*   **State Decay Calibration**: Expose decay multipliers in the developer settings to adjust how fast past telemetry inputs fade from the hidden state buffer.
*   **Vibe Mismatch Logs**: If the user dismisses an action or manually overrides the detected state, the system appends the mismatch metadata to a local JSONL file (`personal_airi/vibe_mismatches.jsonl`) to build a training dataset for refining the local classifier weights.
