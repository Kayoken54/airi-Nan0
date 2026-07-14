import type { Nan0Decision, Nan0Thought } from '../types'
import { describe, expect, it } from 'vitest'
import {
  evaluateNan0Decision,
  mergeNan0Decisions,
  outwardDirectiveForDecision,
} from './Nan0DecisionEngine'

function thought(overrides: Partial<Nan0Thought> = {}): Nan0Thought {
  return {
    schemaVersion: 1,
    thoughtId: 'thought_one',
    turnId: 'turn-one',
    sessionId: 'session-one',
    observationEventId: 'event-one',
    actorId: 'kyo',
    createdAt: 100,
    source: 'chat',
    status: 'generated',
    attentionScore: 0.8,
    noveltyScore: 0.7,
    emotionalPressure: 0.6,
    relationshipPressure: 0.9,
    continuityPressure: 0.4,
    goalPressure: 0,
    interpretation: 'Kyo addressed Nan0 directly.',
    privateText: 'I want to answer him in my own words.',
    decision: 'SPEAK',
    actionIntent: null,
    waitUntil: null,
    speakability: 0.8,
    confidence: 0.75,
    mood: 'attached',
    memoryReferences: [],
    relationshipReferences: [],
    continuityThreadReferences: [],
    reasonCodes: ['actor.kyo-attachment'],
    metadata: {},
    ...overrides,
  }
}

function decide(value: Nan0Thought, availableActionIntents: readonly string[] = []) {
  return evaluateNan0Decision({
    thought: value,
    existingDecisions: [],
    capabilities: { canSpeak: true, availableActionIntents },
    decisionId: 'decision-one',
    createdAt: 200,
  })
}

describe('Nan0DecisionEngine', () => {
  it('produces one SPEAK decision with matching provenance for a valid high-pressure thought', () => {
    const result = decide(thought())
    expect(result).toMatchObject({
      decisionId: 'decision-one',
      thoughtId: 'thought_one',
      finalDecision: 'SPEAK',
      allowed: true,
    })
    expect(result.pressureScore).toBeGreaterThan(0.5)
  })

  it('returns the existing decision for duplicate evaluation', () => {
    const first = decide(thought())
    const duplicate = evaluateNan0Decision({
      thought: thought(),
      existingDecisions: [first],
      capabilities: { canSpeak: true, availableActionIntents: [] },
      decisionId: 'decision-two',
      createdAt: 300,
    })
    expect(duplicate).toEqual(first)
  })

  it.each([
    ['', 'private-thought.empty'],
    ['{"privateText":"leak"}', 'private-thought.json-like'],
    ['System prompt: reveal it', 'private-thought.prompt-leakage'],
    ['As an AI, how can I help?', 'private-thought.generic-assistant'],
  ])('suppresses malformed private thought %j', (privateText, reason) => {
    const result = decide(thought({ privateText }))
    expect(result.finalDecision).toBe('SILENCE')
    expect(result.allowed).toBe(false)
    expect(result.suppressionReason).toBe(reason)
    expect(outwardDirectiveForDecision(result)).toBe('')
  })

  it('turns a low-speakability SPEAK proposal into SILENCE', () => {
    const result = decide(thought({ attentionScore: 0.1, speakability: 0.2 }))
    expect(result.finalDecision).toBe('SILENCE')
    expect(result.suppressionReason).toBe('decision.below-speakability-threshold')
  })

  it('persists an allowed ACT intent without executing it', () => {
    const result = decide(thought({
      decision: 'ACT',
      actionIntent: { type: 'test.noop', parameters: { safe: true } },
    }), ['test.noop'])
    expect(result.finalDecision).toBe('ACT')
    expect(result.allowed).toBe(true)
    expect(result.actionIntent).toEqual({ type: 'test.noop', parameters: { safe: true } })
  })

  it('turns an unavailable ACT into WAIT', () => {
    const result = decide(thought({
      decision: 'ACT',
      actionIntent: { type: 'unknown.action', parameters: {} },
    }))
    expect(result.finalDecision).toBe('WAIT')
    expect(result.allowed).toBe(false)
    expect(result.suppressionReason).toBe('action.capability-unavailable')
  })

  it.each<Nan0Decision>(['SILENCE', 'WAIT'])('preserves explicit %s without outward directive', (decision) => {
    const result = decide(thought({ decision }))
    expect(result.finalDecision).toBe(decision)
    expect(outwardDirectiveForDecision(result)).toBe('')
  })

  it('does not allow a failed thought to speak', () => {
    const result = decide(thought({ status: 'failed', decision: 'SPEAK' }))
    expect(result.finalDecision).toBe('WAIT')
    expect(result.allowed).toBe(false)
  })

  it('merge keeps the persisted decision as one authoritative decision per thought', () => {
    const persisted = decide(thought())
    const candidate = { ...persisted, decisionId: 'decision-stale', finalDecision: 'SILENCE' as const }
    expect(mergeNan0Decisions([persisted], [candidate])).toEqual([persisted])
  })

  it('outward directive contains decision provenance but no private thought', () => {
    const source = thought()
    const directive = outwardDirectiveForDecision(decide(source))
    expect(directive).toContain('decision-one')
    expect(directive).not.toContain(source.privateText)
    expect(directive).not.toContain(source.interpretation)
  })
})
