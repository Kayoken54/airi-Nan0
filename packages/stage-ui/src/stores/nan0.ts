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

  const stateStore = typeof window !== 'undefined' && window.localStorage
    ? new LocalStorageStateStore('nan0/kernel-state/v1')
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
  })

  let installPromise: Promise<void> | null = null
  const preparedTurns = new WeakMap<object, Nan0PreparedTurn>()

  async function ensureInstalled(): Promise<void> {
    if (installed.value)
      return

    if (installPromise)
      return installPromise

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
      preparedTurns.set(context, prepared)
    })

    chat.onAfterMessageComposed(async (_message, context) => {
      const prepared = preparedTurns.get(context)

      if (!prepared)
        return

      const alreadyInjected = context.composedMessage.some((message: Message) =>
        message.role === 'system'
        && contentToText(message.content).includes(NAN0_CONTEXT_MARKER),
      )

      if (alreadyInjected)
        return

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
    })

    chat.onChatTurnComplete(async (turn, context) => {
      if (turn.output.error)
        return

      const thoughtId = preparedTurns.get(context)?.thoughtId

      if (!thoughtId)
        throw new Error('Nan0 turn completed without a thoughtId.')

      await kernel.recordAssistantTurn({
        thoughtId,
        content: turn.outputText || contentToText(turn.output.content),
        rawContent: (turn.output as any).rawContent,
        timestamp: Number(turn.output.createdAt ?? Date.now()),
        metadata: {
          assistantMessageId: context.assistantMessageId,
          inputType: context.input?.type,
          toolCallCount: turn.toolCalls.length,
        },
      })

      preparedTurns.delete(context)
    })

    installed.value = true
    console.info('[Nan0] Kernel installed into AIRI chat lifecycle.')
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
