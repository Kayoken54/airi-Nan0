<script setup lang="ts">
import type { Emotion } from '../../constants/emotions'

import { Screen } from '@proj-airi/ui'
import { ref, watch } from 'vue'

import SpineCanvas from './spine/Canvas.vue'
import SpineModel from './spine/Model.vue'

withDefaults(defineProps<{
  modelSrc?: string
  modelId?: string
  paused?: boolean
  premultipliedAlpha?: boolean
  defaultMixDuration?: number
  idleAnimationEnabled?: boolean
  maxFps?: number
  renderScale?: number
  interactionMode?: 'orbit' | 'tactile'
  xOffset?: number
  yOffset?: number
  scale?: number
}>(), {
  paused: false,
  premultipliedAlpha: false,
  defaultMixDuration: 0.2,
  idleAnimationEnabled: true,
  maxFps: 0,
  renderScale: 1,
  interactionMode: 'orbit',
  xOffset: 0,
  yOffset: 0,
  scale: 1,
})

const componentState = defineModel<'pending' | 'loading' | 'mounted'>('state', { default: 'pending' })
const componentStateCanvas = defineModel<'pending' | 'loading' | 'mounted'>('canvasState', { default: 'pending' })
const componentStateModel = defineModel<'pending' | 'loading' | 'mounted'>('modelState', { default: 'pending' })

const canvasRef = ref<InstanceType<typeof SpineCanvas>>()
const modelRef = ref<InstanceType<typeof SpineModel>>()

const hoverState = ref<{ name: string, x: number, y: number } | null>(null)

function handleHitAreaHover(value: { name: string, x: number, y: number, hovered: boolean } | null) {
  if (value && value.hovered) {
    hoverState.value = value
  }
  else {
    hoverState.value = null
  }
}

watch([componentStateModel, componentStateCanvas], () => {
  componentState.value = (componentStateModel.value === 'mounted' && componentStateCanvas.value === 'mounted')
    ? 'mounted'
    : 'loading'
})

defineExpose({
  canvasElement: () => canvasRef.value?.canvasElement(),
  captureFrame: () => canvasRef.value?.captureFrame(),
  setEmotion: (emotion: Emotion, intensity?: number) => modelRef.value?.setEmotion(emotion, intensity),
  listAnimations: () => modelRef.value?.listAnimations() ?? [],
  listSkins: () => modelRef.value?.listSkins() ?? [],
})
</script>

<template>
  <Screen v-slot="{ width, height }" relative>
    <SpineCanvas
      ref="canvasRef"
      v-slot="{ canvas }"
      v-model:state="componentStateCanvas"
      :width="width"
      :height="height"
      :resolution="renderScale"
      max-h="100dvh"
    >
      <SpineModel
        ref="modelRef"
        v-model:state="componentStateModel"
        :model-src="modelSrc"
        :model-id="modelId"
        :canvas="canvas"
        :width="width"
        :height="height"
        :paused="paused"
        :premultiplied-alpha="premultipliedAlpha"
        :default-mix-duration="defaultMixDuration"
        :idle-animation-enabled="idleAnimationEnabled"
        :max-fps="maxFps"
        :interaction-mode="interactionMode"
        :x-offset="xOffset"
        :y-offset="yOffset"
        :scale="scale"
        @hit-area-hover="handleHitAreaHover"
      />
    </SpineCanvas>

    <!-- SVG Overlay for Hover Effect -->
    <svg
      v-if="hoverState && interactionMode === 'tactile'"
      class="pointer-events-none absolute inset-0"
      :width="width"
      :height="height"
    >
      <defs>
        <radialGradient id="pink-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(249, 168, 212, 0.4)" />
          <stop offset="100%" stop-color="rgba(249, 168, 212, 0)" />
        </radialGradient>
      </defs>
      <circle
        :cx="hoverState.x"
        :cy="hoverState.y"
        r="40"
        fill="url(#pink-glow)"
      />
    </svg>
  </Screen>
</template>
