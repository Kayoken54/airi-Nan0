import type { Nan0PreparedTurn } from '@proj-airi/nan0-runtime'
import { describe, expect, it } from 'vitest'

import { toPreparedTurnProxy } from './nan0-bridge'

function preparedTurn(): Nan0PreparedTurn {
  return {
    thoughtId: 'thought-1',
    turnId: 'turn-1',
    sessionId: 'session-1',
    inputEventId: 'event-1',
    threadId: 'thread-1',
    systemContext: '[NAN0 KERNEL CONTEXT]\nBounded outward directive.',
    thought: {
      privateText: 'This must stay in the owner renderer.',
      interpretation: 'Bounded interpretation.',
      metadata: { hidden: 'owner-only' },
    },
    decision: {
      decisionId: 'decision-1',
      finalDecision: 'SPEAK',
      allowed: true,
      confidence: 0.8,
      speakability: 0.9,
      attentionScore: 0.7,
      pressureScore: 0.6,
      reasonCodes: ['kyo-addressed'],
      suppressionReason: null,
      actionIntent: null,
      waitUntil: null,
    },
  } as Nan0PreparedTurn
}

describe('Nan0 renderer bridge', () => {
  it('exposes only the final decision and bounded outward directive', () => {
    const prepared = preparedTurn()
    const proxy = toPreparedTurnProxy(prepared)
    const serialized = JSON.stringify(proxy)

    expect(proxy).toEqual({
      thoughtId: 'thought-1',
      turnId: 'turn-1',
      sessionId: 'session-1',
      inputEventId: 'event-1',
      threadId: 'thread-1',
      outwardDirective: '[NAN0 KERNEL CONTEXT]\nBounded outward directive.',
      decision: {
        decisionId: 'decision-1',
        finalDecision: 'SPEAK',
        allowed: true,
        confidence: 0.8,
        speakability: 0.9,
        attentionScore: 0.7,
        pressureScore: 0.6,
        reasonCodes: ['kyo-addressed'],
        suppressionReason: null,
        actionIntent: null,
        waitUntil: null,
      },
    })
    expect(serialized).not.toContain('privateText')
    expect(serialized).not.toContain('This must stay')
    expect(serialized).not.toContain('owner-only')
    expect(serialized).not.toContain('interpretation')
  })

  it('copies reason codes so the executor cannot mutate the owner decision', () => {
    const prepared = preparedTurn()
    const proxy = toPreparedTurnProxy(prepared)
    proxy.decision.reasonCodes.push('executor-change')

    expect(prepared.decision.reasonCodes).toEqual(['kyo-addressed'])
  })
})
