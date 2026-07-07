<script setup lang="ts">
import { estimateTokens, formatTokenCount } from '@proj-airi/stage-shared'
import { ChatBrainPopover, ChatMemoryPopover } from '@proj-airi/stage-ui/components'
import { useChatSessionStore } from '@proj-airi/stage-ui/stores/chat/session-store'
import { useAiriCardStore } from '@proj-airi/stage-ui/stores/modules/airi-card'
import { useLiveSessionStore } from '@proj-airi/stage-ui/stores/modules/live-session'
import { useSettingsChat } from '@proj-airi/stage-ui/stores/settings'
import { useLocalStorage, useWindowSize } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
import { computed, ref } from 'vue'

import InteractiveArea from '../components/InteractiveArea.vue'
import WindowTitleBar from '../components/Window/TitleBar.vue'

const interactiveAreaRef = ref<InstanceType<typeof InteractiveArea> | null>(null)

const chatSessionStore = useChatSessionStore()
const airiCardStore = useAiriCardStore()
const liveSessionStore = useLiveSessionStore()
const settingsChat = useSettingsChat()

const { activeCard, activeCardId } = storeToRefs(airiCardStore)
const { activeSessionId, sessionMetas, messages } = storeToRefs(chatSessionStore)

// --- Bridge handlers for ChatMemoryPopover → InteractiveArea ---
function handleViewContext() {
  if (interactiveAreaRef.value)
    interactiveAreaRef.value.showContext = true
}

function handleManageSessions() {
  if (interactiveAreaRef.value)
    interactiveAreaRef.value.showSessions = true
}

function handleSearchMemories() {
  interactiveAreaRef.value?.openSearchModal()
}

function handleClearMessages() {
  interactiveAreaRef.value?.handleTrashClick()
}

const isRightPanelOpen = useLocalStorage('airi:chat:right-panel-open', false)
const { width } = useWindowSize()
const showRightPanel = computed(() => isRightPanelOpen.value && width.value >= 768)
const mediaDisplayCount = ref(12)

// --- Grounding toggle helpers ---
function handleToggleGrounding() {
  if (activeCardId.value)
    airiCardStore.toggleGrounding(activeCardId.value)
}

function handleToggleGroundingMemory() {
  if (activeCardId.value)
    airiCardStore.toggleGroundingMemory(activeCardId.value)
}

function handleToggleGroundingTopics() {
  if (activeCardId.value)
    airiCardStore.toggleGroundingTopics(activeCardId.value)
}

function handleToggleGroundingDirectorScratchpad() {
  if (activeCardId.value)
    airiCardStore.toggleGroundingDirectorScratchpad(activeCardId.value)
}

function handleToggleImageDirector() {
  if (!activeCardId.value || !activeCard.value)
    return
  const current = activeCard.value.extensions?.airi?.artistry?.autonomousEnabled ?? false
  airiCardStore.updateCard(activeCardId.value, {
    extensions: {
      ...activeCard.value.extensions,
      airi: {
        ...activeCard.value.extensions?.airi,
        artistry: {
          ...activeCard.value.extensions?.airi?.artistry,
          autonomousEnabled: !current,
        },
      },
    },
  } as any)
}

function handleToggleHeartbeats() {
  if (!activeCardId.value || !activeCard.value)
    return
  const current = activeCard.value.extensions?.airi?.heartbeats?.enabled ?? false
  airiCardStore.updateCard(activeCardId.value, {
    extensions: {
      ...activeCard.value.extensions,
      airi: {
        ...activeCard.value.extensions?.airi,
        heartbeats: {
          ...activeCard.value.extensions?.airi?.heartbeats,
          enabled: !current,
        },
      },
    },
  } as any)
}

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
        <!-- Left: Brand Logo & Premium Session Selector -->
        <div class="no-drag flex select-none items-center gap-3 outline-none">
          <div class="flex items-center gap-2">
            <img
              src="/@fs/Users/richardpinedo/Projects.nosync/airi/airi_dasilva333/packages/stage-layouts/src/assets/logo-dark.svg"
              class="theme-colored h-7 w-7"
            >
            <div class="translate-y-[1px] text-lg text-primary-500 font-semibold font-quicksand dark:text-primary-300">
              <span>AIRI</span>
            </div>
          </div>

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

        <!-- Right: Stacked Metrics, Memory & Context placeholder, Brain LLM Icon -->
        <div class="no-drag flex items-center gap-3">
          <!-- Stacked Metrics: one icon, two stats vertically -->
          <div
            class="flex cursor-help select-none items-center gap-1.5"
            :title="`Global: ${Number(liveSessionStore.totalTokens || 0).toLocaleString()} · Session: ${formattedSessionTokenCount}`"
          >
            <div class="i-solar:chart-linear text-xs text-neutral-400 dark:text-neutral-500" />
            <div class="flex flex-col gap-[2px] leading-none">
              <span class="text-[9px] text-neutral-400 font-bold tracking-tight uppercase dark:text-neutral-500">
                {{ formatAbbreviatedCount(liveSessionStore.totalTokens || 0) }}
              </span>
              <span class="text-[9px] text-primary-400 font-bold tracking-tight uppercase dark:text-primary-400">
                {{ formattedSessionTokenCount }}
              </span>
            </div>
          </div>

          <!-- Memory & Context Popover (moved from bottom toolbar) -->
          <ChatMemoryPopover
            show-cache-status
            :title="`Memory & Context for ${activeCard?.name || 'Character'}`"
            @view-context="handleViewContext"
            @manage-sessions="handleManageSessions"
            @search-memories="handleSearchMemories"
            @clear-messages="handleClearMessages"
          />

          <!-- Brain LLM Icon Button (opens downwards) -->
          <ChatBrainPopover side="bottom" />

          <!-- Settings Ellipsis Menu (Send Mode + Grounding Modes) -->
          <PopoverRoot>
            <PopoverTrigger as-child>
              <button
                class="flex cursor-pointer items-center justify-center rounded-xl p-1.5 text-neutral-500 transition-all duration-200 ease-in-out hover:bg-neutral-200 dark:text-neutral-400 hover:text-neutral-700 hover:dark:bg-neutral-800 dark:hover:text-neutral-200"
                title="Options"
              >
                <div class="i-solar:menu-dots-bold text-base" />
              </button>
            </PopoverTrigger>
            <PopoverPortal>
              <PopoverContent
                class="animate-in fade-in slide-in-from-top-1 z-[10000] w-64 flex flex-col gap-1 border border-neutral-200/60 rounded-2xl bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl duration-150 dark:border-neutral-800 dark:bg-neutral-950/95"
                side="bottom"
                align="end"
                :side-offset="8"
              >
                <!-- Section: Send Key Mode -->
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

                <!-- Section Divider -->
                <div class="mx-2 my-1 border-t border-neutral-200/60 dark:border-neutral-800" />

                <!-- Section: Grounding Modes -->
                <div class="select-none px-2 py-1 text-[10px] text-neutral-400 font-bold tracking-wider uppercase">
                  Grounding Modes
                </div>

                <!-- Toggle: System Sensors -->
                <div
                  class="w-full flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  @click="handleToggleGrounding"
                >
                  <div class="flex items-center gap-2.5">
                    <div
                      class="text-base"
                      :class="activeCard?.extensions?.airi?.groundingEnabled
                        ? 'text-amber-500 i-solar:cpu-bolt-bold-duotone'
                        : 'text-neutral-400 dark:text-neutral-500 i-solar:cpu-bold-duotone'"
                    />
                    <div class="flex flex-col">
                      <span class="text-xs text-neutral-700 font-semibold dark:text-neutral-200">System Sensors</span>
                      <span class="text-[9px] text-neutral-400">Inject real-time OS telemetry</span>
                    </div>
                  </div>
                  <div
                    :class="activeCard?.extensions?.airi?.groundingEnabled ? 'bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700'"
                    class="relative h-4 w-7 inline-flex shrink-0 cursor-pointer items-center border border-transparent rounded-full transition-colors duration-200 ease-in-out"
                  >
                    <span
                      :class="activeCard?.extensions?.airi?.groundingEnabled ? 'translate-x-3.5' : 'translate-x-0.5'"
                      class="pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                    />
                  </div>
                </div>

                <!-- Toggle: Universe Memory (RAG) -->
                <div
                  class="w-full flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  @click="handleToggleGroundingMemory"
                >
                  <div class="flex items-center gap-2.5">
                    <div
                      class="text-base"
                      :class="activeCard?.extensions?.airi?.groundingMemoryEnabled
                        ? 'text-amber-500 i-solar:database-bold-duotone'
                        : 'text-neutral-400 dark:text-neutral-500 i-solar:database-linear'"
                    />
                    <div class="flex flex-col">
                      <span class="text-xs text-neutral-700 font-semibold dark:text-neutral-200">Universe Memory (RAG)</span>
                      <span class="text-[9px] text-neutral-400">Semantic long-term memory lookup</span>
                    </div>
                  </div>
                  <div
                    :class="activeCard?.extensions?.airi?.groundingMemoryEnabled ? 'bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700'"
                    class="relative h-4 w-7 inline-flex shrink-0 cursor-pointer items-center border border-transparent rounded-full transition-colors duration-200 ease-in-out"
                  >
                    <span
                      :class="activeCard?.extensions?.airi?.groundingMemoryEnabled ? 'translate-x-3.5' : 'translate-x-0.5'"
                      class="pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                    />
                  </div>
                </div>

                <!-- Toggle: Recent Topics -->
                <div
                  class="w-full flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  @click="handleToggleGroundingTopics"
                >
                  <div class="flex items-center gap-2.5">
                    <div
                      class="text-base"
                      :class="activeCard?.extensions?.airi?.groundingTopicsEnabled
                        ? 'text-amber-500 i-solar:hashtag-bold-duotone'
                        : 'text-neutral-400 dark:text-neutral-500 i-solar:hashtag-linear'"
                    />
                    <div class="flex flex-col">
                      <span class="text-xs text-neutral-700 font-semibold dark:text-neutral-200">Recent Topics</span>
                      <span class="text-[9px] text-neutral-400">Inject active trending context</span>
                    </div>
                  </div>
                  <div
                    :class="activeCard?.extensions?.airi?.groundingTopicsEnabled ? 'bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700'"
                    class="relative h-4 w-7 inline-flex shrink-0 cursor-pointer items-center border border-transparent rounded-full transition-colors duration-200 ease-in-out"
                  >
                    <span
                      :class="activeCard?.extensions?.airi?.groundingTopicsEnabled ? 'translate-x-3.5' : 'translate-x-0.5'"
                      class="pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                    />
                  </div>
                </div>

                <!-- Toggle: Visual Scene State -->
                <div
                  class="w-full flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  @click="handleToggleGroundingDirectorScratchpad"
                >
                  <div class="flex items-center gap-2.5">
                    <div
                      class="text-base"
                      :class="activeCard?.extensions?.airi?.groundingDirectorScratchpadEnabled
                        ? 'text-amber-500 i-solar:gallery-bold-duotone'
                        : 'text-neutral-400 dark:text-neutral-500 i-solar:gallery-linear'"
                    />
                    <div class="flex flex-col">
                      <span class="text-xs text-neutral-700 font-semibold dark:text-neutral-200">Visual Scene State</span>
                      <span class="text-[9px] text-neutral-400">Attach Director's latest scratchpad</span>
                    </div>
                  </div>
                  <div
                    :class="activeCard?.extensions?.airi?.groundingDirectorScratchpadEnabled ? 'bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700'"
                    class="relative h-4 w-7 inline-flex shrink-0 cursor-pointer items-center border border-transparent rounded-full transition-colors duration-200 ease-in-out"
                  >
                    <span
                      :class="activeCard?.extensions?.airi?.groundingDirectorScratchpadEnabled ? 'translate-x-3.5' : 'translate-x-0.5'"
                      class="pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                    />
                  </div>
                </div>

                <!-- Section Divider -->
                <div class="mx-2 my-1 border-t border-neutral-200/60 dark:border-neutral-800" />

                <!-- Section: Modes -->
                <div class="select-none px-2 py-1 text-[10px] text-neutral-400 font-bold tracking-wider uppercase">
                  Modes
                </div>

                <!-- Toggle: Image Director -->
                <div
                  class="w-full flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  @click="handleToggleImageDirector"
                >
                  <div class="flex items-center gap-2.5">
                    <div
                      class="text-base"
                      :class="activeCard?.extensions?.airi?.artistry?.autonomousEnabled
                        ? 'text-primary-500 i-solar:gallery-wide-bold-duotone'
                        : 'text-neutral-400 dark:text-neutral-500 i-solar:gallery-wide-linear'"
                    />
                    <div class="flex flex-col">
                      <span class="text-xs text-neutral-700 font-semibold dark:text-neutral-200">Image Director</span>
                      <span class="text-[9px] text-neutral-400">Generates a new image for every turn</span>
                    </div>
                  </div>
                  <div
                    :class="activeCard?.extensions?.airi?.artistry?.autonomousEnabled ? 'bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700'"
                    class="relative h-4 w-7 inline-flex shrink-0 cursor-pointer items-center border border-transparent rounded-full transition-colors duration-200 ease-in-out"
                  >
                    <span
                      :class="activeCard?.extensions?.airi?.artistry?.autonomousEnabled ? 'translate-x-3.5' : 'translate-x-0.5'"
                      class="pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                    />
                  </div>
                </div>

                <!-- Toggle: Heartbeats -->
                <div
                  class="w-full flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  @click="handleToggleHeartbeats"
                >
                  <div class="flex items-center gap-2.5">
                    <div
                      class="text-base"
                      :class="activeCard?.extensions?.airi?.heartbeats?.enabled
                        ? 'text-primary-500 i-solar:heart-pulse-bold-duotone'
                        : 'text-neutral-400 dark:text-neutral-500 i-solar:heart-pulse-linear'"
                    />
                    <div class="flex flex-col">
                      <span class="text-xs text-neutral-700 font-semibold dark:text-neutral-200">Heartbeats</span>
                      <span class="text-[9px] text-neutral-400">Activates character periodically</span>
                    </div>
                  </div>
                  <div
                    :class="activeCard?.extensions?.airi?.heartbeats?.enabled ? 'bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700'"
                    class="relative h-4 w-7 inline-flex shrink-0 cursor-pointer items-center border border-transparent rounded-full transition-colors duration-200 ease-in-out"
                  >
                    <span
                      :class="activeCard?.extensions?.airi?.heartbeats?.enabled ? 'translate-x-3.5' : 'translate-x-0.5'"
                      class="pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                    />
                  </div>
                </div>
              </PopoverContent>
            </PopoverPortal>
          </PopoverRoot>

          <!-- Right Context Panel Toggle (md+) -->
          <button
            class="cursor-pointer items-center justify-center rounded-xl p-1.5 text-neutral-500 transition-all duration-200 ease-in-out hidden md:inline-flex hover:bg-neutral-200 dark:text-neutral-400 hover:text-neutral-700 hover:dark:bg-neutral-800 dark:hover:text-neutral-200"
            :class="{ 'text-primary-500 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-950/30': isRightPanelOpen }"
            :title="isRightPanelOpen ? 'Close context panel' : 'Open context panel'"
            @click="isRightPanelOpen = !isRightPanelOpen"
          >
            <div class="i-solar:sidebar-minimalistic-bold-duotone text-base" />
          </button>
        </div>
      </div>
    </WindowTitleBar>
    <div class="flex flex-1 overflow-hidden">
      <div
        :class="['flex flex-col overflow-hidden transition-all duration-300 ease-in-out',
                 showRightPanel ? 'w-9/12 border-r border-neutral-200/50 dark:border-neutral-800/50' : 'w-full']"
      >
        <InteractiveArea
          ref="interactiveAreaRef"
          class="interaction-area block h-full w-full p-4 transition-opacity duration-250"
        />
      </div>

      <!-- Right Context Panel -->
      <Transition name="slide-right">
        <div
          v-if="showRightPanel"
          class="w-3/12 flex flex-col overflow-y-auto bg-neutral-50/30 dark:bg-neutral-950/30"
        >
          <!-- Panel Header -->
          <div class="flex select-none items-center justify-between border-b border-neutral-200/50 px-4 py-3 dark:border-neutral-800/50">
            <span class="text-xs text-neutral-500 font-bold tracking-wider uppercase dark:text-neutral-400">Context Panel</span>
            <button
              class="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              title="Close context panel"
              @click="isRightPanelOpen = false"
            >
              <div class="i-solar:close-square-outline text-sm" />
            </button>
          </div>

          <!-- Panel Body -->
          <div class="flex flex-col gap-4 p-4">
            <!-- Media Gallery Section -->
            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <span class="text-[10px] text-neutral-500 font-bold tracking-wider uppercase dark:text-neutral-400">Media Gallery</span>
                <div class="flex items-center gap-2">
                  <button
                    class="select-none text-[10px] text-primary-500 font-bold transition-colors hover:text-primary-600"
                    @click="interactiveAreaRef?.openImagineDialog()"
                  >
                    + Add
                  </button>
                  <button
                    class="select-none text-[10px] text-neutral-400 font-bold transition-colors hover:text-neutral-600"
                    @click="interactiveAreaRef?.openBackgroundDialog()"
                  >
                    View All
                  </button>
                </div>
              </div>
              <div class="grid grid-cols-3 gap-1.5">
                <div
                  v-for="entry in (interactiveAreaRef?.allImageEntries ?? []).slice(0, mediaDisplayCount)"
                  :key="entry.id"
                  :class="[
                    'group relative aspect-square cursor-pointer overflow-hidden rounded-lg',
                    'border border-neutral-200/60 transition-all hover:border-primary-400',
                    'dark:border-neutral-800/60 dark:hover:border-primary-500',
                    'bg-neutral-200/50 dark:bg-neutral-800/50',
                  ]"
                  @click="interactiveAreaRef?.openImagePreview?.(entry)"
                >
                  <img
                    v-if="entry.url"
                    :src="entry.url"
                    class="h-full w-full object-cover"
                  >
                  <!-- Placeholder square when no url -->
                  <div v-else class="h-full w-full" />
                  <!-- Hover overlay -->
                  <div class="absolute inset-0 flex items-end from-black/50 to-transparent bg-gradient-to-t p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <span class="truncate text-[8px] text-white font-medium leading-tight">{{ entry.title }}</span>
                  </div>
                </div>
                <!-- Fill remaining slots with placeholders -->
                <div
                  v-for="n in Math.max(0, mediaDisplayCount - (interactiveAreaRef?.allImageEntries?.length ?? 0))"
                  :key="`fill-${n}`"
                  class="aspect-square border border-neutral-200/60 rounded-lg bg-neutral-100/50 dark:border-neutral-800/60 dark:bg-neutral-800/30"
                />
              </div>

              <!-- View More -->
              <button
                class="w-full flex items-center justify-center gap-1.5 border border-neutral-200/60 rounded-xl bg-neutral-50/50 py-2 text-[10px] text-neutral-500 font-bold tracking-wider uppercase transition-all dark:border-neutral-800/60 hover:border-primary-200 dark:bg-neutral-950/50 dark:text-neutral-400 hover:text-primary-500 dark:hover:border-primary-800 dark:hover:text-primary-400"
                @click="mediaDisplayCount += 12"
              >
                View More
                <span class="i-solar:alt-arrow-down-bold text-[8px]" />
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}
.slide-right-enter-from,
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}
</style>

<route lang="yaml">
meta:
  layout: stage
</route>
