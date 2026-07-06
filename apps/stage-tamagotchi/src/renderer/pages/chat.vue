<script setup lang="ts">
import { estimateTokens, formatTokenCount } from '@proj-airi/stage-shared'
import { ChatBrainPopover } from '@proj-airi/stage-ui/components'
import { useChatSessionStore } from '@proj-airi/stage-ui/stores/chat/session-store'
import { useAiriCardStore } from '@proj-airi/stage-ui/stores/modules/airi-card'
import { useLiveSessionStore } from '@proj-airi/stage-ui/stores/modules/live-session'
import { useSettingsChat } from '@proj-airi/stage-ui/stores/settings'
import { storeToRefs } from 'pinia'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
import { computed } from 'vue'

import InteractiveArea from '../components/InteractiveArea.vue'
import WindowTitleBar from '../components/Window/TitleBar.vue'

const chatSessionStore = useChatSessionStore()
const airiCardStore = useAiriCardStore()
const liveSessionStore = useLiveSessionStore()
const settingsChat = useSettingsChat()

const { activeCard, activeCardId } = storeToRefs(airiCardStore)
const { activeSessionId, sessionMetas, messages } = storeToRefs(chatSessionStore)

// --- Active Session Info ---
const activeSessionMeta = computed(() => {
  if (!activeSessionId.value)
    return undefined
  return sessionMetas.value[activeSessionId.value]
})

// Formatting active session switcher label
const activeSessionLabel = computed(() => {
  const baseName = activeCard.value?.nickname || activeCard.value?.name || 'AIRI'
  const meta = activeSessionMeta.value
  if (!meta)
    return baseName

  const universe = meta.universeId && meta.universeId !== 'global' ? meta.universeId : ''
  const title = meta.title && meta.title !== 'Untitled Timeline' ? meta.title : ''

  if (universe && title) {
    return `${baseName} (${universe}>${title})`
  }
  else if (universe) {
    return `${baseName} (${universe})`
  }
  else if (title) {
    return `${baseName} (${title})`
  }
  return baseName
})

// List of sessions for dropdown
const characterSessions = computed(() => {
  if (!activeCardId.value)
    return []
  const characterIndex = chatSessionStore.getCharacterIndex(activeCardId.value)
  if (!characterIndex)
    return []
  return Object.values(characterIndex.sessions).sort((a, b) => b.updatedAt - a.updatedAt)
})

function handleSelectSession(sessionId: string) {
  chatSessionStore.setActiveSession(sessionId)
}

// --- Token Calculations ---
const sessionTokenCount = computed(() => {
  let total = 0
  for (const msg of messages.value) {
    if (typeof msg.content === 'string') {
      total += estimateTokens(msg.content)
    }
    else if (Array.isArray(msg.content)) {
      const textOnly = msg.content
        .map((part: any) => {
          if (typeof part === 'string')
            return part
          if (part && typeof part === 'object' && 'text' in part && !('image_url' in part))
            return String(part.text ?? '')
          return ''
        })
        .join('')
      total += estimateTokens(textOnly)
    }
  }
  return total
})

const formattedSessionTokenCount = computed(() => formatTokenCount(sessionTokenCount.value))

function formatAbbreviatedCount(num: number): string {
  if (num >= 1_000_000_000)
    return `${(num / 1_000_000_000).toFixed(1)}B`
  if (num >= 1_000_000)
    return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1000)
    return `${(num / 1000).toFixed(1)}K`
  return String(num)
}
</script>

<template>
  <div class="h-full w-full flex flex-col overflow-hidden pt-[44px]">
    <WindowTitleBar
      title="Chat"
      icon="i-solar:chat-line-bold"
    >
      <div class="relative w-full flex items-center justify-between px-2" drag-region>
        <!-- Left: Brand Logo & Label Link -->
        <div class="no-drag flex select-none items-center gap-2 outline-none">
          <img
            src="/@fs/Users/richardpinedo/Projects.nosync/airi/airi_dasilva333/packages/stage-layouts/src/assets/logo-dark.svg"
            class="theme-colored h-7 w-7"
          >
          <div class="translate-y-[1px] text-lg text-primary-500 font-semibold font-quicksand dark:text-primary-300">
            <span>AIRI</span>
          </div>
        </div>

        <!-- Center: Premium Session Selector Dropdown with Reka Popover -->
        <div class="no-drag absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <PopoverRoot>
            <PopoverTrigger as-child>
              <div
                class="flex cursor-pointer select-none items-center gap-2 border border-neutral-200/50 rounded-xl bg-neutral-100/30 px-3 py-1 text-xs font-bold transition-all duration-200 ease-in-out dark:border-neutral-800 dark:bg-neutral-900/40 hover:bg-neutral-200/50 hover:dark:bg-neutral-800/40"
              >
                <span class="max-w-64 truncate text-neutral-700 dark:text-neutral-300">{{ activeSessionLabel }}</span>
                <div class="i-solar:alt-arrow-down-bold text-[10px] text-neutral-400 opacity-60 dark:text-neutral-500" />
              </div>
            </PopoverTrigger>
            <PopoverPortal>
              <PopoverContent
                side="bottom"
                :side-offset="6"
                align="center"
                class="animate-in fade-in slide-in-from-top-1 z-[10000] w-64 border border-neutral-200/60 rounded-2xl bg-white/95 p-2 shadow-2xl backdrop-blur-xl duration-150 dark:border-neutral-800 dark:bg-neutral-950/95"
              >
                <div class="mb-1 select-none border-b border-neutral-100 px-2 py-1 text-[10px] text-neutral-400 font-bold tracking-wider uppercase dark:border-neutral-900">
                  Switch Timeline
                </div>
                <div class="max-h-60 overflow-y-auto scrollbar-thin space-y-1">
                  <div
                    v-for="session in characterSessions"
                    :key="session.sessionId"
                    class="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200"
                    :class="activeSessionId === session.sessionId ? 'bg-primary-50/50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/60 dark:hover:bg-neutral-900/40'"
                    @click="handleSelectSession(session.sessionId)"
                  >
                    <div class="flex flex-col">
                      <span class="max-w-44 truncate">{{ session.title || 'Untitled Timeline' }}</span>
                      <span v-if="session.universeId && session.universeId !== 'global'" class="mt-0.5 text-[9px] text-neutral-400 font-medium dark:text-neutral-500">
                        Universe: {{ session.universeId }}
                      </span>
                    </div>
                    <span class="ml-3 text-[10px] text-neutral-400 font-bold dark:text-neutral-500">
                      {{ session.messageCount || 0 }}
                    </span>
                  </div>
                </div>
              </PopoverContent>
            </PopoverPortal>
          </PopoverRoot>
        </div>

        <!-- Right: 2x Metrics & Brain LLM Icon -->
        <div class="no-drag flex items-center gap-4">
          <!-- 2x Metrics Pair -->
          <div class="flex select-none items-center gap-1">
            <!-- Global Metrics -->
            <div
              class="flex cursor-help items-center gap-1.5 px-2 py-1 text-[10px] text-neutral-400 font-bold tracking-tight uppercase dark:text-neutral-500"
              :title="`Lifetime Tokens (Global): ${Number(liveSessionStore.totalTokens || 0).toLocaleString()}`"
            >
              <div class="i-solar:chart-linear text-xs" />
              <span>{{ formatAbbreviatedCount(liveSessionStore.totalTokens || 0) }}</span>
            </div>
            <!-- Session Metrics -->
            <div
              class="flex cursor-help items-center gap-1.5 px-2 py-1 text-[10px] text-neutral-400 font-bold tracking-tight uppercase dark:text-neutral-500"
              title="Est. of tokens used for this chat"
            >
              <div class="i-solar:graph-bold-duotone text-xs" />
              <span>{{ formattedSessionTokenCount }}</span>
            </div>
          </div>

          <!-- Brain LLM Icon Button (opens downwards) -->
          <ChatBrainPopover side="bottom" />

          <!-- Settings Ellipsis Menu (Send Mode options) -->
          <PopoverRoot>
            <PopoverTrigger as-child>
              <button
                class="flex cursor-pointer items-center justify-center rounded-xl p-1.5 text-neutral-500 transition-all duration-200 ease-in-out hover:bg-neutral-200 dark:text-neutral-400 hover:text-neutral-700 hover:dark:bg-neutral-800 dark:hover:text-neutral-200"
                title="Send Options"
              >
                <div class="i-solar:menu-dots-bold text-base" />
              </button>
            </PopoverTrigger>
            <PopoverPortal>
              <PopoverContent
                class="animate-in fade-in slide-in-from-top-1 z-[10000] flex flex-col gap-1 border border-neutral-200/60 rounded-2xl bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl duration-150 dark:border-neutral-800 dark:bg-neutral-950/95"
                side="bottom"
                align="end"
                :side-offset="8"
              >
                <div class="select-none px-2 py-1 text-[10px] text-neutral-400 font-bold tracking-wider uppercase">
                  Send Key Mode
                </div>
                <button
                  v-for="mode in (['enter', 'ctrl-enter', 'double-enter'] as const)"
                  :key="mode"
                  :class="[
                    'px-3 py-2 text-xs font-semibold rounded-xl transition-all text-left flex items-center justify-between gap-4 w-full',
                    settingsChat.sendMode === mode
                      ? 'bg-primary-50/50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400'
                      : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800',
                  ]"
                  @click="settingsChat.sendMode = mode"
                >
                  <span>{{ mode === 'enter' ? 'Enter' : mode === 'ctrl-enter' ? 'Ctrl + Enter' : 'Double Enter' }}</span>
                  <div v-if="settingsChat.sendMode === mode" class="i-solar:check-circle-bold text-sm" />
                </button>
              </PopoverContent>
            </PopoverPortal>
          </PopoverRoot>
        </div>
      </div>
    </WindowTitleBar>
    <InteractiveArea
      class="interaction-area block h-full w-full p-4 transition-opacity duration-250"
    />
  </div>
</template>

<route lang="yaml">
meta:
  layout: stage
</route>
