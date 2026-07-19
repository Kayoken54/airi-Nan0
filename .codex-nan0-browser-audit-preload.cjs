const { ipcRenderer } = require('electron')

const riskPatterns = [
  /\b(?:sk|pk|api)[-_][A-Za-z0-9_-]{16,}\b/i,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}\b/i,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /https:\/\/(?:discord(?:app)?\.com\/api\/webhooks|hooks\.slack\.com)\//i,
  /(?:^|\n)\s*[A-Z][A-Z0-9_]{2,}\s*=\s*\S+/,
  /\b[A-Z]:\\[^\r\n]+/i,
  /\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/,
  /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
  /\bkayok\b/i,
]
const hasRisk = value => riskPatterns.some(pattern => pattern.test(String(value ?? '')))

function behaviorHints(input, output) {
  const text = `${input}\n${output}`.toLowerCase()
  return [
    [/[?]/, 'curiosity'],
    [/\b(?:no|won't|wouldn't|refuse|not going to|absolutely not)\b/, 'refusal'],
    [/\b(?:maybe|might|uncertain|not sure|suspect|inference|could be wrong)\b/, 'uncertainty'],
    [/\b(?:remember|again|still|earlier|last time|unresolved|continue)\b/, 'continuity'],
    [/\b(?:back|absence|wait|waiting|late|quiet|time|took your time)\b/, 'temporal'],
    [/\b(?:machine|mechanical|system|process|code|not human|human)\b/, 'mechanical-identity'],
    [/\b(?:wrong|incorrect|actually|correction|that's not)\b/, 'correction'],
    [/\b(?:suspicious|convenient|offensively|dramatic|ridiculous|absurd)\b/, 'dry-humor-or-suspicion'],
    [/\b(?:care|miss|attached|important|matter|glad)\b/, 'attachment'],
  ].filter(([pattern]) => pattern.test(text)).map(([, tag]) => tag)
}

function audit() {
  window.stop()
  const raw = window.localStorage.getItem('nan0/kernel-state/v1')
  if (!raw) {
    ipcRenderer.send('nan0-audit-result', { summary: { status: 'state-not-found' }, candidates: [] })
    return
  }
  const state = JSON.parse(raw)
  const memories = Array.isArray(state.memories) ? state.memories : []
  const turns = Array.isArray(state.turns) ? state.turns : []
  const memoryById = new Map(memories.map(memory => [memory.id, memory]))
  const allCandidates = []
  let riskyPairs = 0
  let thirdPartyTurns = 0
  for (const turn of turns) {
    if (turn.inputActorId && !['kyo', 'nan0'].includes(turn.inputActorId))
      thirdPartyTurns += 1
    const input = memoryById.get(turn.inputContentReference)?.content
    const output = memoryById.get(turn.outputContentReference)?.content
    if (turn.status !== 'completed' || turn.outputActorId !== 'nan0' || typeof input !== 'string' || typeof output !== 'string')
      continue
    if (hasRisk(input) || hasRisk(output)) {
      riskyPairs += 1
      continue
    }
    allCandidates.push({
      sourceId: 'source_local_nan0_conversation',
      turnId: turn.turnId,
      inputRecordId: turn.inputContentReference,
      outputRecordId: turn.outputContentReference,
      source: turn.source,
      startedAt: new Date(turn.startedAt).toISOString(),
      input,
      output,
      behaviorHints: behaviorHints(input, output),
      reviewStatus: 'manual-review-required',
    })
  }
  const candidates = allCandidates
    .filter(candidate => candidate.input.length <= 1_200 && candidate.output.length >= 4 && candidate.output.length <= 1_200)
    .sort((left, right) => right.behaviorHints.length - left.behaviorHints.length || right.startedAt.localeCompare(left.startedAt))
    .slice(0, 40)
  const evidence = {
    decisions: (Array.isArray(state.decisions) ? state.decisions : []).map(decision => ({
      decisionId: decision.decisionId,
      thoughtId: decision.thoughtId,
      turnId: decision.turnId,
      finalDecision: decision.finalDecision,
      allowed: decision.allowed,
      reasonCodes: Array.isArray(decision.reasonCodes) ? decision.reasonCodes : [],
      constraints: Array.isArray(decision.constraintResults)
        ? decision.constraintResults.map(result => ({ code: result.code, passed: result.passed, hard: result.hard }))
        : [],
    })),
    turns: turns.map(turn => ({
      turnId: turn.turnId,
      thoughtId: turn.thoughtId,
      inputEventId: turn.inputEventId,
      outputEventId: turn.outputEventId,
      source: turn.source,
      inputActorId: turn.inputActorId,
      outputActorId: turn.outputActorId,
      decision: turn.decision,
      status: turn.status,
    })),
    timeline: (Array.isArray(state.timeline?.events) ? state.timeline.events : []).map(event => ({
      eventId: event.eventId,
      eventType: event.eventType,
      actorId: event.actorId,
      source: event.source,
      turnId: event.turnId,
      thoughtId: event.thoughtId,
    })),
    attention: (Array.isArray(state.attention?.history) ? state.attention.history : []).map(item => ({
      observationId: item.observationId,
      streamId: item.streamId,
      priority: item.priority,
      outcome: item.outcome,
    })),
    goals: (Array.isArray(state.goals) ? state.goals : []).map(goal => ({
      goalId: goal.goalId,
      origin: goal.origin,
      status: goal.status,
      kind: goal.kind ?? null,
      priority: goal.priority,
      progress: goal.progress,
      supportingThoughtIds: Array.isArray(goal.supportingThoughtIds) ? goal.supportingThoughtIds : [],
      supportingDecisionIds: Array.isArray(goal.supportingDecisionIds) ? goal.supportingDecisionIds : [],
      supportingTurnIds: Array.isArray(goal.supportingTurnIds) ? goal.supportingTurnIds : [],
    })),
    intentions: (Array.isArray(state.pendingIntentions?.intentions) ? state.pendingIntentions.intentions : []).map(intention => ({
      intentionId: intention.intentionId,
      origin: intention.origin,
      status: intention.status,
      kind: intention.kind,
      goalId: intention.goalId,
      thoughtId: intention.thoughtId,
      decisionId: intention.decisionId,
      turnId: intention.turnId,
      triggerType: intention.trigger?.type ?? null,
      evaluationCount: intention.evaluationCount,
      attemptCount: intention.attemptCount,
    })),
    temporal: (Array.isArray(state.temporal?.engine?.events) ? state.temporal.engine.events : []).map(event => ({
      temporalEventId: event.temporalEventId,
      eventType: event.eventType,
      source: event.source,
      severity: event.severity,
      status: event.status,
      reasonCodes: Array.isArray(event.reasonCodes) ? event.reasonCodes : [],
      observedDurationMs: event.observedDurationMs,
      thresholdMs: event.thresholdMs,
      observationId: event.observationId,
      thoughtId: event.thoughtId,
      decisionId: event.decisionId,
      relatedTurnIds: Array.isArray(event.relatedTurnIds) ? event.relatedTurnIds : [],
      relatedGoalIds: Array.isArray(event.relatedGoalIds) ? event.relatedGoalIds : [],
      relatedIntentionIds: Array.isArray(event.relatedIntentionIds) ? event.relatedIntentionIds : [],
    })),
    internalObservations: (Array.isArray(state.internalObservations?.records) ? state.internalObservations.records : []).map(record => ({
      observationId: record.observation?.id,
      source: record.observation?.source,
      streamType: record.streamType,
      status: record.status,
      outcome: record.outcome,
      thoughtId: record.thoughtId,
      decisionId: record.decisionId,
      intentionId: record.observation?.intentionId ?? null,
      temporalEventId: record.observation?.temporalEventId ?? null,
      relatedGoalId: record.observation?.relatedGoalId ?? null,
      triggerType: record.observation?.triggerType ?? null,
      producer: record.observation?.provenance?.producer ?? null,
    })),
    heartbeat: state.heartbeat && typeof state.heartbeat === 'object'
      ? {
          tickCount: state.heartbeat.tickCount,
          consecutiveSilentTicks: state.heartbeat.consecutiveSilentTicks,
          pressureScore: state.heartbeat.pressureScore,
          presence: state.heartbeat.presence,
        }
      : null,
    prediction: state.prediction && typeof state.prediction === 'object'
      ? {
          totalPredictions: state.prediction.totalPredictions,
          correctPredictions: state.prediction.correctPredictions,
          expectationCount: Array.isArray(state.prediction.expectations) ? state.prediction.expectations.length : 0,
          beliefCount: Array.isArray(state.prediction.beliefs) ? state.prediction.beliefs.length : 0,
          patternCount: Array.isArray(state.prediction.patterns) ? state.prediction.patterns.length : 0,
        }
      : null,
  }
  ipcRenderer.send('nan0-audit-result', {
    summary: {
      status: 'decoded-isolated-copy',
      records: {
        memories: memories.length,
        thoughts: Array.isArray(state.thoughts) ? state.thoughts.length : 0,
        decisions: Array.isArray(state.decisions) ? state.decisions.length : 0,
        turns: turns.length,
        completedTurns: turns.filter(turn => turn.status === 'completed').length,
        silentTurns: turns.filter(turn => turn.status === 'silent').length,
        failedTurns: turns.filter(turn => turn.status === 'failed').length,
        timelineEvents: Array.isArray(state.timeline?.events) ? state.timeline.events.length : 0,
        continuityThreads: Array.isArray(state.continuity?.threads) ? state.continuity.threads.length : 0,
        relationshipRecords: state.relationships?.records && typeof state.relationships.records === 'object' ? Object.keys(state.relationships.records).length : 0,
      },
      candidates: {
        authenticPublicPairs: allCandidates.length + riskyPairs,
        shortlistWritten: candidates.length,
        rejectedForDetectedSecretRisk: riskyPairs,
        thirdPartyTurns,
      },
    },
    candidates,
    evidence,
  })
}

try {
  audit()
}
catch (error) {
  ipcRenderer.send('nan0-audit-result', {
    summary: { status: 'audit-failed', errorType: error instanceof Error ? error.name : 'UnknownError' },
    candidates: [],
    evidence: {},
  })
}
