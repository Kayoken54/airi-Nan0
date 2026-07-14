import type { Nan0PreparedTurn } from '@proj-airi/nan0-runtime'
import { describe, expect, it } from 'vitest'

import { toPreparedTurnProxy } from './nan0-bridge'

describe('Nan0 renderer bridge', () => {
  it('exposes only the bounded thought directive required by the chat executor', () => {
    const prepared = {
      thoughtId: 'thought-1',
      turnId: 'turn-1',
      sessionId: 'session-1',
      inputEventId: 'event-1',
      threadId: 'thread-1',
      systemContext: '[NAN0 KERNEL CONTEXT]\nBounded outward directive.',
      thought: {
        status: 'generated',
        decision: 'SPEAK',
        speakability: 0.9,
        reasonCodes: ['kyo-addressed'],
        privateText: 'This must stay in the owner renderer.',
        interpretation: 'Bounded interpretation.',
        metadata: { hidden: 'owner-only' },
      },
    } as unknown as Nan0PreparedTurn

    const proxy = toPreparedTurnProxy(prepared)
    const serialized = JSON.stringify(proxy)

    expect(proxy).toEqual({
      thoughtId: 'thought-1',
      turnId: 'turn-1',
      sessionId: 'session-1',
      inputEventId: 'event-1',
      threadId: 'thread-1',
      systemContext: '[NAN0 KERNEL CONTEXT]\nBounded outward directive.',
      thought: {
        status: 'generated',
        decision: 'SPEAK',
        speakability: 0.9,
        reasonCodes: ['kyo-addressed'],
      },
    })
    expect(serialized).not.toContain('privateText')
    expect(serialized).not.toContain('This must stay')
    expect(serialized).not.toContain('owner-only')
  })

  it('copies reason codes so the delegate cannot mutate the owner thought', () => {
    const prepared = {
      thoughtId: 'thought-1',
      turnId: 'turn-1',
      sessionId: 'session-1',
      inputEventId: 'event-1',
      threadId: 'thread-1',
      systemContext: 'context',
      thought: {
        status: 'generated',
        decision: 'WAIT',
        speakability: 0.1,
        reasonCodes: ['low-pressure'],
      },
    } as unknown as Nan0PreparedTurn

    const proxy = toPreparedTurnProxy(prepared)
    proxy.thought.reasonCodes.push('delegate-change')

    expect(prepared.thought.reasonCodes).toEqual(['low-pressure'])
  })
})
