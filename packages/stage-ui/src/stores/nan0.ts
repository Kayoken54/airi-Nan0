import type { Message } from '@xsai/shared-chat'

import {
  InMemoryStateStore,
  LocalStorageStateStore,
  Nan0Kernel,
} from '@proj-airi/nan0-runtime'
import { nanoid } from 'nanoid'
import { defineStore } from 'pinia'
import { ref } from 'vue'

import type {
  Nan0BridgeAction,
  Nan0BridgeRequestMap,
  Nan0PreparedTurnProxy,
} from './nan0-bridge'
import { requestNan0Owner, setNan0OwnerHandler, toPreparedTurnProxy } from './nan0-bridge'
import type { Nan0RendererIdentity } from './nan0-renderer'

const NAN0_CONTEXT_MARKER = '[NAN0 KERNEL CONTEXT]'
const NAN0_DIAGNOSTIC_KEY = 'nan0/diagnostics/v1'

let activeInstallationCleanup: (() => void) | null = null

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    activeInstallationCleanup?.()
    activeInstallationCleanup = null
  })
}

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
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      try {
        const previous = JSON.parse(window.localStorage.getItem(NAN0_DIAGNOSTIC_KEY) ?? '[]')
        const diagnostics = Array.isArray(previous) ? previous.slice(-199) : []
        diagnostics.push(entry)
        window.localStorage.setItem(NAN0_DIAGNOSTIC_KEY, JSON.stringify(diagnostics))
      }
      catch (error) {
        console.warn('[Nan0] Failed to retain development diagnostic:', error)
      }
    }
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
    reasoningClient: {
      async generate(request) {
        const [
          { useLLM },
          { useConsciousnessStore },
          { useProvidersStore },
        ] = await Promise.all([
          import('./llm'),
          import('./modules/consciousness'),
          import('./providers'),
        ])
        const llm = useLLM()
        const consciousness = useConsciousnessStore()
        const providers = useProvidersStore()
        const providerId = consciousness.activeProvider
        const model = consciousness.activeModel
        if (!providerId || !model)
          throw new Error('AIRI has no active provider and model for Nan0 private thought.')

        const provider = await providers.getProviderInstance(providerId)
        const config = providers.getProviderConfig(providerId)
        diagnostic('thought.inference.start', {
          providerId,
          model,
          messageCount: request.messages.length + 1,
        })
        const result = await llm.generate(model, provider as any, [
          { role: 'system', content: request.system },
          ...request.messages,
        ] as Message[], {
          headers: (config.headers || {}) as Record<string, string>,
          tools: [],
          temperature: request.temperature,
          max_tokens: request.maxTokens,
          abortSignal: request.signal,
        })
        const text = result.text
          || (result as any).reasoning
          || (result as any).reasoning_content
          || ''
        diagnostic('thought.inference.complete', {
          providerId,
          model,
          outputLength: text.length,
        })
        return {
          text,
          finishReason: String((result as any).finishReason ?? ''),
        }
      },
    },
    diagnostic: ({ event, details }) => diagnostic(event, details),
  })

  let installPromise: Promise<void> | null = null

  async function ensureInstalled(renderer: Nan0RendererIdentity): Promise<void> {
    rendererIdentity ??= renderer
    diagnostic('store.install.requested', {
      installed: installed.value,
      installPending: installPromise != null,
      isOwner: renderer.isOwner,
      isExecutor: renderer.isExecutor,
    })

    if (!renderer.isOwner && !renderer.isExecutor) {
      diagnostic('store.install.skipped-non-participant')
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

    installPromise = (renderer.isOwner ? installOwner(renderer) : installExecutor(renderer))
      .catch((error) => {
        lastError.value = error instanceof Error ? error.message : String(error)
        installPromise = null
        throw error
      })

    return installPromise
  }

  async function installOwner(renderer: Nan0RendererIdentity): Promise<void> {
    diagnostic('kernel.boot.start')
    await kernel.boot()
    booted.value = true

    const handleOwnerRequest = async (
      action: Nan0BridgeAction,
      payload: Nan0BridgeRequestMap[Nan0BridgeAction],
    ): Promise<any> => {
      diagnostic('bridge.owner.request', {
        action,
        thoughtId: (payload as any).thoughtId,
        turnId: (payload as any).turnId,
        memoryCount: kernel.getStateSnapshot().memories.length,
        revision: kernel.getStateSnapshot().revision ?? 0,
      })

      switch (action) {
        case 'prepare': {
          const prepared = await kernel.prepareTurn(payload as Nan0BridgeRequestMap['prepare'])
          lastThoughtId.value = prepared.thoughtId
          return toPreparedTurnProxy(prepared)
        }
        case 'complete': {
          const input = payload as Nan0BridgeRequestMap['complete']
          await kernel.recordAssistantTurn(input)
          return { persisted: true }
        }
        case 'terminal': {
          const input = payload as Nan0BridgeRequestMap['terminal']
          if (input.decision === 'SILENCE')
            await kernel.recordSilenceDecision(input)
          else {
            await kernel.recordNonSpeechDecision({
              ...input,
              decision: input.decision,
            })
          }
          return { persisted: true }
        }
        case 'fail': {
          await kernel.failTurn(payload as Nan0BridgeRequestMap['fail'])
          return { persisted: true }
        }
      }
    }

    activeInstallationCleanup?.()
    activeInstallationCleanup = setNan0OwnerHandler(renderer.instanceId, handleOwnerRequest)
    installed.value = true
    diagnostic('store.owner.install.complete', {
      memoryCount: kernel.getStateSnapshot().memories.length,
      thoughtCount: kernel.getStateSnapshot().thoughts.length,
      revision: kernel.getStateSnapshot().revision ?? 0,
    })
  }

  async function installExecutor(renderer: Nan0RendererIdentity): Promise<void> {
    const { useChatOrchestratorStore } = await import('./chat')
    const chat = useChatOrchestratorStore()
    const preparedTurns = new Map<string, Nan0PreparedTurnProxy>()

    function turnKey(context: { message: { id?: string } }): string {
      const messageId = context.message.id
      if (!messageId)
        throw new Error('Nan0 chat lifecycle context is missing a stable message ID.')
      return String(messageId)
    }

    const cleanups = [
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

        diagnostic('bridge.delegate.prepare.start', {
          messageId: context.message.id,
          sessionId: context.sessionId,
          actorId,
        })
        const prepared = await requestNan0Owner(renderer.instanceId, 'prepare', {
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
        diagnostic('bridge.delegate.prepare.complete', {
          thoughtId: prepared.thoughtId,
          turnId: prepared.turnId,
          sessionId: prepared.sessionId,
          inputEventId: prepared.inputEventId,
          thoughtStatus: prepared.thought.status,
          decision: prepared.thought.decision,
          speakability: prepared.thought.speakability,
        })
      }),

      chat.onAfterMessageComposed(async (_message, context) => {
        const prepared = preparedTurns.get(turnKey(context))
        if (!prepared) {
          diagnostic('bridge.delegate.after-compose.missing-prepared-turn')
          return
        }
        if (prepared.thought.status !== 'generated' || prepared.thought.decision !== 'SPEAK')
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
        diagnostic('bridge.delegate.after-compose.injected', {
          thoughtId: prepared.thoughtId,
          insertAt,
        })
      }),

      chat.onBeforeSend(async (_message, context) => {
        const prepared = preparedTurns.get(turnKey(context))
        if (!prepared)
          return

        let decision: 'SILENCE' | 'ACT' | 'WAIT'
        if (prepared.thought.status === 'failed') {
          decision = 'WAIT'
        }
        else {
          if (prepared.thought.decision === 'SPEAK')
            return
          decision = prepared.thought.decision
        }

        context.responseDisposition = {
          decision,
          reason: prepared.thought.status === 'failed'
            ? 'thought-generation-failed'
            : prepared.thought.reasonCodes.join(',') || `thought-${prepared.thought.decision.toLowerCase()}`,
          thoughtId: prepared.thoughtId,
        }
      }),

      chat.onAssistantResponseEnd(async (message, context) => {
        const key = turnKey(context)
        const prepared = preparedTurns.get(key)
        diagnostic('bridge.delegate.assistant-end.fired', {
          thoughtId: prepared?.thoughtId,
          outputLength: message.length,
        })
        if (!prepared)
          return

        await requestNan0Owner(renderer.instanceId, 'complete', {
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
        preparedTurns.delete(key)
        diagnostic('bridge.delegate.assistant-end.acknowledged', {
          thoughtId: prepared.thoughtId,
          turnId: prepared.turnId,
        })
      }),

      chat.onAssistantSilence(async (reason, context) => {
        const key = turnKey(context)
        const prepared = preparedTurns.get(key)
        if (!prepared)
          return
        if (prepared.thought.status === 'failed') {
          preparedTurns.delete(key)
          return
        }

        await requestNan0Owner(renderer.instanceId, 'terminal', {
          turnId: prepared.turnId,
          thoughtId: prepared.thoughtId,
          decision: prepared.thought.decision === 'SPEAK' ? 'SILENCE' : prepared.thought.decision,
          reason,
          timestamp: Number(context.assistantMessageCreatedAt ?? Date.now()),
          metadata: {
            assistantMessageId: context.assistantMessageId,
            inputType: context.input?.type,
            completionHook: 'onAssistantSilence',
          },
        })
        preparedTurns.delete(key)
      }),

      chat.onChatError(async (error, context) => {
        const key = turnKey(context)
        const prepared = preparedTurns.get(key)
        if (!prepared)
          return

        await requestNan0Owner(renderer.instanceId, 'fail', {
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
      }),
    ]

    activeInstallationCleanup?.()
    activeInstallationCleanup = () => {
      for (const cleanup of cleanups)
        cleanup()
      preparedTurns.clear()
    }
    installed.value = true
    diagnostic('store.executor.install.complete', {
      hookCount: cleanups.length,
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
