import type { Nan0KernelState, Nan0StateStore } from '../types'

export class LocalStorageStateStore implements Nan0StateStore {
  constructor(private readonly key = 'nan0/kernel-state/v1') {}

  async load(): Promise<Nan0KernelState | null> {
    const raw = globalThis.localStorage?.getItem(this.key)
    if (!raw)
      return null

    const parsed = JSON.parse(raw) as Nan0KernelState
    if (parsed.schemaVersion !== 1)
      throw new Error(`Unsupported Nan0 state schema: ${String(parsed.schemaVersion)}`)

    return parsed
  }

  async save(state: Nan0KernelState): Promise<void> {
    if (!globalThis.localStorage)
      throw new Error('localStorage is unavailable in this runtime.')

    globalThis.localStorage.setItem(this.key, JSON.stringify(state))
  }
}
