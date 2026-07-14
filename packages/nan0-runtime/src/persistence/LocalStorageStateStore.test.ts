import type { Nan0DecisionRecord, Nan0KernelState, Nan0MemoryRecord } from '../types'
import { describe, expect, it } from 'vitest'

import { createDefaultIdentityState, nan0Ownership } from '../identity/ActorIdentity'
import { createEmptyContinuityState } from '../continuity/ConversationContinuity'
import { createEmptyRelationshipState } from '../relationship/RelationshipMemory'
import { createEmptyTimelineState } from '../timeline/SessionTimeline'
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
    thoughts: overrides.thoughts ?? [],
    decisions: overrides.decisions ?? [],
    turns: [],
    timeline: createEmptyTimelineState(),
    continuity: createEmptyContinuityState(),
    ...overrides,
    relationships: overrides.relationships ?? createEmptyRelationshipState(1),
  }
}

function decision(): Nan0DecisionRecord {
  return {
    schemaVersion: 1,
    decisionId: 'decision-1',
    thoughtId: 'thought-1',
    turnId: 'turn-1',
    sessionId: 'session-1',
    createdAt: 15,
    proposedDecision: 'SPEAK',
    finalDecision: 'SPEAK',
    allowed: true,
    confidence: 0.8,
    speakability: 0.9,
    attentionScore: 0.8,
    pressureScore: 0.7,
    reasonCodes: ['actor.kyo-attachment'],
    constraintResults: [],
    suppressionReason: null,
    actionIntent: null,
    waitUntil: null,
    metadata: { policy: 'nan0-decision-v1' },
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

  it('reloads a decision exactly once and prevents a stale writer from removing it', async () => {
    const storage = new TestStorage()
    const currentWriter = new LocalStorageStateStore('nan0-test', { storage })
    const staleWriter = new LocalStorageStateStore('nan0-test', { storage })
    const staleSnapshot = await currentWriter.save(state([]))

    await currentWriter.save(state([], { decisions: [decision()] }))
    await staleWriter.save(staleSnapshot)

    const reloaded = await currentWriter.load()
    expect(reloaded?.decisions).toEqual([decision()])
  })

  it('prevents a stale renderer from removing a completed turn or its timeline output', async () => {
    const storage = new TestStorage()
    const currentWriter = new LocalStorageStateStore('nan0-test', { storage })
    const staleWriter = new LocalStorageStateStore('nan0-test', { storage })
    const input = memory('input-1', 'kyo', 'thought-1')
    const output = memory('output-1', 'nan0', 'thought-1')
    const timeline = createEmptyTimelineState()
    const inputEvent = {
      schemaVersion: 1 as const,
      eventId: 'event-input',
      eventType: 'input',
      actorId: 'kyo',
      source: 'chat' as const,
      sessionId: 'session-1',
      turnId: 'turn-1',
      thoughtId: 'thought-1',
      observedAt: 10,
      recordedAt: 10,
      sequence: 1,
      memoryReference: 'input-1',
      metadata: {},
    }
    const preparedTurn = {
      schemaVersion: 1 as const,
      turnId: 'turn-1',
      thoughtId: 'thought-1',
      sessionId: 'session-1',
      sequence: 1,
      source: 'chat' as const,
      startedAt: 10,
      completedAt: null,
      elapsedMs: null,
      inputEventId: 'event-input',
      outputEventId: null,
      inputActorId: 'kyo',
      outputActorId: null,
      inputContentReference: 'input-1',
      outputContentReference: null,
      decision: 'UNKNOWN' as const,
      status: 'prepared' as const,
      metadata: {},
    }
    const staleSnapshot = await currentWriter.save(state([input], {
      turns: [preparedTurn],
      timeline: { ...timeline, nextSequence: 2, nextTurnSequence: 2, events: [inputEvent] },
    }))
    await currentWriter.save(state([input, output], {
      turns: [{
        ...preparedTurn,
        completedAt: 20,
        elapsedMs: 10,
        outputEventId: 'event-output',
        outputActorId: 'nan0',
        outputContentReference: 'output-1',
        decision: 'SPEAK',
        status: 'completed',
      }],
      timeline: {
        ...timeline,
        nextSequence: 3,
        nextTurnSequence: 2,
        events: [inputEvent, {
          ...inputEvent,
          eventId: 'event-output',
          eventType: 'output',
          actorId: 'nan0',
          observedAt: 20,
          recordedAt: 20,
          sequence: 2,
          memoryReference: 'output-1',
        }],
      },
    }))
    await staleWriter.save(staleSnapshot)

    const persisted = await currentWriter.load()
    expect(persisted?.memories.map(item => item.id)).toEqual(['input-1', 'output-1'])
    expect(persisted?.turns).toHaveLength(1)
    expect(persisted?.turns[0]).toMatchObject({ status: 'completed', outputActorId: 'nan0' })
    expect(persisted?.timeline.events.map(event => event.eventId)).toEqual(['event-input', 'event-output'])
    expect(persisted?.turns[0].thoughtId).toBe('thought-1')
  })

  it('prevents a stale snapshot from removing newer continuity membership or unresolved state', async () => {
    const storage = new TestStorage()
    const currentWriter = new LocalStorageStateStore('nan0-test', { storage })
    const staleWriter = new LocalStorageStateStore('nan0-test', { storage })
    const baseThread = {
      schemaVersion: 1 as const,
      threadId: 'thread-1',
      status: 'active' as const,
      createdAt: 10,
      updatedAt: 10,
      lastActiveAt: 10,
      participantActorIds: ['kyo', 'nan0'],
      topicLabels: ['garden'],
      turnIds: ['turn-1'],
      timelineEventIds: ['event-1'],
      summary: 'Garden question.',
      unresolvedItems: [],
      importance: 0.5,
      activation: 1,
      metadata: {},
    }
    const staleSnapshot = await currentWriter.save(state([], {
      continuity: {
        schemaVersion: 1,
        activeThreadByActorId: { kyo: 'thread-1' },
        threads: [baseThread],
      },
    }))
    await currentWriter.save({
      ...staleSnapshot,
      continuity: {
        schemaVersion: 1,
        activeThreadByActorId: { kyo: 'thread-1' },
        threads: [{
          ...baseThread,
          updatedAt: 20,
          lastActiveAt: 20,
          turnIds: ['turn-1', 'turn-2'],
          timelineEventIds: ['event-1', 'event-2'],
          unresolvedItems: [{
            itemId: 'unresolved:turn-2',
            kind: 'question',
            text: 'Will it survive?',
            actorId: 'kyo',
            createdAt: 20,
            sourceTurnId: 'turn-2',
            resolvedAt: null,
            metadata: {},
          }],
        }],
      },
    })
    await staleWriter.save(staleSnapshot)

    const persisted = await currentWriter.load()
    expect(persisted?.continuity.threads).toHaveLength(1)
    expect(persisted?.continuity.threads[0].turnIds).toEqual(['turn-1', 'turn-2'])
    expect(persisted?.continuity.threads[0].timelineEventIds).toEqual(['event-1', 'event-2'])
    expect(persisted?.continuity.threads[0].unresolvedItems).toHaveLength(1)
  })
})
