export type Nan0ObservationSource =
  | 'chat'
  | 'discord'
  | 'voice'
  | 'vision'
  | 'system'
  | 'temporal'

export interface Nan0Observation {
  id: string
  source: Nan0ObservationSource
  sessionId?: string
  actorId?: string
  displayName?: string
  content: unknown
  metadata: Record<string, unknown>
  timestamp: number
}

export type Nan0ActorKind = 'kyo' | 'nan0' | 'external' | 'unknown'

export interface Nan0ExternalIdentity {
  source: string
  sourceActorId?: string
  displayName?: string
}

export interface Nan0ActorIdentity {
  actorId: string
  displayName: string
  kind: Nan0ActorKind
  aliases: string[]
  pronouns: string[]
  externalIdentities: Record<string, Nan0ExternalIdentity>
}

export interface Nan0IdentityState {
  actors: Record<string, Nan0ActorIdentity>
  aliases: Record<string, string>
}

export interface Nan0ActorOwnership {
  actorId: string
  displayName: string
  kind: Nan0ActorKind
  source: string
  rawActorId?: string
  externalIdentity?: Nan0ExternalIdentity
  actorRole: string
  nan0Role: string
  ownershipRule: string
}

export type Nan0Decision = 'SPEAK' | 'SILENCE' | 'ACT' | 'WAIT'

export type Nan0ConversationDecision = Nan0Decision | 'UNKNOWN'

export type Nan0ConversationTurnStatus
  = | 'prepared'
    | 'completed'
    | 'silent'
    | 'failed'
    | 'cancelled'

export interface Nan0ConversationTurn {
  schemaVersion: 1
  turnId: string
  thoughtId: string
  sessionId: string
  sequence: number
  source: Nan0ObservationSource
  startedAt: number
  completedAt: number | null
  elapsedMs: number | null
  inputEventId: string
  outputEventId: string | null
  inputActorId: string
  outputActorId: string | null
  inputContentReference: string
  outputContentReference: string | null
  decision: Nan0ConversationDecision
  status: Nan0ConversationTurnStatus
  metadata: Record<string, unknown>
}

export interface Nan0TimelineSession {
  schemaVersion: 1
  sessionId: string
  source: Nan0ObservationSource
  startedAt: number
  resumedAt: number
  endedAt: number | null
  metadata: Record<string, unknown>
}

export interface Nan0TimelineEvent {
  schemaVersion: 1
  eventId: string
  eventType: string
  actorId: string
  source: Nan0ObservationSource
  sessionId: string
  turnId: string | null
  thoughtId: string | null
  observedAt: number
  recordedAt: number
  sequence: number
  memoryReference: string | null
  metadata: Record<string, unknown>
}

export interface Nan0TimelineState {
  schemaVersion: 1
  nextSequence: number
  nextTurnSequence: number
  activeSessionId: string | null
  sessions: Record<string, Nan0TimelineSession>
  events: Nan0TimelineEvent[]
}

export interface Nan0SubjectiveTime {
  at: number
  sessionId: string | null
  sinceSessionStartMs: number | null
  sinceLastKyoInteractionMs: number | null
  sinceLastNan0ExpressionMs: number | null
}

interface Nan0ExpressionBase {
  thoughtId: string
  mood?: string
}

export interface Nan0SpeechExpression extends Nan0ExpressionBase {
  type: 'SPEECH'
  content: string
  targetChannel?: string
}

export interface Nan0SilenceExpression extends Nan0ExpressionBase {
  type: 'SILENCE_MARKER'
  reason?: string
}

export interface Nan0BodyExpression extends Nan0ExpressionBase {
  type: 'BODY_EXPRESSION'
  content: string
}

export type Nan0Expression =
  | Nan0SpeechExpression
  | Nan0SilenceExpression
  | Nan0BodyExpression

export interface Nan0MemoryRecord {
  id: string
  kind: 'event' | 'episode' | 'semantic' | 'relationship' | 'summary'
  actorId?: string
  sessionId?: string
  content: string
  emotionalWeight?: number
  tags: string[]
  createdAt: number
  metadata: Record<string, unknown>
}

export interface Nan0KernelState {
  schemaVersion: 1
  revision?: number
  bootCount: number
  createdAt: number
  updatedAt: number
  lastObservationAt?: number
  lastThoughtId?: string
  emotionalState: Record<string, number>
  runtimeMetadata: Record<string, unknown>
  identity: Nan0IdentityState
  memories: Nan0MemoryRecord[]
  turns: Nan0ConversationTurn[]
  timeline: Nan0TimelineState
}

export interface Nan0StateStore {
  load(): Promise<Nan0KernelState | null>
  save(state: Nan0KernelState): Promise<Nan0KernelState>
}

export interface Nan0DiagnosticEvent {
  event: string
  details: Record<string, unknown>
}

export interface Nan0ReasoningRequest {
  system: string
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  temperature?: number
  maxTokens?: number
  signal?: AbortSignal
}

export interface Nan0ReasoningResult {
  text: string
  finishReason?: string
}

export interface Nan0ReasoningClient {
  generate(request: Nan0ReasoningRequest): Promise<Nan0ReasoningResult>
}

export interface Nan0KernelDependencies {
  stateStore: Nan0StateStore
  reasoningClient: Nan0ReasoningClient
  createInitialState?: () => Nan0KernelState
  now?: () => number
  createId?: () => string
  diagnostic?: (event: Nan0DiagnosticEvent) => void
}

export interface Nan0HostBindings {
  subscribeObservations(
    handler: (observation: Nan0Observation) => void,
  ): () => void

  dispatchExpression(expression: Nan0Expression): Promise<void>
}

export interface LegacyNan0Export {
  schemaVersion: 1
  exportedAt: number
  records: Nan0MemoryRecord[]
}
