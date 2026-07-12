import type { Nan0KernelState, Nan0MemoryRecord } from '../types'
import { describe, expect, it } from 'vitest'

import { createDefaultIdentityState, nan0Ownership } from '../identity/ActorIdentity'
import { LocalStorageStateStore } from './LocalStorageStateStore'

class TestStorage {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

function memory(
  id: string,
  actorId: 'kyo' | 'nan0',
  thoughtId: string,
): Nan0MemoryRecord {
  const ownership = actorId === 'kyo'
    ? {
        actorId: 'kyo',
        displayName: 'Kyo',
        kind: 'kyo',
        source: 'chat',
        rawActorId: 'kyo',
        actorRole: 'Kyo is the one who spoke or acted.',
        nan0Role: 'Nan0 is the observer/reactor, not the actor who did Kyo\'s action.',
        ownershipRule: 'Kyo\'s first-person statements belong to Kyo and must never become Nan0\'s actions or memories.',
      }
    : nan0Ownership()

  return {
    id,
    kind: 'event',
    actorId,
    content: `${actorId}-${id}`,
    tags: actorId === 'kyo' ? ['chat', 'user-input'] : ['assistant-output', 'nan0-expression'],
    createdAt: actorId === 'kyo' ? 10 : 20,
    metadata: {
      thoughtId,
      ownership,
    },
  }
}

function state(memories: Nan0MemoryRecord[], overrides: Partial<Nan0KernelState> = {}): Nan0KernelState {
  return {
    schemaVersion: 1,
    revision: 0,
    bootCount: 1,
    createdAt: 1,
    updatedAt: 1,
    emotionalState: {},
    runtimeMetadata: {},
    identity: createDefaultIdentityState(),
    memories,
    ...overrides,
  }
}

describe('LocalStorageStateStore multi-renderer safety', () => {
  it('prevents a stale writer from removing a newer assistant record', async () => {
    const storage = new TestStorage()
    const currentWriter = new LocalStorageStateStore('nan0-test', { storage })
    const staleWriter = new LocalStorageStateStore('nan0-test', { storage })
    const input = memory('input-1', 'kyo', 'thought-1')
    const output = memory('output-1', 'nan0', 'thought-1')

    const staleSnapshot = await currentWriter.save(state([input]))
    await currentWriter.save({ ...staleSnapshot, memories: [input, output] })
    await staleWriter.save(staleSnapshot)

    const persisted = await currentWriter.load()
    expect(persisted?.memories.map(item => item.id)).toEqual(['input-1', 'output-1'])
  })

  it('merge preserves Kyo input, Nan0 output, ownership, and shared thought provenance', async () => {
    const storage = new TestStorage()
    const store = new LocalStorageStateStore('nan0-test', { storage })
    const input = memory('input-1', 'kyo', 'thought-1')
    const output = memory('output-1', 'nan0', 'thought-1')

    await store.save(state([input]))
    const persisted = await store.save(state([output], { lastThoughtId: 'thought-1' }))

    expect(persisted.memories).toHaveLength(2)
    expect(persisted.memories.map(item => item.actorId)).toEqual(['kyo', 'nan0'])
    expect(persisted.memories.map(item => item.metadata.thoughtId)).toEqual(['thought-1', 'thought-1'])
    expect(persisted.memories[0].metadata.ownership).toMatchObject({ actorId: 'kyo' })
    expect(persisted.memories[1].metadata.ownership).toMatchObject({ actorId: 'nan0' })
  })

  it('reloads both records exactly once with a monotonic persisted revision', async () => {
    const storage = new TestStorage()
    const first = new LocalStorageStateStore('nan0-test', { storage })
    const input = memory('input-1', 'kyo', 'thought-1')
    const output = memory('output-1', 'nan0', 'thought-1')

    const firstSave = await first.save(state([input, output]))
    const second = new LocalStorageStateStore('nan0-test', { storage })
    const reloaded = await second.load()

    expect(reloaded?.revision).toBe(firstSave.revision)
    expect(reloaded?.memories.map(item => item.id)).toEqual(['input-1', 'output-1'])
    expect(new Set(reloaded?.memories.map(item => item.id)).size).toBe(2)
  })
})
