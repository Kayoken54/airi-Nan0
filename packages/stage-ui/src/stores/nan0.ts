import type { Message } from '@xsai/shared-chat'

import type { Nan0PreparedTurn } from '@proj-airi/nan0-runtime'
import {
  InMemoryStateStore,
  LocalStorageStateStore,
  Nan0Kernel,
} from '@proj-airi/nan0-runtime'
import { nanoid } from 'nanoid'
import { defineStore } from 'pinia'
import { ref } from 'vue'

import { useChatOrchestratorStore } from './chat'
import type { Nan0RendererIdentity } from './nan0-renderer'

const NAN0_CONTEXT_MARKER = '[NAN0 KERNEL CONTEXT]'

function contentToText(content: unknown): string {
  if (typeof content === 'string')
    return content

  if (Array.isArray(content)) {
    return content
      .map((part: any) => typeof part?.text === 'string' ? part.text : '')
      .filter(Boolean)
      .join('\n')
  }

  return String(content ?? '')
}

export const useNan0RuntimeStore = defineStore('nan0-runtime', () => {
  const installed = ref(false)
  const booted = ref(false)
  const lastThoughtId = ref<string | null>(null)
  const lastError = ref<string | null>(null)

  let rendererIdentity: Nan0RendererIdentity | null = null

  function diagnostic(event: string, details: Record<string, unknown> = {}): void {
    const entry = {
      timestamp: Date.now(),
      event,
      rendererInstanceId: rendererIdentity?.instanceId ?? 'unassigned',
      rendererHash: rendererIdentity?.hash ?? 'unknown',
      ...details,
    }
    console.info('[Nan0]', JSON.stringify(entry))
  }

  const stateStore = typeof window !== 'undefined' && window.localStorage
    ? new LocalStorageStateStore('nan0/kernel-state/v1', {
        storage: window.localStorage,
        diagnostic,
      })
    : new InMemoryStateStore()

  const kernel = new Nan0Kernel({
    stateStore,
    createId: () => nanoid(),
    // AIRI owns live inference. This path exists only for future direct kernel calls.
    reasoningClient: {
      async generate() {
        throw new Error('Direct Nan0 reasoning is disabled. AIRI owns provider execution.')
      },
    },
    diagnostic: ({ event, details }) => diagnostic(event, details),
  })

  let installPromise: Promise<void> | null = null
  const preparedTurns = new Map<string, Nan0PreparedTurn>()

  function turnKey(context: { message: { id?: string } }): string {
    const messageId = context.message.id
    if (!messageId)
      throw new Error('Nan0 chat lifecycle context is missing a stable message ID.')
    return String(messageId)
  }

  async function ensureInstalled(renderer: Nan0RendererIdentity): Promise<void> {
    rendererIdentity ??= renderer
    diagnostic('store.install.requested', {
      installed: installed.value,
      installPending: installPromise != null,
      isOwner: renderer.isOwner,
    })

    if (!renderer.isOwner) {
      diagnostic('store.install.skipped-non-owner')
      return
    }

    if (installed.value) {
      diagnostic('store.install.skipped-already-installed')
      return
    }

    if (installPromise) {
      diagnostic('store.install.joined-pending')
      return installPromise
    }

    installPromise = install()
      .catch((error) => {
        lastError.value = error instanceof Error ? error.message : String(error)
        installPromise = null
        throw error
      })

    return installPromise
  }

  async function install(): Promise<void> {
    const chat = useChatOrchestratorStore()

    diagnostic('kernel.boot.start')
    await kernel.boot()
    booted.value = true

    chat.onBeforeMessageComposed(async (message, context) => {
      const source = context.input?.type?.startsWith('input:')
        ? context.input.type.slice('input:'.length)
        : 'chat'

      const sessionActorId = (context.message as any)?.actorId
        ?? (context.message as any)?.userId
        ?? (context.message as any)?.authorId
      const isLocalKyoInput = source === 'text' || source === 'voice' || source === 'chat'
      const actorId = String(sessionActorId ?? (isLocalKyoInput ? 'kyo' : 'unknown'))
      const displayName = String((context.message as any)?.displayName ?? (actorId === 'kyo' ? 'Kyo' : actorId))

      const prepared = await kernel.prepareTurn({
        id: String(context.message.id ?? nanoid()),
        source: source === 'text' ? 'chat' : source as any,
        sessionId: context.sessionId,
        actorId,
        displayName,
        content: message,
        metadata: {
          sessionInputType: context.input?.type,
          sourceIdentity: {
            source,
            actorId: sessionActorId == null ? undefined : String(sessionActorId),
            displayName: (context.message as any)?.displayName,
          },
        },
        timestamp: Number(context.message.createdAt ?? Date.now()),
      })

      lastThoughtId.value = prepared.thoughtId
      preparedTurns.set(turnKey(context), prepared)
      diagnostic('hook.prepareTurn.complete', {
        thoughtId: prepared.thoughtId,
        turnId: prepared.turnId,
        sessionId: prepared.sessionId,
        observationId: prepared.observation.id,
        actorId: prepared.observation.actorId,
      })
    })

    chat.onAfterMessageComposed(async (_message, context) => {
      const prepared = preparedTurns.get(turnKey(context))

      if (!prepared) {
        diagnostic('hook.onAfterMessageComposed.missing-prepared-turn')
        return
      }

      const alreadyInjected = context.composedMessage.some((message: Message) =>
        message.role === 'system'
        && contentToText(message.content).includes(NAN0_CONTEXT_MARKER),
      )

      if (alreadyInjected) {
        diagnostic('hook.onAfterMessageComposed.already-injected', {
          thoughtId: prepared.thoughtId,
        })
        return
      }

      const firstNonSystemIndex = context.composedMessage.findIndex(
        (message: Message) => message.role !== 'system',
      )

      const insertAt = firstNonSystemIndex === -1
        ? context.composedMessage.length
        : firstNonSystemIndex

      context.composedMessage.splice(insertAt, 0, {
        role: 'system',
        content: prepared.systemContext,
      } as Message)
      diagnostic('hook.onAfterMessageComposed.injected', {
        thoughtId: prepared.thoughtId,
        insertAt,
      })
    })

    chat.onAssistantResponseEnd(async (message, context) => {
      const key = turnKey(context)
      const prepared = preparedTurns.get(key)
      diagnostic('hook.onAssistantResponseEnd.fired', {
        thoughtId: prepared?.thoughtId,
        outputLength: message.length,
      })

      if (!prepared) {
        diagnostic('hook.onAssistantResponseEnd.missing-prepared-turn')
        return
      }

      await kernel.recordAssistantTurn({
        turnId: prepared.turnId,
        thoughtId: prepared.thoughtId,
        content: message,
        timestamp: Number(context.assistantMessageCreatedAt ?? Date.now()),
        metadata: {
          assistantMessageId: context.assistantMessageId,
          inputType: context.input?.type,
          completionHook: 'onAssistantResponseEnd',
        },
      })
      diagnostic('hook.onAssistantResponseEnd.persisted', {
        thoughtId: prepared.thoughtId,
        turnId: prepared.turnId,
        memoryCount: kernel.getStateSnapshot().memories.length,
        revision: kernel.getStateSnapshot().revision ?? 0,
      })
      preparedTurns.delete(key)
    })

    chat.onAssistantSilence(async (reason, context) => {
      const key = turnKey(context)
      const prepared = preparedTurns.get(key)
      diagnostic('hook.onAssistantSilence.fired', {
        thoughtId: prepared?.thoughtId,
        turnId: prepared?.turnId,
        reason,
      })

      if (!prepared) {
        diagnostic('hook.onAssistantSilence.missing-prepared-turn')
        return
      }

      await kernel.recordSilenceDecision({
        turnId: prepared.turnId,
        thoughtId: prepared.thoughtId,
        reason,
        timestamp: Number(context.assistantMessageCreatedAt ?? Date.now()),
        metadata: {
          assistantMessageId: context.assistantMessageId,
          inputType: context.input?.type,
          completionHook: 'onAssistantSilence',
        },
      })
      preparedTurns.delete(key)
    })

    chat.onChatError(async (error, context) => {
      const key = turnKey(context)
      const prepared = preparedTurns.get(key)
      diagnostic('hook.onChatError.fired', {
        thoughtId: prepared?.thoughtId,
        turnId: prepared?.turnId,
        error: error.message,
      })

      if (!prepared) {
        diagnostic('hook.onChatError.missing-prepared-turn')
        return
      }

      await kernel.failTurn({
        turnId: prepared.turnId,
        thoughtId: prepared.thoughtId,
        error: error.message,
        timestamp: Date.now(),
        metadata: {
          technicalDetail: error.detail,
          inputType: context.input?.type,
          completionHook: 'onChatError',
        },
      })
      preparedTurns.delete(key)
    })

    installed.value = true
    diagnostic('store.install.complete', {
      memoryCount: kernel.getStateSnapshot().memories.length,
      revision: kernel.getStateSnapshot().revision ?? 0,
    })
  }

  return {
    installed,
    booted,
    lastThoughtId,
    lastError,
    ensureInstalled,
    kernel,
  }
})
