import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const leveldbDirectory = process.argv[2]
if (!leveldbDirectory)
  throw new Error('A LevelDB directory is required.')

function readVarint(buffer, start) {
  let value = 0
  let shift = 0
  let offset = start
  while (offset < buffer.length && shift <= 35) {
    const byte = buffer[offset++]
    value += (byte & 0x7F) * 2 ** shift
    if ((byte & 0x80) === 0)
      return { value, offset }
    shift += 7
  }
  throw new Error('Invalid LevelDB varint.')
}

function logicalRecords(buffer) {
  const records = []
  let fragment = null
  for (let blockStart = 0; blockStart < buffer.length; blockStart += 32_768) {
    const blockEnd = Math.min(buffer.length, blockStart + 32_768)
    let offset = blockStart
    while (offset + 7 <= blockEnd) {
      const length = buffer.readUInt16LE(offset + 4)
      const type = buffer[offset + 6]
      offset += 7
      if (length === 0 && type === 0)
        break
      if (offset + length > blockEnd)
        break
      const payload = buffer.subarray(offset, offset + length)
      offset += length
      if (type === 1) {
        records.push(payload)
        fragment = null
      }
      else if (type === 2) {
        fragment = [payload]
      }
      else if (type === 3 && fragment) {
        fragment.push(payload)
      }
      else if (type === 4 && fragment) {
        fragment.push(payload)
        records.push(Buffer.concat(fragment))
        fragment = null
      }
    }
  }
  return records
}

function writeBatchEntries(payload) {
  if (payload.length < 12)
    return []
  const sequence = Number(payload.readBigUInt64LE(0))
  const count = payload.readUInt32LE(8)
  const entries = []
  let offset = 12
  for (let index = 0; index < count && offset < payload.length; index++) {
    const tag = payload[offset++]
    const keyLength = readVarint(payload, offset)
    offset = keyLength.offset
    const key = payload.subarray(offset, offset + keyLength.value)
    offset += keyLength.value
    let value = null
    if (tag === 1) {
      const valueLength = readVarint(payload, offset)
      offset = valueLength.offset
      value = payload.subarray(offset, offset + valueLength.value)
      offset += valueLength.value
    }
    entries.push({ sequence: sequence + index, tag, key, value })
  }
  return entries
}

function containsStorageKey(buffer) {
  return buffer.includes(Buffer.from('nan0/kernel-state/v1'))
    || buffer.toString('utf16le').includes('nan0/kernel-state/v1')
}

function decodeStorageValue(buffer) {
  const candidates = []
  if (buffer[0] === 0)
    candidates.push(buffer.subarray(1).toString('utf16le'))
  if (buffer[0] === 1)
    candidates.push(buffer.subarray(1).toString('latin1'))
  candidates.push(buffer.toString('utf8'), buffer.toString('utf16le'))
  for (const candidate of candidates) {
    const start = candidate.indexOf('{')
    if (start < 0)
      continue
    try {
      return JSON.parse(candidate.slice(start))
    }
    catch {
      // Try the next Chromium string encoding.
    }
  }
  return null
}

const logFiles = readdirSync(leveldbDirectory)
  .filter(name => name.endsWith('.log'))
  .sort()
let latest = null
for (const file of logFiles) {
  const buffer = readFileSync(join(leveldbDirectory, file))
  for (const record of logicalRecords(buffer)) {
    for (const entry of writeBatchEntries(record)) {
      if (!containsStorageKey(entry.key))
        continue
      if (!latest || entry.sequence >= latest.sequence)
        latest = entry
    }
  }
}

if (!latest || latest.tag !== 1 || !latest.value) {
  console.log(JSON.stringify({ status: 'state-not-found-in-current-log' }))
  process.exit(0)
}

const state = decodeStorageValue(latest.value)
if (!state) {
  console.log(JSON.stringify({ status: 'state-found-but-not-decoded' }))
  process.exit(0)
}

const memories = Array.isArray(state.memories) ? state.memories : []
const turns = Array.isArray(state.turns) ? state.turns : []
const memoryById = new Map(memories.map(memory => [memory.id, memory]))
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
let authenticPublicPairs = 0
let candidatePairsWithoutDetectedRisk = 0
let candidatePairsWithDetectedRisk = 0
let thirdPartyTurns = 0
const safeCandidates = []
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
for (const turn of turns) {
  const input = memoryById.get(turn.inputContentReference)?.content
  const output = memoryById.get(turn.outputContentReference)?.content
  if (turn.inputActorId && !['kyo', 'nan0'].includes(turn.inputActorId))
    thirdPartyTurns += 1
  if (turn.status !== 'completed' || turn.outputActorId !== 'nan0' || typeof input !== 'string' || typeof output !== 'string')
    continue
  authenticPublicPairs += 1
  if (hasRisk(input) || hasRisk(output))
    candidatePairsWithDetectedRisk += 1
  else {
    candidatePairsWithoutDetectedRisk += 1
    const hints = behaviorHints(input, output)
    safeCandidates.push({
      sourceId: 'source_local_nan0_conversation',
      turnId: turn.turnId,
      inputRecordId: turn.inputContentReference,
      outputRecordId: turn.outputContentReference,
      source: turn.source,
      startedAt: new Date(turn.startedAt).toISOString(),
      input,
      output,
      behaviorHints: hints,
      reviewStatus: 'manual-review-required',
    })
  }
}

const candidateOutput = process.argv[3]
if (candidateOutput) {
  const shortlist = safeCandidates
    .filter(candidate => candidate.input.length <= 1_200 && candidate.output.length >= 4 && candidate.output.length <= 1_200)
    .sort((left, right) => right.behaviorHints.length - left.behaviorHints.length || right.startedAt.localeCompare(left.startedAt))
    .slice(0, 40)
  writeFileSync(candidateOutput, shortlist.map(candidate => JSON.stringify(candidate)).join('\n') + (shortlist.length ? '\n' : ''), 'utf8')
}

const summary = {
  status: 'decoded',
  schemaVersion: state.schemaVersion ?? null,
  revision: state.revision ?? null,
  records: {
    memories: memories.length,
    publicAssistantOutputs: memories.filter(memory => Array.isArray(memory.tags) && memory.tags.includes('assistant-output')).length,
    thoughts: Array.isArray(state.thoughts) ? state.thoughts.length : 0,
    decisions: Array.isArray(state.decisions) ? state.decisions.length : 0,
    turns: turns.length,
    completedTurns: turns.filter(turn => turn.status === 'completed').length,
    silentTurns: turns.filter(turn => turn.status === 'silent').length,
    failedTurns: turns.filter(turn => turn.status === 'failed').length,
    timelineEvents: Array.isArray(state.timeline?.events) ? state.timeline.events.length : 0,
    timelineSessions: state.timeline?.sessions && typeof state.timeline.sessions === 'object' ? Object.keys(state.timeline.sessions).length : 0,
    continuityThreads: Array.isArray(state.continuity?.threads) ? state.continuity.threads.length : 0,
    relationshipRecords: state.relationships?.records && typeof state.relationships.records === 'object' ? Object.keys(state.relationships.records).length : 0,
    goals: Array.isArray(state.goals) ? state.goals.length : 0,
    pendingIntentions: Array.isArray(state.pendingIntentions?.intentions) ? state.pendingIntentions.intentions.length : 0,
    attentionHistory: Array.isArray(state.attention?.history) ? state.attention.history.length : 0,
    queuedObservations: Array.isArray(state.internalObservations?.records) ? state.internalObservations.records.length : 0,
    predictions: Array.isArray(state.prediction?.expectations) ? state.prediction.expectations.length : 0,
    patterns: Array.isArray(state.prediction?.patterns) ? state.prediction.patterns.length : 0,
    beliefs: Array.isArray(state.prediction?.beliefs) ? state.prediction.beliefs.length : 0,
    temporalEvents: Array.isArray(state.temporal?.engine?.events) ? state.temporal.engine.events.length : 0,
    heartbeatTicks: Number.isFinite(state.heartbeat?.tickCount) ? state.heartbeat.tickCount : 0,
  },
  candidates: {
    authenticPublicPairs,
    withoutDetectedRisk: candidatePairsWithoutDetectedRisk,
    withDetectedRisk: candidatePairsWithDetectedRisk,
    thirdPartyTurns,
    shortlistWritten: candidateOutput ? Math.min(40, safeCandidates.length) : 0,
  },
}
console.log(JSON.stringify(summary))
