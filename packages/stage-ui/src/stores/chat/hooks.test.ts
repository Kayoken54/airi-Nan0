import type { ChatStreamEventContext } from '../../types/chat'
import { describe, expect, it, vi } from 'vitest'

import { createChatHooks } from './hooks'

function context(): ChatStreamEventContext {
  return {
    sessionId: 'session-1',
    message: {
      role: 'user',
      id: 'message-1',
      content: 'Hello',
      createdAt: 1,
    },
    contexts: {},
    composedMessage: [],
  }
}

describe('chat terminal lifecycle hooks', () => {
  it('emits deliberate silence once with the original session context', async () => {
    const hooks = createChatHooks()
    const listener = vi.fn(async () => {})
    hooks.onAssistantSilence(listener)

    await hooks.emitAssistantSilenceHooks('NO_REPLY', context())

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith('NO_REPLY', expect.objectContaining({ sessionId: 'session-1' }))
  })

  it('emits provider failure once without relying on turn-complete', async () => {
    const hooks = createChatHooks()
    const listener = vi.fn(async () => {})
    hooks.onChatError(listener)

    await hooks.emitChatErrorHooks({ message: 'provider failed', detail: '503' }, context())

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(
      { message: 'provider failed', detail: '503' },
      expect.objectContaining({ sessionId: 'session-1' }),
    )
  })
})
