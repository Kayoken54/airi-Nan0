# Nan0 Runtime: Milestones 1–5 Local Starter

This package is intentionally local-first. Copy `packages/nan0-runtime` into the AIRI workspace and test without pushing.

## Implemented

1. Package scaffold and typed contracts.
2. Observation → kernel → expression message path.
3. Provider-neutral reasoning client call.
4. Explicit port seam for the Python cognition pipeline.
5. Local persisted state plus versioned legacy-memory import.

## Not yet equivalent to the Python Nan0

The current context builder and memory retrieval are deliberately minimal. They prove the route works. Replace them with the existing Python behavior after providing the Python source and representative database export.

## Local commands

```bash
pnpm install
pnpm --filter @proj-airi/nan0-runtime typecheck
pnpm --filter @proj-airi/nan0-runtime build
pnpm dev:tamagotchi
```

## Host wiring

Create an AIRI-specific `Nan0ReasoningClient` that calls the current xsAI generation path. Then create `CallbackHostBindings` and feed AIRI chat messages through `emitObservation()`.

Do not push until the package typechecks and AIRI still starts.
