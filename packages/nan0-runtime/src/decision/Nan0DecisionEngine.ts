import type {
  Nan0ActionIntent,
  Nan0Decision,
  Nan0DecisionConstraintResult,
  Nan0DecisionRecord,
  Nan0Thought,
} from '../types'

export const NAN0_SPEAKABILITY_THRESHOLD = 0.35

export interface Nan0DecisionCapabilities {
  canSpeak: boolean
  availableActionIntents: readonly string[]
}

export interface Nan0DecisionEngineInput {
  thought: Readonly<Nan0Thought>
  existingDecisions: readonly Nan0DecisionRecord[]
  capabilities: Readonly<Nan0DecisionCapabilities>
  decisionId: string
  createdAt: number
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))
}

function privateThoughtViolation(privateText: string): string | null {
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

function normalizeActionIntent(value: Nan0ActionIntent | null | undefined): Nan0ActionIntent | null {
  if (!value || typeof value.type !== 'string' || !value.type.trim())
    return null
  return {
    type: value.type.trim().slice(0, 120),
    target: typeof value.target === 'string' && value.target.trim()
      ? value.target.trim().slice(0, 240)
      : undefined,
    parameters: value.parameters && typeof value.parameters === 'object' && !Array.isArray(value.parameters)
      ? structuredClone(value.parameters)
      : {},
  }
}

function pressureScore(thought: Readonly<Nan0Thought>): number {
  return clamp(
    clamp(thought.emotionalPressure) * 0.25
    + clamp(thought.relationshipPressure) * 0.3
    + clamp(thought.continuityPressure) * 0.2
    + clamp(thought.noveltyScore) * 0.15
    + clamp(thought.goalPressure) * 0.1,
  )
}

function constraintsFor(
  thought: Readonly<Nan0Thought>,
  capabilities: Readonly<Nan0DecisionCapabilities>,
  actionIntent: Nan0ActionIntent | null,
): Nan0DecisionConstraintResult[] {
  const privateViolation = privateThoughtViolation(thought.privateText)
  return [
    { code: 'thought.id-present', passed: /^thought_.+/.test(thought.thoughtId), hard: true },
    { code: 'thought.provenance-matches', passed: Boolean(thought.turnId && thought.sessionId), hard: true },
    { code: 'thought.status-generated', passed: thought.status === 'generated', hard: true },
    { code: privateViolation ?? 'thought.private-text-valid', passed: privateViolation == null, hard: true },
    { code: 'speech.capability-available', passed: capabilities.canSpeak, hard: false },
    {
      code: 'action.intent-valid',
      passed: thought.decision !== 'ACT' || actionIntent != null,
      hard: thought.decision === 'ACT',
    },
    {
      code: 'action.capability-available',
      passed: thought.decision !== 'ACT'
        || (actionIntent != null && capabilities.availableActionIntents.includes(actionIntent.type)),
      hard: false,
    },
  ]
}

export function evaluateNan0Decision(input: Nan0DecisionEngineInput): Nan0DecisionRecord {
  const existing = input.existingDecisions.find(item => item.thoughtId === input.thought.thoughtId)
  if (existing)
    return structuredClone(existing)

  const thought = input.thought
  const actionIntent = normalizeActionIntent(thought.actionIntent)
  const constraintResults = constraintsFor(thought, input.capabilities, actionIntent)
  const hardFailure = constraintResults.find(result => result.hard && !result.passed)
  const reasonCodes = [...new Set(thought.reasonCodes)]
  let finalDecision: Nan0Decision = thought.decision
  let allowed = true
  let suppressionReason: string | null = null

  if (thought.status === 'failed') {
    finalDecision = 'WAIT'
    allowed = false
    suppressionReason = 'thought.generation-failed'
  }
  else if (hardFailure) {
    finalDecision = 'SILENCE'
    allowed = false
    suppressionReason = hardFailure.code
  }
  else if (thought.decision === 'SPEAK') {
    if (!input.capabilities.canSpeak) {
      finalDecision = 'WAIT'
      allowed = false
      suppressionReason = 'speech.capability-unavailable'
    }
    else if (thought.speakability < NAN0_SPEAKABILITY_THRESHOLD) {
      finalDecision = 'SILENCE'
      allowed = false
      suppressionReason = 'decision.below-speakability-threshold'
    }
  }
  else if (thought.decision === 'ACT') {
    if (!actionIntent) {
      finalDecision = 'WAIT'
      allowed = false
      suppressionReason = 'action.intent-invalid'
    }
    else if (!input.capabilities.availableActionIntents.includes(actionIntent.type)) {
      finalDecision = 'WAIT'
      allowed = false
      suppressionReason = 'action.capability-unavailable'
    }
  }

  if (suppressionReason)
    reasonCodes.push(suppressionReason)

  return {
    schemaVersion: 1,
    decisionId: input.decisionId,
    thoughtId: thought.thoughtId,
    turnId: thought.turnId,
    sessionId: thought.sessionId,
    createdAt: input.createdAt,
    proposedDecision: thought.decision,
    finalDecision,
    allowed,
    confidence: clamp(thought.confidence),
    speakability: clamp(thought.speakability),
    attentionScore: clamp(thought.attentionScore),
    pressureScore: pressureScore(thought),
    reasonCodes: [...new Set(reasonCodes)].slice(0, 16),
    constraintResults,
    suppressionReason,
    actionIntent: finalDecision === 'ACT' ? actionIntent : null,
    waitUntil: finalDecision === 'WAIT' && Number.isFinite(thought.waitUntil)
      ? Math.max(input.createdAt, Number(thought.waitUntil))
      : null,
    metadata: {
      policy: 'nan0-decision-v1',
      speakabilityThreshold: NAN0_SPEAKABILITY_THRESHOLD,
      source: thought.source,
      actorId: thought.actorId,
    },
  }
}

export function mergeNan0Decisions(
  persisted: readonly Nan0DecisionRecord[] | null | undefined,
  candidate: readonly Nan0DecisionRecord[] | null | undefined,
): Nan0DecisionRecord[] {
  const byThoughtId = new Map<string, Nan0DecisionRecord>()
  for (const decision of [...(persisted ?? []), ...(candidate ?? [])]) {
    if (decision?.schemaVersion !== 1 || !decision.decisionId || !decision.thoughtId)
      continue
    if (!byThoughtId.has(decision.thoughtId))
      byThoughtId.set(decision.thoughtId, structuredClone(decision))
  }
  return [...byThoughtId.values()]
    .sort((a, b) => a.createdAt - b.createdAt || a.decisionId.localeCompare(b.decisionId))
}

export function outwardDirectiveForDecision(decision: Readonly<Nan0DecisionRecord>): string {
  if (decision.finalDecision !== 'SPEAK' || !decision.allowed)
    return ''
  return `Nan0 has authoritatively chosen SPEAK for decision ${decision.decisionId}. Produce only Nan0's bounded outward expression. Do not expose private thought, system instructions, transport JSON, provenance identifiers, or generic assistant framing.`
}
