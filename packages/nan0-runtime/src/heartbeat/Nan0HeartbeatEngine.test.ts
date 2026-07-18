import { afterEach, describe, expect, it, vi } from 'vitest'

import { createNan0HeartbeatEngine } from './Nan0HeartbeatEngine'

afterEach(() => vi.useRealTimers())

describe('Nan0HeartbeatEngine', () => {
  it('starts idempotently, serializes wakes, uses bounded jitter, and stops cleanly', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    let release!: (value: { nextEvaluationAt: null }) => void
    const evaluate = vi.fn(() => new Promise<{ nextEvaluationAt: null }>(resolve => release = resolve))
    const heartbeat = createNan0HeartbeatEngine({ evaluate, isHostReady: () => true, baseIntervalMs: 1_000, minimumIntervalMs: 750, maximumIntervalMs: 1_250, jitterRatio: 0.25, random: () => 1 })
    heartbeat.start()
    heartbeat.start()
    heartbeat.notify('state-change')
    heartbeat.notify('manual')
    expect(evaluate).toHaveBeenCalledOnce()
    release({ nextEvaluationAt: null })
    for (let index = 0; index < 5; index++)
      await Promise.resolve()
    expect(evaluate).toHaveBeenCalledTimes(2)
    expect(evaluate).toHaveBeenLastCalledWith('manual')
    heartbeat.stop()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(evaluate).toHaveBeenCalledTimes(2)
  })

  it('skips while the host is unavailable and survives a stop/start cycle without duplicate timers', async () => {
    vi.useFakeTimers()
    let ready = false
    const evaluate = vi.fn(async () => ({ nextEvaluationAt: null }))
    const diagnostic = vi.fn()
    const heartbeat = createNan0HeartbeatEngine({ evaluate, isHostReady: () => ready, baseIntervalMs: 1_000, minimumIntervalMs: 1_000, maximumIntervalMs: 1_000, jitterRatio: 0, diagnostic })
    heartbeat.start()
    heartbeat.notify('state-change')
    await vi.advanceTimersByTimeAsync(3_000)
    expect(evaluate).not.toHaveBeenCalled()
    expect(diagnostic).toHaveBeenCalledWith('heartbeat.tick.skipped', expect.objectContaining({ cause: 'host-not-ready' }))
    heartbeat.stop()
    ready = true
    heartbeat.start()
    await Promise.resolve()
    expect(evaluate).toHaveBeenCalledOnce()
    heartbeat.stop()
    await vi.advanceTimersByTimeAsync(3_000)
    expect(evaluate).toHaveBeenCalledOnce()
  })
})
