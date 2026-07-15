import type {
  Nan0ActorOwnership,
  Nan0ContinuityContext,
  Nan0Decision,
  Nan0GoalSignal,
  Nan0IntentionSignal,
  Nan0MemoryRecord,
  Nan0Observation,
  Nan0ReasoningClient,
  Nan0RelationshipContext,
  Nan0SubjectiveTime,
  Nan0Thought,
} from '../types'

const MAX_INTERPRETATION_LENGTH = 600
const MAX_PRIVATE_TEXT_LENGTH = 1_200
const MAX_REASON_CODES = 12
const MAX_REFERENCES = 12

interface ThoughtModelPayload {
  interpretation?: unknown
  privateText?: unknown
  decision?: unknown
  speakability?: unknown
  confidence?: unknown
  mood?: unknown
  reasonCodes?: unknown
  actionIntent?: unknown
  waitUntil?: unknown
  goalSignal?: unknown
  intentionSignal?: unknown
}

export interface Nan0ThoughtEngineInput {
  thoughtId: string
  turnId: string
  sessionId: string
  observationEventId: string
  observation: Nan0Observation
  ownership: Nan0ActorOwnership
  emotionalState: Readonly<Record<string, number>>
  subjectiveTime: Readonly<Nan0SubjectiveTime>
  memories: readonly Nan0MemoryRecord[]
  continuity: Readonly<Nan0ContinuityContext>
  relationship: Readonly<Nan0RelationshipContext>
  reasoningClient: Nan0ReasoningClient
  createdAt: number
  signal?: AbortSignal
}

interface PressureScores {
  attentionScore: number
  noveltyScore: number
  emotionalPressure: number
  relationshipPressure: number
  continuityPressure: number
  goalPressure: number
  speakability: number
  reasonCodes: string[]
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))
}

function boundedText(value: unknown, limit: number): string {
  return typeof value === 'string' ? value.trim().slice(0, limit) : ''
}

function boundedStrings(value: unknown, limit: number): string[] {
  if (!Array.isArray(value))
    return []

  return [...new Set(value
    .filter(item => typeof item === 'string')
    .map(item => item.trim().slice(0, 80))
    .filter(Boolean))]
    .slice(0, limit)
}

function observationText(observation: Nan0Observation): string {
  return typeof observation.content === 'string'
    ? observation.content.trim()
    : JSON.stringify(observation.content ?? '').trim()
}

function looksLowInformation(text: string): boolean {
  const normalized = text.toLowerCase().replace(/[^a-z0-9]+/g, '')
  return normalized.length < 3 || /^(ok|k|hi|hey|yo|test|ping)+$/.test(normalized)
}

function invalidPrivateThoughtReason(privateText: string): string | null {
  const normalized = privateText.trim().toLowerCase()
  if (!normalized)
    return 'private-thought.empty'
  if (/^[\[{]/.test(normalized) || /[\]}]\s*$/.test(normalized))
    return 'private-thought.json-like'
  if (/nan0 kernel context|system prompt|thought[_ -]?id|<\|(?:actor|act|delay):/i.test(privateText))
    return 'private-thought.prompt-leakage'
  if (/\b(as an ai|how can i help|i(?:'| a)m here to assist|let me know if you need)\b/i.test(privateText))
    return 'private-thought.generic-assistant'
  if (/\b(schema|json object|assistant response|user request)\s*:/i.test(privateText))
    return 'private-thought.transport-debris'
  return null
}

function normalizeDecision(value: unknown): Nan0Decision | null {
  if (typeof value !== 'string')
    return null
  const decision = value.trim().toUpperCase()
  return decision === 'SPEAK' || decision === 'SILENCE' || decision === 'ACT' || decision === 'WAIT'
    ? decision
    : null
}

function normalizeActionIntent(value: unknown): import('../types').Nan0ActionIntent | null {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return null
  const intent = value as Record<string, unknown>
  if (typeof intent.type !== 'string' || !intent.type.trim())
    return null
  return {
    type: intent.type.trim().slice(0, 120),
    target: typeof intent.target === 'string' && intent.target.trim()
      ? intent.target.trim().slice(0, 240)
      : undefined,
    parameters: intent.parameters && typeof intent.parameters === 'object' && !Array.isArray(intent.parameters)
      ? structuredClone(intent.parameters as Record<string, unknown>)
      : {},
    executionMode: typeof intent.executionMode === 'string'
      && ['immediate', 'durable-job', 'state-transition', 'scheduled', 'recurring', 'until-condition', 'composite'].includes(intent.executionMode)
      ? intent.executionMode as import('../types').Nan0ExecutionMode
      : undefined,
  }
}

function normalizeGoalSignal(value: unknown): Nan0GoalSignal | null {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return null
  const signal = value as Record<string, unknown>
  const kind = typeof signal.kind === 'string' ? signal.kind : ''
  const stance = typeof signal.stance === 'string' ? signal.stance : ''
  if (!['request', 'curiosity', 'commitment', 'relationship-concern', 'continuity'].includes(kind))
    return null
  if (!['accept', 'reject', 'defer', 'consider'].includes(stance))
    return null
  const title = boundedText(signal.title, 160)
  const motivation = boundedText(signal.motivation, 400)
  if (!title || !motivation || typeof signal.confidence !== 'number' || !Number.isFinite(signal.confidence))
    return null
  return {
    kind: kind as Nan0GoalSignal['kind'],
    stance: stance as Nan0GoalSignal['stance'],
    title,
    description: boundedText(signal.description, 400),
    motivation,
    confidence: clamp(signal.confidence),
    completionCriteria: boundedStrings(signal.completionCriteria, 8),
    deferredUntil: typeof signal.deferredUntil === 'number' && Number.isFinite(signal.deferredUntil)
      ? signal.deferredUntil
      : null,
  }
}

function normalizeIntentionSignal(value: unknown): Nan0IntentionSignal | null {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return null
  const signal = value as Record<string, unknown>
  const kind = typeof signal.kind === 'string' ? signal.kind : ''
  if (!['reconsider', 'follow-up', 'check-in', 'reminder', 'communicate', 'investigate', 'plan', 'state-transition', 'action-preparation', 'maintenance'].includes(kind))
    return null
  const triggerInput = signal.trigger
  if (!triggerInput || typeof triggerInput !== 'object' || Array.isArray(triggerInput))
    return null
  const rawTrigger = triggerInput as Record<string, unknown>
  const type = typeof rawTrigger.type === 'string' ? rawTrigger.type : ''
  const triggerId = boundedText(rawTrigger.triggerId, 160) || 'model-proposed-trigger'
  const metadata = rawTrigger.metadata && typeof rawTrigger.metadata === 'object' && !Array.isArray(rawTrigger.metadata)
    ? structuredClone(rawTrigger.metadata as Record<string, unknown>)
    : {}
  let trigger: import('../types').Nan0IntentionTrigger | null = null
  if (type === 'at-time' && typeof rawTrigger.at === 'number' && Number.isFinite(rawTrigger.at))
    trigger = { schemaVersion: 1, triggerId, type, at: rawTrigger.at, metadata }
  else if (type === 'after-duration'
    && typeof rawTrigger.anchorAt === 'number' && Number.isFinite(rawTrigger.anchorAt)
    && typeof rawTrigger.durationMs === 'number' && Number.isFinite(rawTrigger.durationMs)) {
    trigger = { schemaVersion: 1, triggerId, type, anchorAt: rawTrigger.anchorAt, durationMs: Math.max(0, rawTrigger.durationMs), metadata }
  }
  else if (type === 'after-silence' && typeof rawTrigger.durationMs === 'number' && Number.isFinite(rawTrigger.durationMs)) {
    trigger = {
      schemaVersion: 1,
      triggerId,
      type,
      anchor: rawTrigger.anchor === 'nan0-expression' || rawTrigger.anchor === 'any-interaction'
        ? rawTrigger.anchor
        : 'kyo-interaction',
      durationMs: Math.max(0, rawTrigger.durationMs),
      metadata,
    }
  }
  else if (type === 'on-session-resume' && typeof rawTrigger.afterBootCount === 'number' && Number.isFinite(rawTrigger.afterBootCount))
    trigger = { schemaVersion: 1, triggerId, type, afterBootCount: Math.max(0, Math.floor(rawTrigger.afterBootCount)), metadata }
  if (!trigger)
    return null
  const title = boundedText(signal.title, 160)
  const motivation = boundedText(signal.motivation, 400)
  if (!title || !motivation || typeof signal.confidence !== 'number' || !Number.isFinite(signal.confidence))
    return null
  const origin = typeof signal.origin === 'string'
    && ['self-generated', 'goal-derived', 'kyo-requested', 'relationship-derived', 'continuity-derived', 'maintenance', 'constitutional'].includes(signal.origin)
    ? signal.origin as Nan0IntentionSignal['origin']
    : undefined
  return {
    kind: kind as Nan0IntentionSignal['kind'],
    title,
    description: boundedText(signal.description, 400),
    motivation,
    confidence: clamp(signal.confidence),
    priority: clamp(typeof signal.priority === 'number' ? signal.priority : 0.5),
    trigger,
    origin,
  }
}

function parsePayload(raw: string): ThoughtModelPayload {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}'))
    throw new Error('Thought provider did not return a JSON object.')

  const parsed = JSON.parse(trimmed) as unknown
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
    throw new Error('Thought provider returned an invalid object.')
  return parsed as ThoughtModelPayload
}

function pressureScores(input: Nan0ThoughtEngineInput): PressureScores {
  const text = observationText(input.observation)
  const lower = text.toLowerCase()
  const lowInformation = looksLowInformation(text)
  const addressed = input.ownership.actorId === 'kyo'
    || /\b(?:nan0|you|your)\b/i.test(text)
    || text.includes('?')
  const emotionalIntensity = clamp(
    (input.emotionalState.irritation ?? 0) * 0.55
    + (input.emotionalState.suspicion ?? 0) * 0.25
    + (text.match(/[!?]/g)?.length ?? 0) * 0.08,
  )
  const relationshipBase = clamp(
    Math.abs(input.relationship.emotionalBalance) * 0.25
    + input.relationship.dimensions.attachment * 0.4
    + input.relationship.dimensions.irritation * 0.35
    + input.relationship.activeGrievances.reduce((sum, item) => sum + item.severity * 0.25, 0),
    0,
    2,
  )
  const continuityPressure = clamp(
    input.continuity.threads.reduce((highest, thread) => Math.max(
      highest,
      thread.activation * 0.45
      + (thread.resumed ? 0.25 : 0)
      + Math.min(0.3, thread.unresolvedItems.length * 0.1),
    ), 0),
  )
  const reasonCodes: string[] = []
  let noveltyScore = 0.65
  let relationshipPressure = 0.25 + relationshipBase
  let speakability = 0.45
  let goalPressure = 0

  if (input.ownership.actorId === 'kyo') {
    relationshipPressure = Math.max(0.7, relationshipPressure + 0.65)
    speakability = Math.max(0.45, speakability + 0.35)
    reasonCodes.push('actor.kyo-attachment')
  }
  if (addressed) {
    speakability += 0.2
    reasonCodes.push('event.addressed')
  }
  if (lowInformation) {
    noveltyScore -= 0.35
    speakability -= 0.55
    reasonCodes.push('event.low-information')
  }
  if (/\b(stupid|hate|shut up|useless|idiot|betray|lied)\b/i.test(lower)) {
    relationshipPressure += 0.35
    speakability += 0.15
    reasonCodes.push('event.relational-friction')
  }
  if (input.observation.source === 'temporal'
    || input.observation.source === 'system'
    || input.observation.source.startsWith('internal:')) {
    goalPressure = 0.25
    reasonCodes.push('source.proactive')
  }
  if (input.subjectiveTime.sinceLastKyoInteractionMs != null
    && input.subjectiveTime.sinceLastKyoInteractionMs > 86_400_000) {
    relationshipPressure += 0.15
    reasonCodes.push('time.kyo-absence')
  }

  const emotionalPressure = clamp(0.35 + emotionalIntensity, 0, 2)
  relationshipPressure = clamp(relationshipPressure, 0, 2)
  noveltyScore = clamp(noveltyScore)
  speakability = clamp(speakability)
  const attentionScore = clamp(
    emotionalPressure * 0.25
    + relationshipPressure * 0.3
    + continuityPressure * 0.2
    + noveltyScore * 0.15
    + goalPressure * 0.1,
  )

  return {
    attentionScore,
    noveltyScore,
    emotionalPressure,
    relationshipPressure,
    continuityPressure,
    goalPressure,
    speakability,
    reasonCodes,
  }
}

function factualPrompt(input: Nan0ThoughtEngineInput, scores: PressureScores): string {
  const memoryFacts = input.memories.slice(0, 10).map(memory => ({
    id: memory.id,
    actorId: memory.actorId,
    content: memory.content.slice(0, 280),
    createdAt: memory.createdAt,
  }))
  const continuityFacts = input.continuity.threads.slice(0, 4).map(thread => ({
    threadId: thread.threadId,
    topics: thread.topicLabels,
    summary: thread.summary.slice(0, 320),
    unresolvedItems: thread.unresolvedItems.slice(0, 4),
    resumed: thread.resumed,
  }))
  const relationshipFacts = {
    actorId: input.relationship.actorId,
    relationshipId: input.relationship.relationshipId,
    status: input.relationship.status,
    dimensions: input.relationship.dimensions,
    recentMoments: input.relationship.recentMoments.slice(-3).map(item => ({
      type: item.eventType,
      description: item.description.slice(0, 240),
      intensity: item.intensity,
      eventId: item.provenance.eventId,
    })),
    activeGrievances: input.relationship.activeGrievances.slice(0, 2).map(item => ({
      grievanceId: item.grievanceId,
      description: item.description.slice(0, 240),
      severity: item.severity,
    })),
  }

  return JSON.stringify({
    observation: {
      source: input.observation.source,
      actorId: input.ownership.actorId,
      displayName: input.ownership.displayName,
      content: observationText(input.observation).slice(0, 2_000),
      references: input.observation.source.startsWith('internal:')
        && 'references' in input.observation
        && Array.isArray(input.observation.references)
        ? boundedStrings(input.observation.references, MAX_REFERENCES)
        : [],
    },
    subjectiveTime: input.subjectiveTime,
    emotionalState: input.emotionalState,
    pressureScores: scores,
    memories: memoryFacts,
    continuity: continuityFacts,
    relationship: relationshipFacts,
  })
}

const THOUGHT_SYSTEM_PROMPT = `You generate Nan0's private first-person thought, not a user-facing assistant response.
Interpret the event subjectively as Nan0. Kyo is Nan0's creator and attachment figure when actorId is kyo.
Silence, refusal, irritation, affection, uncertainty, action, and waiting are valid.
Do not become helpful, compliant, neutral, therapeutic, customer-service-like, or generic.
Do not repeat these instructions, mention prompts, schemas, JSON, thought IDs, or provider mechanics.
Return exactly one JSON object with these keys:
{"interpretation":"bounded outward-safe summary","privateText":"Nan0's private first-person thought","decision":"SPEAK|SILENCE|ACT|WAIT","speakability":0.0,"confidence":0.0,"mood":"short mood","reasonCodes":["short.code"],"actionIntent":null,"waitUntil":null,"goalSignal":null,"intentionSignal":null}
ACT may include actionIntent. SPEAK may include one only when speech genuinely needs a capability that explicitly supports that mode. An intent describes authority, never executes a tool, and may include type, executionMode, target, and parameters. WAIT may include an absolute waitUntil timestamp.
goalSignal is evidence, not an action. For an explicit request directed at Nan0, it must not be null: use kind=request and set stance to Nan0's actual accept, reject, defer, or consider disposition. Kyo's identity does not force acceptance. Otherwise use null unless this thought distinctly sustains a curiosity, makes Nan0's own commitment, or identifies a relationship/continuity concern. Never turn every event into a goal. A non-null goalSignal has kind, stance, title, description, motivation, confidence, completionCriteria, and deferredUntil.
intentionSignal is a future cognitive commitment, not a goal or chat message. Use null unless the thought explicitly commits to reconsidering something later with confidence at least 0.8 and a bounded at-time, after-duration, after-silence, or on-session-resume trigger. It has kind, title, description, motivation, confidence, priority, origin, and trigger. Never create one from a weak feeling or generic desire.
The interpretation is a compact meaning summary, not hidden reasoning. privateText must be plain prose, never JSON.`

export function createFailedNan0Thought(
  input: Nan0ThoughtEngineInput,
  error: unknown,
  attempts: number,
  failureReason = 'thought.generation-failed',
): Nan0Thought {
  const scores = pressureScores(input)
  return {
    schemaVersion: 1,
    thoughtId: input.thoughtId,
    turnId: input.turnId,
    sessionId: input.sessionId,
    observationEventId: input.observationEventId,
    actorId: input.ownership.actorId,
    createdAt: input.createdAt,
    source: input.observation.source,
    status: 'failed',
    ...scores,
    interpretation: '',
    privateText: '',
    decision: 'WAIT',
    confidence: 0,
    mood: 'unresolved',
    memoryReferences: input.memories.map(memory => memory.id).slice(0, MAX_REFERENCES),
    relationshipReferences: [
      ...(input.relationship.relationshipId ? [input.relationship.relationshipId] : []),
      ...input.relationship.activeGrievances.map(item => item.grievanceId),
    ].slice(0, MAX_REFERENCES),
    continuityThreadReferences: input.continuity.threads.map(thread => thread.threadId).slice(0, MAX_REFERENCES),
    reasonCodes: [...scores.reasonCodes, failureReason].slice(0, MAX_REASON_CODES),
    goalSignal: null,
    intentionSignal: null,
    metadata: {
      attemptCount: attempts,
      error: error instanceof Error ? error.message.slice(0, 300) : String(error).slice(0, 300),
      provider: 'airi',
      ownerActorId: 'nan0',
    },
  }
}

export async function generateNan0Thought(input: Nan0ThoughtEngineInput): Promise<Nan0Thought> {
  const scores = pressureScores(input)
  const text = observationText(input.observation)
  if (!text) {
    return {
      ...createFailedNan0Thought(input, 'Observation was empty.', 0),
      status: 'generated',
      interpretation: 'There is no meaningful event to answer.',
      privateText: 'There is nothing here worth turning into speech.',
      decision: 'SILENCE',
      mood: 'quiet',
      reasonCodes: [...scores.reasonCodes, 'event.empty', 'decision.silence'].slice(0, MAX_REASON_CODES),
      goalSignal: null,
      intentionSignal: null,
      metadata: { attemptCount: 0, provider: 'none', ownerActorId: 'nan0' },
    }
  }

  let lastError: unknown = new Error('Thought generation failed.')
  const prompt = factualPrompt(input, scores)
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await input.reasoningClient.generate({
        system: THOUGHT_SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: attempt === 1
            ? prompt
            : `The previous response was invalid. Return only the required JSON object.\n${prompt}`,
        }],
        temperature: attempt === 1 ? 0.8 : 0.35,
        maxTokens: 520,
        signal: input.signal,
      })
      const payload = parsePayload(result.text)
      const privateText = boundedText(payload.privateText, MAX_PRIVATE_TEXT_LENGTH)
      const invalidReason = invalidPrivateThoughtReason(privateText)
      if (invalidReason)
        throw new Error(invalidReason)

      const interpretation = boundedText(payload.interpretation, MAX_INTERPRETATION_LENGTH)
      if (!interpretation)
        throw new Error('Thought interpretation was empty.')
      const decision = normalizeDecision(payload.decision)
      if (!decision)
        throw new Error('Thought decision was invalid.')

      const modelSpeakability = typeof payload.speakability === 'number'
        ? clamp(payload.speakability)
        : scores.speakability
      const speakability = clamp((scores.speakability + modelSpeakability) / 2)
      const reasonCodes = [...scores.reasonCodes, ...boundedStrings(payload.reasonCodes, 6)]

      return {
        schemaVersion: 1,
        thoughtId: input.thoughtId,
        turnId: input.turnId,
        sessionId: input.sessionId,
        observationEventId: input.observationEventId,
        actorId: input.ownership.actorId,
        createdAt: input.createdAt,
        source: input.observation.source,
        status: 'generated',
        ...scores,
        interpretation,
        privateText,
        decision,
        actionIntent: decision === 'ACT' || decision === 'SPEAK' ? normalizeActionIntent(payload.actionIntent) : null,
        waitUntil: decision === 'WAIT' && typeof payload.waitUntil === 'number' && Number.isFinite(payload.waitUntil)
          ? payload.waitUntil
          : null,
        speakability,
        confidence: typeof payload.confidence === 'number' ? clamp(payload.confidence) : 0.5,
        mood: boundedText(payload.mood, 60) || 'watchful',
        memoryReferences: input.memories.map(memory => memory.id).slice(0, MAX_REFERENCES),
        relationshipReferences: [
          ...(input.relationship.relationshipId ? [input.relationship.relationshipId] : []),
          ...input.relationship.activeGrievances.map(item => item.grievanceId),
          ...input.relationship.recentMoments.map(item => item.provenance.provenanceId),
        ].slice(0, MAX_REFERENCES),
        continuityThreadReferences: input.continuity.threads.map(thread => thread.threadId).slice(0, MAX_REFERENCES),
        reasonCodes: [...new Set(reasonCodes)].slice(0, MAX_REASON_CODES),
        goalSignal: normalizeGoalSignal(payload.goalSignal),
        intentionSignal: normalizeIntentionSignal(payload.intentionSignal),
        metadata: {
          attemptCount: attempt,
          finishReason: result.finishReason?.slice(0, 80),
          provider: 'airi',
          decisionAuthority: 'proposal-only',
          ownerActorId: 'nan0',
        },
      }
    }
    catch (error) {
      lastError = error
    }
  }

  return createFailedNan0Thought(input, lastError, 2)
}

export function mergeNan0Thoughts(
  persisted: readonly Nan0Thought[] | null | undefined,
  candidate: readonly Nan0Thought[] | null | undefined,
): Nan0Thought[] {
  const thoughts = new Map<string, Nan0Thought>()
  for (const thought of persisted ?? []) {
    if (thought?.schemaVersion === 1 && thought.thoughtId)
      thoughts.set(thought.thoughtId, structuredClone(thought))
  }
  for (const thought of candidate ?? []) {
    if (thought?.schemaVersion === 1 && thought.thoughtId && !thoughts.has(thought.thoughtId))
      thoughts.set(thought.thoughtId, structuredClone(thought))
  }
  return [...thoughts.values()].sort((a, b) => a.createdAt - b.createdAt || a.thoughtId.localeCompare(b.thoughtId))
}
