export type Nan0AutonomyWakeReason = 'interval' | 'session-resume' | 'turn-complete' | 'state-change' | 'manual'

export interface Nan0AutonomyScheduleResult {
  nextEvaluationAt: number | null
}

export interface Nan0AutonomySchedulerOptions {
  evaluate: (reason: Nan0AutonomyWakeReason) => Promise<Nan0AutonomyScheduleResult>
  isHostReady: () => boolean
  now?: () => number
  intervalMs?: number
  setInterval?: typeof globalThis.setInterval
  clearInterval?: typeof globalThis.clearInterval
  onError?: (error: unknown) => void
}

export interface Nan0AutonomyScheduler {
  start(): void
  notify(reason: Exclude<Nan0AutonomyWakeReason, 'interval' | 'session-resume'>): void
  stop(): void
  getNextEvaluationAt(): number | null
}

export function createNan0AutonomyScheduler(options: Nan0AutonomySchedulerOptions): Nan0AutonomyScheduler {
  const now = options.now ?? Date.now
  const intervalMs = Math.max(1_000, options.intervalMs ?? 10_000)
  const scheduleInterval = options.setInterval ?? globalThis.setInterval
  const cancelInterval = options.clearInterval ?? globalThis.clearInterval
  let timer: ReturnType<typeof globalThis.setInterval> | null = null
  let evaluation: Promise<void> | null = null
  let nextEvaluationAt: number | null = null

  const run = (reason: Nan0AutonomyWakeReason, force = false): void => {
    if (evaluation || !options.isHostReady())
      return
    if (!force && reason === 'interval' && (nextEvaluationAt == null || now() < nextEvaluationAt))
      return
    evaluation = options.evaluate(reason)
      .then((result) => {
        nextEvaluationAt = result.nextEvaluationAt
      })
      .catch(error => options.onError?.(error))
      .finally(() => {
        evaluation = null
      })
  }

  return {
    start() {
      if (timer)
        return
      run('session-resume', true)
      timer = scheduleInterval(() => run('interval'), intervalMs)
    },
    notify(reason) {
      run(reason, true)
    },
    stop() {
      if (timer)
        cancelInterval(timer)
      timer = null
      nextEvaluationAt = null
    },
    getNextEvaluationAt() {
      return nextEvaluationAt
    },
  }
}
