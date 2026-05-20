<script setup lang="ts">
import { useElectronEventaInvoke } from '@proj-airi/electron-vueuse'
import { useSettings, useSettingsControlStrip } from '@proj-airi/stage-ui/stores/settings'
import { usePositioningStore } from '@proj-airi/stage-ui/stores/settings/positioning'
import { computed } from 'vue'

import { electronCustomizerToggleVisibility } from '../../shared/eventa'

const settingsStore = useSettings()
const controlStripStore = useSettingsControlStrip()
const positioningStore = usePositioningStore()

const toggleCustomizerVisibility = useElectronEventaInvoke(electronCustomizerToggleVisibility)

const modelSelected = computed(() => settingsStore.stageModelSelected || 'default')

const currentPosition = computed(() => {
  return positioningStore.getPosition(modelSelected.value)
})

const xVal = computed({
  get: () => currentPosition.value.x,
  set: (v) => {
    positioningStore.setPosition(modelSelected.value, {
      ...currentPosition.value,
      x: Number(v),
    })
  },
})

const yVal = computed({
  get: () => currentPosition.value.y,
  set: (v) => {
    positioningStore.setPosition(modelSelected.value, {
      ...currentPosition.value,
      y: Number(v),
    })
  },
})

const scaleVal = computed({
  get: () => currentPosition.value.scale,
  set: (v) => {
    positioningStore.setPosition(modelSelected.value, {
      ...currentPosition.value,
      scale: Number(v),
    })
  },
})

const buttons = computed(() => controlStripStore.buttons)

// Helper to filter core customizable slots for the tactile mockup
const mockSlots = computed(() => {
  return buttons.value.filter(btn => ['chat', 'stage', 'mic', 'caption', 'gemini-session'].includes(btn.id))
})

async function closeWindow() {
  await toggleCustomizerVisibility(false)
}

function resetPlacement() {
  positioningStore.setPosition(modelSelected.value, { x: 0, y: 0, scale: 1 })
}
</script>

<template>
  <div class="h-screen w-screen flex flex-col select-none overflow-hidden bg-transparent p-3 font-sans">
    <!-- Premium Container with intense glassmorphism -->
    <div class="relative h-full w-full flex flex-col overflow-hidden border border-white/10 rounded-2xl bg-neutral-950/80 shadow-2xl backdrop-blur-2xl dark:border-neutral-800/80">
      <!-- Radial background glowing anomalies -->
      <div class="pointer-events-none absolute h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl -left-16 -top-16" />
      <div class="pointer-events-none absolute h-44 w-44 rounded-full bg-sky-500/10 blur-3xl -bottom-16 -right-16" />

      <!-- Draggable Header -->
      <div class="[-webkit-app-region:drag] flex items-center justify-between border-b border-white/5 px-4 py-3.5">
        <div class="flex items-center gap-2.5">
          <div class="i-solar:widget-linear animate-pulse text-lg text-emerald-400" />
          <span class="text-xs text-neutral-100 font-bold tracking-widest uppercase">Control Customizer</span>
        </div>
        <!-- Action Buttons (non-draggable) -->
        <button
          class="pointer-events-auto rounded-lg p-1.5 text-neutral-400 transition-all duration-200 active:scale-95 hover:bg-white/10 hover:text-neutral-100 dark:hover:bg-neutral-800/60"
          @click="closeWindow"
        >
          <div class="i-solar:close-square-linear text-lg" />
        </button>
      </div>

      <!-- Scroller Area -->
      <div class="scrollbar-hide flex-1 overflow-y-auto px-4 py-4 space-y-5">
        <!-- Section 1: Control Strip Layout Manager -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[11px] text-emerald-400/90 font-bold tracking-wider uppercase">Control Strip Slots</span>
            <span class="text-[10px] text-neutral-500">Live Sync</span>
          </div>

          <div class="border border-white/5 rounded-xl bg-white/5 p-3 space-y-3.5 dark:bg-neutral-900/40">
            <div
              v-for="btn in mockSlots"
              :key="btn.id"
              class="flex items-center justify-between"
            >
              <div class="flex items-center gap-3">
                <!-- Icon wrapper with subtle glow -->
                <div :class="['w-7 h-7 rounded-lg bg-neutral-800/40 border border-white/5 flex items-center justify-center text-neutral-300', btn.icon]" />
                <span class="text-xs text-neutral-200 font-semibold">{{ btn.label }}</span>
              </div>

              <!-- Interactive Glass Switch -->
              <button
                :class="[
                  btn.enabled ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-neutral-800/25 border-neutral-700/20',
                  'relative inline-flex h-5.5 w-10.5 shrink-0 cursor-pointer rounded-full border transition-all duration-300 ease-out active:scale-95',
                ]"
                @click="btn.enabled = !btn.enabled"
              >
                <span
                  :class="[
                    btn.enabled ? 'translate-x-5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'translate-x-0.5 bg-neutral-500',
                    'pointer-events-none inline-block h-4 w-4 transform rounded-full transition-all duration-300 ease-out mt-[2px]',
                  ]"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- Section 2: Avatar Placement & Scale (Legacy Stage Transition) -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[11px] text-sky-400/95 font-bold tracking-wider uppercase">Avatar Stage Offset</span>
            <button
              class="text-[10px] text-neutral-400 transition-colors duration-150 hover:text-sky-300"
              @click="resetPlacement"
            >
              Reset All
            </button>
          </div>

          <div class="border border-white/5 rounded-xl bg-white/5 p-3 space-y-4 dark:bg-neutral-900/40">
            <!-- X Slider -->
            <div class="space-y-1.5">
              <div class="flex justify-between text-[11px] text-neutral-400 font-medium">
                <span>Horizontal (X)</span>
                <span class="text-neutral-200 font-mono">{{ xVal.toFixed(2) }}</span>
              </div>
              <input
                v-model.number="xVal"
                type="range"
                min="-3"
                max="3"
                step="0.05"
                class="h-1 w-full cursor-pointer appearance-none rounded-lg bg-neutral-800 accent-sky-400 focus:outline-none"
              >
            </div>

            <!-- Y Slider -->
            <div class="space-y-1.5">
              <div class="flex justify-between text-[11px] text-neutral-400 font-medium">
                <span>Vertical (Y)</span>
                <span class="text-neutral-200 font-mono">{{ yVal.toFixed(2) }}</span>
              </div>
              <input
                v-model.number="yVal"
                type="range"
                min="-3"
                max="3"
                step="0.05"
                class="h-1 w-full cursor-pointer appearance-none rounded-lg bg-neutral-800 accent-sky-400 focus:outline-none"
              >
            </div>

            <!-- Scale Slider -->
            <div class="space-y-1.5">
              <div class="flex justify-between text-[11px] text-neutral-400 font-medium">
                <span>Scale (Zoom)</span>
                <span class="text-neutral-200 font-mono">{{ scaleVal.toFixed(2) }}x</span>
              </div>
              <input
                v-model.number="scaleVal"
                type="range"
                min="0.1"
                max="4"
                step="0.05"
                class="h-1 w-full cursor-pointer appearance-none rounded-lg bg-neutral-800 accent-sky-400 focus:outline-none"
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="flex items-center justify-between border-t border-white/5 bg-black/25 px-4 py-3.5 text-[10px] text-neutral-500 font-medium">
        <span>Model: <span class="text-neutral-400 font-mono">{{ modelSelected }}</span></span>
        <span class="flex items-center gap-1">
          <span class="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400" />
          Active
        </span>
      </div>
    </div>
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

/* Accent style range inputs */
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #38bdf8;
  cursor: pointer;
  box-shadow: 0 0 6px rgba(56, 189, 248, 0.6);
  transition: all 0.15s ease-out;
}
input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.9);
}
</style>

<route lang="yaml">
meta:
  layout: stage
</route>
