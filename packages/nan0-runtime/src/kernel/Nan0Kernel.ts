import type {
  Nan0Expression,
  Nan0KernelDependencies,
  Nan0KernelState,
  Nan0Observation,
} from '../types'

type ExpressionHandler = (expression: Nan0Expression) => void

function defaultInitialState(now: number): Nan0KernelState {
  return {
    schemaVersion: 1,
    bootCount: 0,
    createdAt: now,
    updatedAt: now,
    emotionalState: {},
    runtimeMetadata: {},
  }
}

export class Nan0Kernel {
  private readonly expressionHandlers = new Set<ExpressionHandler>()
  private readonly now: () => number
  private readonly createId: () => string
  private state: Nan0KernelState
  private booted = false

  constructor(private readonly dependencies: Nan0KernelDependencies) {
    this.now = dependencies.now ?? (() => Date.now())
    this.createId = dependencies.createId ?? (() => crypto.randomUUID())
    this.state = dependencies.createInitialState?.()
      ?? defaultInitialState(this.now())
  }

  get isBooted(): boolean {
    return this.booted
  }

  getStateSnapshot(): Readonly<Nan0KernelState> {
    return structuredClone(this.state)
  }

  async boot(): Promise<void> {
    if (this.booted)
      return

    const persistedState = await this.dependencies.stateStore.load()
    if (persistedState)
      this.state = persistedState

    const timestamp = this.now()
    this.state = {
      ...this.state,
      bootCount: this.state.bootCount + 1,
      updatedAt: timestamp,
    }

    await this.dependencies.stateStore.save(this.state)
    this.booted = true
  }

  async shutdown(): Promise<void> {
    if (!this.booted)
      return

    this.state = {
      ...this.state,
      updatedAt: this.now(),
    }

    await this.dependencies.stateStore.save(this.state)
    this.booted = false
  }

  async observe(observation: Nan0Observation): Promise<void> {
    if (!this.booted)
      throw new Error('Nan0Kernel must be booted before receiving observations.')

    const expression = await this.processObservation(observation)
    const timestamp = this.now()

    this.state = {
      ...this.state,
      lastObservationAt: observation.timestamp,
      lastThoughtId: expression?.thoughtId ?? this.state.lastThoughtId,
      updatedAt: timestamp,
    }

    await this.dependencies.stateStore.save(this.state)

    if (expression)
      this.emitExpression(expression)
  }

  onExpression(handler: ExpressionHandler): () => void {
    this.expressionHandlers.add(handler)
    return () => this.expressionHandlers.delete(handler)
  }

  private async processObservation(
    observation: Nan0Observation,
  ): Promise<Nan0Expression | null> {
    // This is intentionally the port seam for nan0_skill.py + brain.py.
    // The next implementation step will replace this placeholder with the
    // preserved Python pipeline: context retrieval, private thought,
    // decision, speech finalization, and consequence persistence.
    void observation
    void this.dependencies.reasoningClient
    void this.createId
    return null
  }

  private emitExpression(expression: Nan0Expression): void {
    if (!expression.thoughtId.trim())
      throw new Error('Nan0 expressions require a valid thoughtId.')

    for (const handler of this.expressionHandlers)
      handler(expression)
  }
}
