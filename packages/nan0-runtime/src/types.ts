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

export type Nan0ThoughtStatus = 'generated' | 'failed'

export interface Nan0Thought {
  schemaVersion: 1
  thoughtId: string
  turnId: string
  sessionId: string
  observationEventId: string
  actorId: string
  createdAt: number
  source: Nan0ObservationSource
  status: Nan0ThoughtStatus
  attentionScore: number
  noveltyScore: number
  emotionalPressure: number
  relationshipPressure: number
  continuityPressure: number
  goalPressure: number
  interpretation: string
  privateText: string
  decision: Nan0Decision
  speakability: number
  confidence: number
  mood: string
  memoryReferences: string[]
  relationshipReferences: string[]
  continuityThreadReferences: string[]
  reasonCodes: string[]
  metadata: Record<string, unknown>
}

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

export type Nan0ContinuityThreadStatus
  = | 'active'
    | 'dormant'
    | 'resolved'
    | 'abandoned'
    | 'superseded'

export interface Nan0ContinuityUnresolvedItem {
  itemId: string
  kind: 'question' | 'intention' | 'promise' | 'reference'
  text: string
  actorId: string
  createdAt: number
  sourceTurnId: string
  resolvedAt: number | null
  metadata: Record<string, unknown>
}

export interface Nan0ConversationThread {
  schemaVersion: 1
  threadId: string
  status: Nan0ContinuityThreadStatus
  createdAt: number
  updatedAt: number
  lastActiveAt: number
  participantActorIds: string[]
  topicLabels: string[]
  turnIds: string[]
  timelineEventIds: string[]
  summary: string
  unresolvedItems: Nan0ContinuityUnresolvedItem[]
  importance: number
  activation: number
  metadata: Record<string, unknown>
}

export interface Nan0ContinuityState {
  schemaVersion: 1
  activeThreadByActorId: Record<string, string>
  threads: Nan0ConversationThread[]
}

export interface Nan0ContinuityContextThread {
  threadId: string
  status: Nan0ContinuityThreadStatus
  activation: number
  topicLabels: string[]
  summary: string
  unresolvedItems: string[]
  recentCarryover: Array<{
    actorId: string
    content: string
    turnId: string
    thoughtId: string
  }>
  inactiveForMs: number
  resumed: boolean
}

export interface Nan0ContinuityContext {
  provider: 'conversation_continuity'
  factsOnly: true
  currentThreadId: string
  threads: Nan0ContinuityContextThread[]
}

export type Nan0RelationshipStatus
  = | 'strangers'
    | 'developing'
    | 'established'
    | 'complicated'
    | 'hostile'
    | 'bonded'

export type Nan0RelationshipMomentType
  = | 'positive'
    | 'negative'
    | 'neutral'
    | 'grudge_formed'
    | 'grudge_resolved'

export type Nan0GrievanceStatus = 'active' | 'fading' | 'resolved' | 'nurtured'

export interface Nan0RelationshipProvenance {
  provenanceId: string
  eventId: string
  turnId: string
  thoughtId: string
  timestamp: number
  actorId: string
  rule: string
}

export interface Nan0RelationshipMoment extends Nan0RelationshipProvenance {
  eventType: Nan0RelationshipMomentType
  description: string
  intensity: number
  context?: string
}

export interface Nan0RelationshipGrievance extends Nan0RelationshipProvenance {
  grievanceId: string
  description: string
  severity: number
  status: Nan0GrievanceStatus
  lastReinforcedAt: number
  reinforcementCount: number
  decayRatePerDay: number
  resolvedAt: number | null
  triggerPhrases: string[]
  metadata: Record<string, unknown>
}

export interface Nan0RelationshipAnchor extends Nan0RelationshipProvenance {
  anchorId: string
  description: string
  strength: number
  metadata: Record<string, unknown>
}

export interface Nan0RelationshipExpectation extends Nan0RelationshipProvenance {
  expectationId: string
  description: string
  status: 'active' | 'met' | 'violated' | 'retired'
  metadata: Record<string, unknown>
}

export interface Nan0RelationshipRecord {
  schemaVersion: 1
  actorId: string
  relationshipId: string
  source: Nan0ObservationSource
  createdAt: number
  updatedAt: number
  firstInteractionAt: number | null
  lastInteractionAt: number | null
  interactionCount: number
  status: Nan0RelationshipStatus
  emotionalBalance: number
  familiarity: number
  trust: number
  attachment: number
  irritation: number
  suspicion: number
  respect: number
  importance: number
  significantEventIds: string[]
  turnIds: string[]
  moments: Nan0RelationshipMoment[]
  activeGrievances: Nan0RelationshipGrievance[]
  positiveAnchors: Nan0RelationshipAnchor[]
  expectations: Nan0RelationshipExpectation[]
  metadata: Record<string, unknown>
}

export interface Nan0RelationshipState {
  schemaVersion: 1
  records: Record<string, Nan0RelationshipRecord>
}

export interface Nan0RelationshipContext {
  provider: 'relationship_memory'
  factsOnly: true
  actorId: string
  relationshipId: string | null
  status: Nan0RelationshipStatus | null
  interactionCount: number
  emotionalBalance: number
  dimensions: {
    familiarity: number
    trust: number
    attachment: number
    irritation: number
    suspicion: number
    respect: number
    importance: number
  }
  activeGrievances: Array<{
    grievanceId: string
    description: string
    severity: number
    status: Nan0GrievanceStatus
    provenance: Nan0RelationshipProvenance
  }>
  recentMoments: Array<{
    eventType: Nan0RelationshipMomentType
    description: string
    intensity: number
    provenance: Nan0RelationshipProvenance
  }>
  positiveAnchors: Array<{
    description: string
    strength: number
    provenance: Nan0RelationshipProvenance
  }>
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
  thoughts: Nan0Thought[]
  turns: Nan0ConversationTurn[]
  timeline: Nan0TimelineState
  continuity: Nan0ContinuityState
  relationships: Nan0RelationshipState
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
