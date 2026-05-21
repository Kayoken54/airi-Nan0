<script setup lang="ts">
import { useElectronEventaContext, useElectronEventaInvoke, useElectronMouseInWindow } from '@proj-airi/electron-vueuse'
import { WhisperDock } from '@proj-airi/stage-ui/components'
import { RendererStage } from '@proj-airi/stage-ui/components/scenes'
import { useBackgroundStore } from '@proj-airi/stage-ui/stores'
import { useSettings } from '@proj-airi/stage-ui/stores/settings'
import { useSettingsControlStrip } from '@proj-airi/stage-ui/stores/settings/control-strip'
import { useSettingsControlsIsland } from '@proj-airi/stage-ui/stores/settings/controls-island'
import { usePositioningStore } from '@proj-airi/stage-ui/stores/settings/positioning'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'

import { electron, electronStartDraggingWindow } from '../../shared/eventa'

const backgroundStore = useBackgroundStore()
const { activeBackgroundUrl } = storeToRefs(backgroundStore)

const settingsStore = useSettings()
const { stageModelSelected } = storeToRefs(settingsStore)

const controlStripStore = useSettingsControlStrip()
const { stageEnabled } = storeToRefs(controlStripStore)

const positioningStore = usePositioningStore()

const controlsIslandStore = useSettingsControlsIsland()
const { fadeOnHoverEnabled } = storeToRefs(controlsIslandStore)

const scale = computed(() => {
  return positioningStore.getPosition(stageModelSelected.value).scale
})

const xOffset = computed(() => {
  return positioningStore.getPosition(stageModelSelected.value).x
})

const yOffset = computed(() => {
  return positioningStore.getPosition(stageModelSelected.value).y
})

function handleScaleChange(val: number) {
  const current = positioningStore.getPosition(stageModelSelected.value)
  positioningStore.setPosition(stageModelSelected.value, {
    ...current,
    scale: val,
  })
}

function handleOffsetChange(val: { x: number, y: number }) {
  const current = positioningStore.getPosition(stageModelSelected.value)
  positioningStore.setPosition(stageModelSelected.value, {
    ...current,
    x: val.x,
    y: val.y,
  })
}

// WhisperDock stub tools
const tools = ref<any[]>([])
function handleSpawnStandalone() {}

// Window Dragging Handle
const context = useElectronEventaContext()
const startDraggingWindowInvoke = useElectronEventaInvoke(electronStartDraggingWindow, context.value)
function startDraggingWindow() {
  startDraggingWindowInvoke()
}

const whisperDockRef = ref<InstanceType<typeof WhisperDock>>()
const whisperDockIsOpen = computed(() => whisperDockRef.value?.isOpen ?? false)

// Fade overlay controls on hover states
const showControls = ref(false)

// Auto-hide (fade-on-hover) for the stage window.
// When enabled, entering the window fades the character to invisible and enables click-through.
// The ControlStrip window always stays visible — only the actor stage window fades.
const setIgnoreMouseEvents = useElectronEventaInvoke(electron.window.setIgnoreMouseEvents)
const stageIsHidden = ref(false)

const { isOutside: isOutsideWindow } = useElectronMouseInWindow()
const isInsideWindow = computed(() => !isOutsideWindow.value)

watch(
  [isInsideWindow, fadeOnHoverEnabled, stageEnabled],
  ([inside, fadeEnabled, stageOn]) => {
    if (!stageOn) {
      stageIsHidden.value = false
      setIgnoreMouseEvents([false, { forward: true }])
      showControls.value = false
      return
    }

    const shouldHide = fadeEnabled && inside
    stageIsHidden.value = shouldHide
    setIgnoreMouseEvents([shouldHide, { forward: true }])
    showControls.value = inside && !shouldHide
  },
  { immediate: true },
)
</script>

<template>
  <div
    :class="[
      'relative h-full w-full flex flex-col overflow-hidden rounded-xl bg-transparent',
      'transition-opacity duration-300 ease-in-out',
      stageIsHidden ? 'opacity-0' : 'opacity-100',
    ]"
  >
    <div class="relative h-full w-full overflow-hidden rounded-2xl">
      <!-- Scene Background Layer -->
      <div
        v-if="activeBackgroundUrl"
        :class="[
          'absolute inset-0 z-0',
          'transition-opacity duration-500',
        ]"
        :style="{
          backgroundImage: `url(${activeBackgroundUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }"
      />

      <!-- Standalone Graphics Model Scene Renderer -->
      <div class="absolute inset-0 z-10">
        <RendererStage
          :paused="!stageEnabled"
          :focus-at="{ x: 0, y: 0 }"
          :x-offset="xOffset"
          :y-offset="yOffset"
          :scale="scale"
          @scale-change="handleScaleChange"
          @offset-change="handleOffsetChange"
        />
      </div>

      <!-- Floating Window Drag Control (Fades on hover) -->
      <Transition
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-300 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showControls"
          class="pointer-events-auto absolute right-4 top-4 z-50"
        >
          <button
            class="w-fit flex cursor-pointer items-center self-end justify-center border-2 border-neutral-200/60 rounded-xl border-solid bg-neutral-50/80 p-2 backdrop-blur-md transition-all transition-duration-300 transition-ease-out active:scale-95 dark:border-neutral-800/10 dark:bg-neutral-800/70 hover:transition-none"
            title="Drag to Reposition Stage"
            @mousedown="startDraggingWindow"
          >
            <div class="i-ph:arrows-out-cardinal size-5 text-neutral-800 dark:text-neutral-300" />
          </button>
        </div>
      </Transition>

      <!-- WhisperDock horizontal input overlay -->
      <Transition
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-300 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <WhisperDock
          v-if="showControls || whisperDockIsOpen"
          ref="whisperDockRef"
          :tools="tools"
          @spawn-standalone="handleSpawnStandalone"
        />
      </Transition>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: stage
</route>
