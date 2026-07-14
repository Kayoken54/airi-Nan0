import type { Nan0KernelState, Nan0StateStore } from '../types'
import {
  createEmptyTimelineState,
  mergeConversationTurns,
  mergeTimelineStates,
  normalizeConversationTurns,
  normalizeTimelineState,
} from '../timeline/SessionTimeline'

export interface Nan0StorageLike {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export interface LocalStorageStateStoreOptions {
  storage?: Nan0StorageLike
  diagnostic?: (event: string, details: Record<string, unknown>) => void
}

export function mergeNan0States(
  persisted: Nan0KernelState | null,
  candidate: Nan0KernelState,
): Nan0KernelState {
  if (!persisted) {
    return {
      ...candidate,
      revision: (candidate.revision ?? 0) + 1,
      turns: normalizeConversationTurns(candidate.turns),
      timeline: normalizeTimelineState(candidate.timeline),
    }
  }

  const memories = [...persisted.memories]
  const persistedMemoryIds = new Set(memories.map(memory => memory.id))
  for (const memory of candidate.memories) {
    if (!persistedMemoryIds.has(memory.id)) {
      memories.push(memory)
      persistedMemoryIds.add(memory.id)
    }
  }

  return {
    ...candidate,
    revision: Math.max(persisted.revision ?? 0, candidate.revision ?? 0) + 1,
    bootCount: Math.max(persisted.bootCount, candidate.bootCount),
    createdAt: Math.min(persisted.createdAt, candidate.createdAt),
    identity: {
      actors: {
        ...candidate.identity.actors,
        ...persisted.identity.actors,
      },
      aliases: {
        ...candidate.identity.aliases,
        ...persisted.identity.aliases,
      },
    },
    memories,
    turns: mergeConversationTurns(persisted.turns, candidate.turns),
    timeline: mergeTimelineStates(persisted.timeline, candidate.timeline),
  }
}

export class LocalStorageStateStore implements Nan0StateStore {
  private readonly storage: Nan0StorageLike | undefined

  constructor(
    private readonly key = 'nan0/kernel-state/v1',
    private readonly options: LocalStorageStateStoreOptions = {},
  ) {
    this.storage = options.storage ?? globalThis.localStorage
  }

  async load(): Promise<Nan0KernelState | null> {
    const raw = this.storage?.getItem(this.key)
    if (!raw)
      return null

    const parsed = JSON.parse(raw) as Nan0KernelState
    if (parsed.schemaVersion !== 1)
      throw new Error(`Unsupported Nan0 state schema: ${String(parsed.schemaVersion)}`)

    const state = {
      ...parsed,
      revision: parsed.revision ?? 0,
      turns: normalizeConversationTurns(parsed.turns),
      timeline: parsed.timeline
        ? normalizeTimelineState(parsed.timeline)
        : createEmptyTimelineState(),
    }
    this.options.diagnostic?.('state.load', {
      revision: state.revision,
      memoryCount: state.memories.length,
      turnCount: state.turns.length,
      timelineEventCount: state.timeline.events.length,
      bootCount: state.bootCount,
    })
    return state
  }

  async save(state: Nan0KernelState): Promise<Nan0KernelState> {
    if (!this.storage)
      throw new Error('localStorage is unavailable in this runtime.')

    const before = await this.load()
    const merged = mergeNan0States(before, state)
    this.storage.setItem(this.key, JSON.stringify(merged))
    this.options.diagnostic?.('state.save', {
      previousRevision: before?.revision ?? 0,
      revision: merged.revision,
      candidateMemoryCount: state.memories.length,
      previousMemoryCount: before?.memories.length ?? 0,
      memoryCount: merged.memories.length,
      turnCount: merged.turns.length,
      timelineEventCount: merged.timeline.events.length,
      thoughtId: merged.lastThoughtId,
    })
    return structuredClone(merged)
  }
}
