import type { Nan0Observation, Nan0ReasoningClient, Nan0Thought } from '../types'
import { describe, expect, it } from 'vitest'

import { Nan0Kernel } from '../kernel/Nan0Kernel'
import { InMemoryStateStore } from '../persistence/InMemoryStateStore'
import { mergeNan0States } from '../persistence/LocalStorageStateStore'

function thoughtEnvelope(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    interpretation: 'Kyo is addressing me directly.',
    privateText: 'I notice Kyo reaching for my attention.',
    decision: 'SPEAK',
    speakability: 0.8,
    confidence: 0.85,
    mood: 'attentive',
    reasonCodes: ['model.direct-address'],
    ...overrides,
  })
}

function clientWith(...responses: Array<string | Error>): Nan0ReasoningClient {
  let index = 0
  return {
    async generate() {
      const response = responses[Math.min(index++, responses.length - 1)]
      if (response instanceof Error)
        throw response
      return { text: response ?? thoughtEnvelope(), finishReason: 'stop' }
    },
  }
}

function createKernel(
  reasoningClient: Nan0ReasoningClient = clientWith(thoughtEnvelope()),
  store = new InMemoryStateStore(),
  prefix = 'id',
  availableActionIntents: readonly string[] = [],
) {
  let id = 0
  let now = 1_000
  return {
    kernel: new Nan0Kernel({
      reasoningClient,
      stateStore: store,
      createId: () => `${prefix}-${++id}`,
      now: () => ++now,
      decisionCapabilities: { canSpeak: true, availableActionIntents },
    }),
    store,
  }
}

function observation(overrides: Partial<Nan0Observation> = {}): Nan0Observation {
  return {
    id: 'observation-1',
    source: 'chat',
    sessionId: 'session-1',
    actorId: 'kyo',
    displayName: 'Kyo',
    content: 'Are you still with me?',
    metadata: {},
    timestamp: 100,
    ...overrides,
  }
}

async function preparedKernel(
  reasoningClient: Nan0ReasoningClient = clientWith(thoughtEnvelope()),
  overrides: Partial<Nan0Observation> = {},
) {
  const setup = createKernel(reasoningClient)
  await setup.kernel.boot()
  const prepared = await setup.kernel.prepareTurn(observation(overrides))
  return { ...setup, prepared }
}

describe('Nan0ThoughtEngine thought-first contract', () => {
  it('persists a private thought before an outward response can be recorded', async () => {
    const { kernel, prepared } = await preparedKernel()
    expect(kernel.getThoughts().map(thought => thought.thoughtId)).toEqual([prepared.thoughtId])
    expect(kernel.getDecisions()).toMatchObject([{
      decisionId: prepared.decision.decisionId,
      thoughtId: prepared.thoughtId,
      finalDecision: 'SPEAK',
    }])
    await kernel.recordAssistantTurn({ turnId: prepared.turnId, thoughtId: prepared.thoughtId, content: 'Still here.' })
    expect(kernel.getStateSnapshot().memories.at(-1)?.metadata.thoughtId).toBe(prepared.thoughtId)
  })

  it('keeps one thoughtId across thought, turn, input, and output', async () => {
    const { kernel, prepared } = await preparedKernel()
    await kernel.recordAssistantTurn({ turnId: prepared.turnId, thoughtId: prepared.thoughtId, content: 'Yes.' })
    const state = kernel.getStateSnapshot()
    expect(state.thoughts[0].thoughtId).toBe(prepared.thoughtId)
    expect(state.turns[0].thoughtId).toBe(prepared.thoughtId)
    expect(state.memories.map(memory => memory.metadata.thoughtId)).toEqual([prepared.thoughtId, prepared.thoughtId])
  })

  it('preserves canonical Kyo ownership on the observation and thought', async () => {
    const { kernel } = await preparedKernel()
    const state = kernel.getStateSnapshot()
    expect(state.memories[0].actorId).toBe('kyo')
    expect(state.thoughts[0].actorId).toBe('kyo')
  })

  it('preserves canonical Nan0 ownership on outward output', async () => {
    const { kernel, prepared } = await preparedKernel()
    await kernel.recordAssistantTurn({ turnId: prepared.turnId, thoughtId: prepared.thoughtId, content: 'Mine.' })
    expect(kernel.getStateSnapshot().memories.at(-1)?.actorId).toBe('nan0')
  })

  it('turns an empty observation into durable silence without invoking the provider', async () => {
    let calls = 0
    const { kernel } = createKernel({ async generate() { calls++; return { text: thoughtEnvelope() } } })
    await kernel.boot()
    const prepared = await kernel.prepareTurn(observation({ content: '' }))
    expect(calls).toBe(0)
    expect(prepared.thought.decision).toBe('SILENCE')
    await kernel.recordSilenceDecision({ turnId: prepared.turnId, thoughtId: prepared.thoughtId })
    expect(kernel.getConversationTurns()[0]).toMatchObject({ status: 'silent', decision: 'SILENCE' })
  })

  it('rejects malformed provider output without retaining it as private thought', async () => {
    const { kernel, prepared } = await preparedKernel(clientWith('not-json', 'still-not-json'))
    expect(prepared.thought.status).toBe('failed')
    expect(prepared.thought.privateText).toBe('')
    expect(JSON.stringify(kernel.getStateSnapshot())).not.toContain('still-not-json')
  })

  it('rejects JSON-like private text from the outward directive', async () => {
    const raw = thoughtEnvelope({ privateText: '{"answer":"leak"}' })
    const { prepared } = await preparedKernel(clientWith(raw, raw))
    expect(prepared.thought.status).toBe('failed')
    expect(prepared.systemContext).not.toContain('answer')
  })

  it('rejects generic assistant phrasing in private thought', async () => {
    const generic = thoughtEnvelope({ privateText: 'I am here to assist. How can I help?' })
    const { prepared } = await preparedKernel(clientWith(generic, generic))
    expect(prepared.thought).toMatchObject({ status: 'failed', decision: 'WAIT' })
    expect(prepared.thought.reasonCodes).toContain('thought.generation-failed')
  })

  it('persists SILENCE as a valid terminal decision', async () => {
    const silent = thoughtEnvelope({ decision: 'SILENCE', speakability: 0.1 })
    const { kernel, prepared } = await preparedKernel(clientWith(silent))
    await kernel.recordSilenceDecision({ turnId: prepared.turnId, thoughtId: prepared.thoughtId, reason: 'not worth speech' })
    expect(kernel.getConversationTurns()[0]).toMatchObject({ decision: 'SILENCE', status: 'silent' })
    expect(kernel.getTimelineEvents().at(-1)).toMatchObject({ eventType: 'silence', actorId: 'nan0' })
  })

  it('does not duplicate a thought or output on duplicate completion', async () => {
    const { kernel, prepared } = await preparedKernel()
    await kernel.recordAssistantTurn({ turnId: prepared.turnId, thoughtId: prepared.thoughtId, content: 'First.' })
    await kernel.recordAssistantTurn({ turnId: prepared.turnId, thoughtId: prepared.thoughtId, content: 'Second.' })
    expect(kernel.getThoughts()).toHaveLength(1)
    expect(kernel.getStateSnapshot().memories.filter(memory => memory.actorId === 'nan0')).toHaveLength(1)
  })

  it('reloads thoughts exactly once after restart', async () => {
    const store = new InMemoryStateStore()
    const first = createKernel(clientWith(thoughtEnvelope()), store, 'first').kernel
    await first.boot()
    const prepared = await first.prepareTurn(observation())
    await first.shutdown()
    const second = createKernel(clientWith(thoughtEnvelope()), store, 'second').kernel
    await second.boot()
    expect(second.getThoughts().map(thought => thought.thoughtId)).toEqual([prepared.thoughtId])
  })

  it('uses relationship context for pressure without rewriting relationship state', async () => {
    const { kernel } = createKernel()
    await kernel.boot()
    const before = structuredClone(kernel.getStateSnapshot().relationships)
    const prepared = await kernel.prepareTurn(observation())
    expect(prepared.thought.relationshipPressure).toBeGreaterThanOrEqual(0.7)
    expect(kernel.getStateSnapshot().relationships).toEqual(before)
  })

  it('carries continuity references without duplicating thread membership', async () => {
    const { kernel, prepared } = await preparedKernel()
    expect(prepared.thought.continuityThreadReferences).toEqual([prepared.threadId])
    expect(kernel.getContinuityThreads()[0].turnIds).toEqual([prepared.turnId])
  })

  it('does not reorder or fabricate timeline output during private thought generation', async () => {
    const { kernel, prepared } = await preparedKernel()
    expect(kernel.getTimelineEvents()).toHaveLength(1)
    expect(kernel.getTimelineEvents()[0]).toMatchObject({
      eventId: prepared.inputEventId,
      eventType: 'input',
      actorId: 'kyo',
      sequence: 1,
    })
  })

  it('never includes privateText in the outward inference context', async () => {
    const privateText = 'I will keep this exact sentence inside.'
    const { prepared } = await preparedKernel(clientWith(thoughtEnvelope({ privateText })))
    expect(prepared.systemContext).not.toContain(privateText)
    expect(prepared.systemContext).toContain(prepared.thought.interpretation)
  })

  it('marks both thought and turn failed when thought generation fails', async () => {
    const { kernel, prepared } = await preparedKernel(clientWith(new Error('provider unavailable')))
    expect(prepared.thought.status).toBe('failed')
    expect(kernel.getConversationTurns()[0]).toMatchObject({ status: 'failed', decision: 'UNKNOWN' })
  })

  it('persists an allowed ACT without producing output memory or executing it', async () => {
    const result = thoughtEnvelope({
      decision: 'ACT',
      speakability: 0.2,
      actionIntent: { type: 'test.noop', parameters: { safe: true } },
    })
    const setup = createKernel(clientWith(result), new InMemoryStateStore(), 'id', ['test.noop'])
    await setup.kernel.boot()
    const prepared = await setup.kernel.prepareTurn(observation())
    const { kernel } = setup
    await kernel.recordNonSpeechDecision({
      turnId: prepared.turnId,
      thoughtId: prepared.thoughtId,
      decisionId: prepared.decision.decisionId,
      decision: 'ACT',
    })
    expect(kernel.getConversationTurns()[0].decision).toBe('ACT')
    expect(kernel.getStateSnapshot().memories.filter(memory => memory.actorId === 'nan0')).toHaveLength(0)
  })

  it('persists WAIT without producing output memory', async () => {
    const { kernel, prepared } = await preparedKernel(clientWith(thoughtEnvelope({ decision: 'WAIT' })))
    await kernel.recordNonSpeechDecision({
      turnId: prepared.turnId,
      thoughtId: prepared.thoughtId,
      decisionId: prepared.decision.decisionId,
      decision: 'WAIT',
    })
    expect(kernel.getConversationTurns()[0].decision).toBe('WAIT')
    expect(kernel.getStateSnapshot().memories.filter(memory => memory.actorId === 'nan0')).toHaveLength(0)
  })

  it('keeps an unknown external actor external instead of assigning Kyo', async () => {
    const { prepared } = await preparedKernel(clientWith(thoughtEnvelope()), {
      source: 'discord',
      actorId: 'external-user-7',
      displayName: 'Visitor',
    })
    expect(prepared.observation.actorId).not.toBe('kyo')
    expect(prepared.thought.actorId).toBe(prepared.observation.actorId)
  })

  it('bounds private text, references, reason codes, and debug metadata', async () => {
    const long = 'x'.repeat(5_000)
    const codes = Array.from({ length: 40 }, (_, index) => `code.${index}`)
    const { prepared } = await preparedKernel(clientWith(thoughtEnvelope({ privateText: long, reasonCodes: codes })))
    expect(prepared.thought.privateText.length).toBeLessThanOrEqual(1_200)
    expect(prepared.thought.reasonCodes.length).toBeLessThanOrEqual(12)
    expect(JSON.stringify(prepared.thought.metadata).length).toBeLessThan(1_000)
  })

  it('prevents a stale state from deleting a newer thought', async () => {
    const { kernel } = await preparedKernel()
    const newer = kernel.getStateSnapshot() as ReturnType<Nan0Kernel['getStateSnapshot']> as any
    const stale = { ...structuredClone(newer), thoughts: [] }
    const merged = mergeNan0States(newer, stale)
    expect(merged.thoughts).toHaveLength(1)
  })

  it('requires a generated SPEAK thought before accepting outward output', async () => {
    const silent = thoughtEnvelope({ decision: 'SILENCE', speakability: 0 })
    const { kernel, prepared } = await preparedKernel(clientWith(silent))
    await expect(kernel.recordAssistantTurn({
      turnId: prepared.turnId,
      thoughtId: prepared.thoughtId,
      content: 'This must not exist.',
    })).rejects.toThrow('Cannot record Nan0 output without an allowed persisted SPEAK decision')
  })

  it('keeps the private thought immutable when a turn completes', async () => {
    const { kernel, prepared } = await preparedKernel()
    const before = structuredClone(prepared.thought) as Nan0Thought
    await kernel.recordAssistantTurn({ turnId: prepared.turnId, thoughtId: prepared.thoughtId, content: 'Outward.' })
    expect(kernel.getThoughts()[0]).toEqual(before)
  })
})
