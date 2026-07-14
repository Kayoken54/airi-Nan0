import { describe, expect, it } from 'vitest'

import { createNan0RendererIdentity, isNan0OwnerRenderer } from './nan0-renderer'

describe('Nan0 renderer ownership', () => {
  it('selects only the dedicated chat renderer as the owner', () => {
    expect(isNan0OwnerRenderer('#/chat')).toBe(true)
    expect(isNan0OwnerRenderer('#/chat?session=one')).toBe(true)
    expect(isNan0OwnerRenderer('#/')).toBe(false)
    expect(isNan0OwnerRenderer('#/actor')).toBe(false)
    expect(isNan0OwnerRenderer('#/settings')).toBe(false)
  })

  it('keeps non-owner renderers read-only and gives each renderer a stable diagnostic identity', () => {
    const identity = createNan0RendererIdentity('#/actor', () => 'renderer-1')
    let appendCount = 0

    if (identity.isOwner)
      appendCount += 1

    expect(identity).toEqual({
      instanceId: 'renderer-1',
      hash: '#/actor',
      isOwner: false,
    })
    expect(appendCount).toBe(0)
  })
})
