import type {
  Nan0HostBindings,
  Nan0Observation,
} from '../types'
import type { Nan0Kernel } from '../kernel/Nan0Kernel'

export class Nan0HostAdapter {
  private unsubscribeHost: (() => void) | null = null
  private unsubscribeKernel: (() => void) | null = null
  private started = false

  constructor(
    private readonly kernel: Nan0Kernel,
    private readonly host: Nan0HostBindings,
  ) {}

  async start(): Promise<void> {
    if (this.started)
      return

    await this.kernel.boot()

    this.unsubscribeHost = this.host.subscribeObservations((observation) => {
      void this.handleObservation(observation)
    })

    this.unsubscribeKernel = this.kernel.onExpression((expression) => {
      void this.host.dispatchExpression(expression)
    })

    this.started = true
  }

  async stop(): Promise<void> {
    if (!this.started)
      return

    this.unsubscribeHost?.()
    this.unsubscribeKernel?.()
    this.unsubscribeHost = null
    this.unsubscribeKernel = null

    await this.kernel.shutdown()
    this.started = false
  }

  private async handleObservation(observation: Nan0Observation): Promise<void> {
    try {
      await this.kernel.observe(observation)
    }
    catch (error) {
      console.error('[Nan0HostAdapter] Failed to process observation.', {
        observationId: observation.id,
        source: observation.source,
        error,
      })
    }
  }
}
