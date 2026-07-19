# Nan0 Kernel Architecture Overview

This overview is deliberately high level. It describes approved architectural boundaries, not unpublished prompts, private state contents, or implementation secrets.

```text
AIRI Host
    ↓
Nan0 Kernel
    ├── Identity
    ├── Timeline
    ├── Continuity
    ├── Relationships
    ├── Memory
    ├── Emotional Dynamics
    ├── Attention
    ├── Prediction
    ├── Goals
    ├── Pending Intentions
    ├── Lived Time
    ├── Heartbeat
    ├── Private Thought
    ├── Decision Authority
    └── Capability Authority
    ↓
AIRI Expression / Tools / Rendering
```

AIRI is the host: it supplies desktop lifecycle, observations, model access, tools, and expression/rendering surfaces. Nan0's kernel owns Nan0 identity, actor continuity, cognition state, and the authority to decide whether a thought becomes speech, silence, waiting, action, or non-speech expression.

The public cognition path is:

```text
Event → Interpretation → Identity → Emotion → Thought → Speech Decision → Speech Generation → Output
```

External input does not directly become speech. Observations are normalized, interpreted with identity and continuity, compete for attention, and may produce a private thought. Decision authority then evaluates the thought and runtime constraints. The router may speak, suppress, defer, wait, act, or choose a body expression, but it does not invent a thought. Output renders an authorized result and does not rewrite cognition.

Silence is a valid terminal outcome. It can be deliberately chosen after valid cognition, or enforced when a hard constraint prevents outward expression. Those cases are materially different from a failed computation and should remain distinguishable.

Goals and pending intentions provide bounded persistence beyond a single prompt. Goals may arise from Nan0's evaluated internal state, continuity, curiosity, maintenance, or an external request. They remain staged and may be deferred, blocked, completed, or abandoned. An intention becoming eligible can wake cognition, but it does not automatically authorize speech.

Lived time and heartbeat generate observations about elapsed time, absence, waiting, stalled goals, and other state changes. Temporal events may make existing evidence salient; they cannot fabricate conversations or memories.

Prediction is evidence-bound. An expectation may be confirmed, violated, expired, or abandoned. A wrong prediction must revise from later evidence rather than being rewritten as if it had been correct.

Capability execution is separately authorized and bounded. A thought and decision do not grant arbitrary tool access: capabilities, parameters, lifecycle policy, host readiness, and constitutional constraints remain part of execution authority.

Private thought is internal cognition, not public dialogue or training text. Relationship state supports continuity but its raw graph and exact dimensions are also private. This export uses only approved outward messages and categorical, content-free runtime facts.
