import { afterEach, describe, expect, it, vi } from 'vitest'

import { createNan0AutonomyScheduler } from './nan0-autonomy-scheduler'

async function flush(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

afterEach(() => {
  vi.useRealTimers()
})

describe('Nan0 autonomy scheduler', () => {
  it('runs one session-resume evaluation when started idempotently', async () => {
    vi.useFakeTimers()
    const evaluate = vi.fn(async () => ({ nextEvaluationAt: null }))
    const scheduler = createNan0AutonomyScheduler({ evaluate, isHostReady: () => true })
    scheduler.start()
    scheduler.start()
    await flush()
    expect(evaluate).toHaveBeenCalledOnce()
    expect(evaluate).toHaveBeenCalledWith('session-resume')
    scheduler.stop()
  })

  it('does not call the owner on interval when nothing is scheduled', async () => {
    vi.useFakeTimers()
    const evaluate = vi.fn(async () => ({ nextEvaluationAt: null }))
    const scheduler = createNan0AutonomyScheduler({ evaluate, isHostReady: () => true, intervalMs: 1_000 })
    scheduler.start()
    await flush()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(evaluate).toHaveBeenCalledTimes(1)
    scheduler.stop()
  })

  it('waits until the persisted next evaluation time', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    const evaluate = vi.fn(async () => ({ nextEvaluationAt: 6_000 }))
    const scheduler = createNan0AutonomyScheduler({ evaluate, isHostReady: () => true, intervalMs: 1_000 })
    scheduler.start()
    await flush()
    await vi.advanceTimersByTimeAsync(4_000)
    expect(evaluate).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1_000)
    expect(evaluate).toHaveBeenCalledTimes(2)
    scheduler.stop()
  })

  it('does not evaluate while the AIRI host is busy', async () => {
    vi.useFakeTimers()
    const evaluate = vi.fn(async () => ({ nextEvaluationAt: 0 }))
    const scheduler = createNan0AutonomyScheduler({ evaluate, isHostReady: () => false, intervalMs: 1_000 })
    scheduler.start()
    scheduler.notify('turn-complete')
    await vi.advanceTimersByTimeAsync(5_000)
    expect(evaluate).not.toHaveBeenCalled()
    scheduler.stop()
  })

  it('serializes duplicate wake notifications', async () => {
    let resolve!: (value: { nextEvaluationAt: null }) => void
    const evaluate = vi.fn(() => new Promise<{ nextEvaluationAt: null }>(done => resolve = done))
    const scheduler = createNan0AutonomyScheduler({ evaluate, isHostReady: () => true })
    scheduler.notify('manual')
    scheduler.notify('state-change')
    expect(evaluate).toHaveBeenCalledOnce()
    resolve({ nextEvaluationAt: null })
    await flush()
    scheduler.stop()
  })
})
