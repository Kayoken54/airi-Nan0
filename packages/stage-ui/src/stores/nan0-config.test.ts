import { describe, expect, it } from 'vitest'

import {
  isNan0ProcessorEnabled,
  NAN0_PROCESSOR_ID,
  resolveNan0ReasoningRoute,
} from './nan0-config'

describe('nan0 processor configuration', () => {
  it('activates only for the enabled official Nan0 processor', () => {
    expect(isNan0ProcessorEnabled(undefined)).toBe(false)
    expect(isNan0ProcessorEnabled({ enabled: false, processor: NAN0_PROCESSOR_ID })).toBe(false)
    expect(isNan0ProcessorEnabled({ enabled: true, processor: 'none' })).toBe(false)
    expect(isNan0ProcessorEnabled({ enabled: true, processor: NAN0_PROCESSOR_ID })).toBe(true)
  })

  it('uses the card-selected AIRI provider and model for Nan0 thought', () => {
    expect(resolveNan0ReasoningRoute({
      enabled: true,
      processor: NAN0_PROCESSOR_ID,
      provider: 'card-provider',
      model: 'card-model',
    }, {
      providerId: 'fallback-provider',
      model: 'fallback-model',
    })).toEqual({
      providerId: 'card-provider',
      model: 'card-model',
    })
  })

  it('falls back to the active AIRI route for blank or inactive card settings', () => {
    const fallback = { providerId: 'fallback-provider', model: 'fallback-model' }

    expect(resolveNan0ReasoningRoute({
      enabled: true,
      processor: NAN0_PROCESSOR_ID,
      provider: ' ',
      model: '',
    }, fallback)).toEqual(fallback)
    expect(resolveNan0ReasoningRoute({
      enabled: true,
      processor: 'none',
      provider: 'generic-provider',
      model: 'generic-model',
    }, fallback)).toEqual(fallback)
  })
})
