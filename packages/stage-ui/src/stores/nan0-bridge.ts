import type { Nan0ActionAuthority, Nan0Decision, Nan0Observation, Nan0PreparedTurn } from '@proj-airi/nan0-runtime'

export interface Nan0PreparedDecisionProxy {
  decisionId: string
  finalDecision: Nan0Decision
  allowed: boolean
  confidence: number
  speakability: number
  attentionScore: number
  pressureScore: number
  reasonCodes: string[]
  suppressionReason: string | null
  actionIntent: { type: string, target?: string } | null
  waitUntil: number | null
}

export interface Nan0PreparedTurnProxy {
  thoughtId: string
  turnId: string
  sessionId: string
  inputEventId: string
  threadId: string
  outwardDirective: string
  decision: Nan0PreparedDecisionProxy
  actionAuthority: Nan0ActionAuthority | null
}

export interface Nan0BridgeRequestMap {
  prepare: Nan0Observation
  complete: {
    turnId: string
    thoughtId: string
    decisionId: string
    content: string
    timestamp: number
    metadata: Record<string, unknown>
  }
  terminal: {
    turnId: string
    thoughtId: string
    decisionId: string
    decision: 'SILENCE' | 'ACT' | 'WAIT'
    reason: string
    timestamp: number
    metadata: Record<string, unknown>
  }
  fail: {
    turnId: string
    thoughtId: string
    error: string
    timestamp: number
    metadata: Record<string, unknown>
  }
}

export interface Nan0BridgeResponseMap {
  prepare: Nan0PreparedTurnProxy
  complete: { persisted: boolean }
  terminal: { persisted: boolean }
  fail: { persisted: boolean }
}

export type Nan0BridgeAction = keyof Nan0BridgeRequestMap

type Nan0OwnerHandler = <A extends Nan0BridgeAction>(
  action: A,
  payload: Nan0BridgeRequestMap[A],
) => Promise<Nan0BridgeResponseMap[A]>

interface RequestMessage {
  kind: 'request'
  requestId: string
  senderId: string
  action: Nan0BridgeAction
  payload: Nan0BridgeRequestMap[Nan0BridgeAction]
  sentAt: number
}

interface ResponseMessage {
  kind: 'response'
  requestId: string
  recipientId: string
  ok: boolean
  payload?: Nan0BridgeResponseMap[Nan0BridgeAction]
  error?: string
}

const CHANNEL_NAME = 'nan0-runtime-owner-v1'
const REQUEST_RETRY_MS = 500
// NOTICE: Owner-side private thought owns its 90s cancellation deadline. The
// bridge margin allows the owner to persist and return the terminal outcome.
const REQUEST_TIMEOUT_MS = 100_000
const OWNER_RESPONSE_CACHE_LIMIT = 256

let channel: BroadcastChannel | null = null
let ownerHandler: Nan0OwnerHandler | null = null
let ownerRendererId: string | null = null
const ownerRequests = new Map<string, Promise<ResponseMessage>>()
const pendingRequests = new Map<string, {
  rendererId: string
  resolve: (value: unknown) => void
  reject: (error: Error) => void
}>()

export function toPreparedTurnProxy(prepared: Nan0PreparedTurn): Nan0PreparedTurnProxy {
  return {
    thoughtId: prepared.thoughtId,
    turnId: prepared.turnId,
    sessionId: prepared.sessionId,
    inputEventId: prepared.inputEventId,
    threadId: prepared.threadId,
    outwardDirective: prepared.systemContext,
    decision: {
      decisionId: prepared.decision.decisionId,
      finalDecision: prepared.decision.finalDecision,
      allowed: prepared.decision.allowed,
      confidence: prepared.decision.confidence,
      speakability: prepared.decision.speakability,
      attentionScore: prepared.decision.attentionScore,
      pressureScore: prepared.decision.pressureScore,
      reasonCodes: [...prepared.decision.reasonCodes],
      suppressionReason: prepared.decision.suppressionReason,
      actionIntent: prepared.decision.actionIntent
        ? { type: prepared.decision.actionIntent.type, target: prepared.decision.actionIntent.target }
        : null,
      waitUntil: prepared.decision.waitUntil,
    },
    actionAuthority: prepared.actionAuthority ? structuredClone(prepared.actionAuthority) : null,
  }
}

function getChannel(): BroadcastChannel {
  if (channel)
    return channel

  channel = new BroadcastChannel(CHANNEL_NAME)
  channel.addEventListener('message', (event: MessageEvent<RequestMessage | ResponseMessage>) => {
    const message = event.data
    if (message.kind === 'response') {
      const pending = pendingRequests.get(message.requestId)
      if (!pending || pending.rendererId !== message.recipientId)
        return

      pendingRequests.delete(message.requestId)
      if (message.ok)
        pending.resolve(message.payload)
      else
        pending.reject(new Error(message.error ?? 'Nan0 owner request failed.'))
      return
    }

    if (!ownerHandler || !ownerRendererId)
      return

    let response = ownerRequests.get(message.requestId)
    if (!response) {
      response = ownerHandler(message.action, message.payload as never)
        .then(payload => ({
          kind: 'response' as const,
          requestId: message.requestId,
          recipientId: message.senderId,
          ok: true,
          payload,
        }))
        .catch((error: unknown) => ({
          kind: 'response' as const,
          requestId: message.requestId,
          recipientId: message.senderId,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        }))
      ownerRequests.set(message.requestId, response)
      if (ownerRequests.size > OWNER_RESPONSE_CACHE_LIMIT) {
        const oldestRequestId = ownerRequests.keys().next().value
        if (oldestRequestId)
          ownerRequests.delete(oldestRequestId)
      }
    }

    void response.then(result => getChannel().postMessage(result))
  })
  return channel
}

export function setNan0OwnerHandler(rendererId: string, handler: Nan0OwnerHandler): () => void {
  ownerRendererId = rendererId
  ownerHandler = handler
  getChannel()

  return () => {
    if (ownerRendererId !== rendererId)
      return
    ownerRendererId = null
    ownerHandler = null
    ownerRequests.clear()
  }
}

export function requestNan0Owner<A extends Nan0BridgeAction>(
  rendererId: string,
  action: A,
  payload: Nan0BridgeRequestMap[A],
): Promise<Nan0BridgeResponseMap[A]> {
  const requestId = crypto.randomUUID()
  const request: RequestMessage = {
    kind: 'request',
    requestId,
    senderId: rendererId,
    action,
    payload,
    sentAt: Date.now(),
  }

  return new Promise((resolve, reject) => {
    const broadcast = () => getChannel().postMessage(request)
    const retry = window.setInterval(broadcast, REQUEST_RETRY_MS)
    const timeout = window.setTimeout(() => {
      pendingRequests.delete(requestId)
      window.clearInterval(retry)
      reject(new Error(`Nan0 owner did not answer ${action} within ${REQUEST_TIMEOUT_MS}ms.`))
    }, REQUEST_TIMEOUT_MS)

    pendingRequests.set(requestId, {
      rendererId,
      resolve: (value) => {
        window.clearInterval(retry)
        window.clearTimeout(timeout)
        resolve(value as Nan0BridgeResponseMap[A])
      },
      reject: (error) => {
        window.clearInterval(retry)
        window.clearTimeout(timeout)
        reject(error)
      },
    })
    broadcast()
  })
}
