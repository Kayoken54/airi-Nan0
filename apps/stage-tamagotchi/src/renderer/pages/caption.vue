<script setup lang="ts">
import CaptionPanel from '@proj-airi/stage-ui/components/scenes/CaptionPanel.vue'

import { defineInvoke } from '@moeru/eventa'
import { useElectronEventaContext, useElectronEventaInvoke, useElectronMouseAroundWindowBorder, useElectronMouseInElement, useElectronMouseInWindow } from '@proj-airi/electron-vueuse'
import { useSettings } from '@proj-airi/stage-ui/stores/settings'
import { refDebounced } from '@vueuse/core'
import { computed, onMounted, ref, watch } from 'vue'

import { captionGetIsFollowingWindow, captionIsFollowingWindowChanged, electron, electronCaptionSetFollowWindow } from '../../shared/eventa'

const setIgnoreMouseEvents = useElectronEventaInvoke(electron.window.setIgnoreMouseEvents)
const setFollowWindow = useElectronEventaInvoke(electronCaptionSetFollowWindow)
const attached = ref(true)
const settingsStore = useSettings()

const { isOutside: isOutsideWindow } = useElectronMouseInWindow()
const isOutsideWindowFor250Ms = refDebounced(isOutsideWindow, 250)
const shouldFadeOnCursorWithin = computed(() => !isOutsideWindowFor250Ms.value)

const dragHandleRef = ref<HTMLElement | null>(null)
const { isOutside: isOutsideDragHandle } = useElectronMouseInElement(dragHandleRef)

const { isNearAnyBorder: isAroundWindowBorder } = useElectronMouseAroundWindowBorder({ threshold: 15 })
const isAroundWindowBorderFor250Ms = refDebounced(isAroundWindowBorder, 250)

const isInteractiveArea = computed(() => {
  return !isOutsideDragHandle.value || isAroundWindowBorder.value
})

watch(isInteractiveArea, (interactive) => {
  const ignore = !interactive
  console.log('[Caption] setIgnoreMouseEvents:', ignore)
  setIgnoreMouseEvents([ignore, { forward: true }])
}, { immediate: true })

const context = useElectronEventaContext()
const getAttached = defineInvoke(context.value, captionGetIsFollowingWindow)

onMounted(async () => {
  try {
    const isAttached = await getAttached()
    attached.value = Boolean(isAttached)
  }
  catch {}

  try {
    context.value.on(captionIsFollowingWindowChanged, (event) => {
      const val = Boolean(event?.body)
      attached.value = val
    })
  }
  catch {}

  try {
    // Synchronize spatial follow with dashboard toggle
    watch(() => settingsStore.captionFollowStage, (shouldFollow) => {
      console.log('[Caption] Follow status changed:', shouldFollow)
      attached.value = shouldFollow
      setFollowWindow(shouldFollow)
    }, { immediate: true })

    // Listen for Layout Mode transitions
    watch(() => settingsStore.captionLayoutMode, (mode) => {
      console.log('[Caption] Layout mode changed:', mode)
    }, { immediate: true })

    // Listen for Home Snap triggers
    watch(() => settingsStore.captionResetTrigger, () => {
      console.log('[Caption] Reset Position triggered.')
      if (!settingsStore.captionFollowStage) {
        settingsStore.captionFollowStage = true
      }
    })
  }
  catch {}
})
</script>

<template>
  <div
    :class="[
      'pointer-events-none relative h-full w-full flex justify-center overflow-hidden',
      settingsStore.captionDocking === 'top' ? 'items-start' : 'items-end',
    ]"
  >
    <!-- Modular Caption Panel -->
    <CaptionPanel
      :show-active-sentence-only="settingsStore.captionLayoutMode === 'single'"
      :fade-on-cursor="shouldFadeOnCursorWithin"
    />

    <!-- Drag Handle: only visible when detached and hovering the window area -->
    <Transition
      enter-active-class="transition-opacity duration-250 ease-in-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-250 ease-in-out"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="!attached && shouldFadeOnCursorWithin"
        ref="dragHandleRef"
        class="[-webkit-app-region:drag] pointer-events-auto absolute left-1/2 top-4 h-[14px] w-[36px] border border-[rgba(125,125,125,0.35)] rounded-[10px] bg-[rgba(125,125,125,0.75)] backdrop-blur-[6px] -translate-x-1/2"
        title="Drag to move"
      >
        <div class="absolute left-1/2 top-1/2 h-[3px] w-4 rounded-full bg-[rgba(255,255,255,0.85)] -translate-x-1/2 -translate-y-1/2" />
      </div>
    </Transition>

    <Transition
      enter-active-class="transition-opacity duration-250 ease-in-out"
      enter-from-class="opacity-50"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-250 ease-in-out"
      leave-from-class="opacity-100"
      leave-to-class="opacity-50"
    >
      <div v-if="isAroundWindowBorderFor250Ms" class="pointer-events-none absolute left-0 top-0 z-999 h-full w-full">
        <div
          :class="[
            'b-primary/50',
            'h-full w-full animate-flash animate-duration-3s animate-count-infinite b-4 rounded-2xl',
          ]"
        />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

<route lang="yaml">
meta:
  layout: stage
</route>
