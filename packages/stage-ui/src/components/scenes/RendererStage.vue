<script setup lang="ts">
import { Live2DScene, useLive2d } from '@proj-airi/stage-ui-live2d'
import { MMDScene } from '@proj-airi/stage-ui-mmd'
import { SpineScene } from '@proj-airi/stage-ui-spine'
import { ThreeScene, useModelStore } from '@proj-airi/stage-ui-three'
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, ref } from 'vue'

import DatingSimOverlay from './DatingSimOverlay.vue'

import { useDatingSimStore } from '../../stores/dating-sim'
import { useAiriCardStore } from '../../stores/modules'
import { useSettings } from '../../stores/settings'
import { useVHackStore } from '../../stores/vhack'

const props = withDefaults(defineProps<{
  paused?: boolean
  focusAt: { x: number, y: number }
  xOffset?: number | string
  yOffset?: number | string
  scale?: number
  mouthOpenSize?: number
  currentAudioSource?: AudioBufferSourceNode
  isWindowResizing?: boolean
  vrmActiveAnimation?: string
  vrmEffectiveIdleCycleEnabled?: boolean
}>(), {
  paused: false,
  scale: 1,
  mouthOpenSize: 0,
  isWindowResizing: false,
  vrmEffectiveIdleCycleEnabled: false,
})

const emits = defineEmits<{
  (e: 'hitAreaHover', value: { name: string, x: number, y: number, hovered: boolean } | null): void
  (e: 'scaleChange', value: number): void
  (e: 'offsetChange', value: { x: number, y: number }): void
  (e: 'animationFinished'): void
  (e: 'animationPlayStatus', status: { duration: number, url: string }): void
}>()

const componentState = defineModel<'pending' | 'loading' | 'mounted'>('state', { default: 'pending' })

const vrmViewerRef = ref<InstanceType<typeof ThreeScene>>()
const live2dSceneRef = ref<InstanceType<typeof Live2DScene>>()
const spineViewerRef = ref<InstanceType<typeof SpineScene>>()

const settingsStore = useSettings()
const vhackStore = useVHackStore()
const { activeCard } = storeToRefs(useAiriCardStore())
const {
  stageModelRenderer,
  stageViewControlsEnabled,
  live2dDisableFocus,
  stageModelSelectedUrl,
  stageModelSelectedFile,
  stageModelSelected,
  themeColorsHue,
  themeColorsHueDynamic,
  live2dIdleAnimationEnabled,
  live2dAutoBlinkEnabled,
  live2dForceAutoBlinkEnabled,
  live2dShadowEnabled,
  live2dMaxFps,
  mmdTextureMap,
  spinePremultipliedAlpha,
  spineDefaultMixDuration,
  spineIdleAnimationEnabled,
  spineMaxFps,
  spineRenderScale,
} = storeToRefs(settingsStore)

const vrmStore = useModelStore()

const reducedRenderScale = computed(() => {
  const nextScale = Math.min(vrmStore.renderScale, 0.75)
  return Math.max(0.5, nextScale)
})

function canvasElement() {
  if (stageModelRenderer.value === 'live2d')
    return live2dSceneRef.value?.canvasElement()
  else if (stageModelRenderer.value === 'vrm')
    return vrmViewerRef.value?.canvasElement()
}

function readRenderTargetRegionAtClientPoint(clientX: number, clientY: number, radius: number) {
  if (stageModelRenderer.value !== 'vrm')
    return null
  return vrmViewerRef.value?.readRenderTargetRegionAtClientPoint?.(clientX, clientY, radius) ?? null
}

async function captureFrame() {
  return (stageModelRenderer.value === 'live2d'
    ? live2dSceneRef.value?.captureFrame()
    : vrmViewerRef.value?.captureFrame())
}

function handleTriggerMotion(e: Event) {
  const detail = (e as CustomEvent).detail
  useLive2d().currentMotion = { group: detail }
}
function handleClearExp() {
  useLive2d().activeExpressions = {}
}
function handleMotionsEnable(e: Event) {
  const detail = (e as CustomEvent).detail
  settingsStore.live2dIdleAnimationEnabled = detail
}
function handleChangeCos(e: Event) {
  const detail = (e as CustomEvent).detail
  settingsStore.stageModelSelectedUrl = detail
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('dating-sim:trigger-motion', handleTriggerMotion)
    window.addEventListener('dating-sim:clear-exp', handleClearExp)
    window.addEventListener('dating-sim:motions-enable', handleMotionsEnable)
    window.addEventListener('dating-sim:change-cos', handleChangeCos)

    if ((window as any).electron) {
      try {
        if (typeof (window as any).electron.ipcRenderer.removeAllListeners === 'function') {
          (window as any).electron.ipcRenderer.removeAllListeners('dating-sim-toggle')
        }
      }
      catch (e) {
        console.warn('Failed to remove listeners', e)
      }

      const removeListener = (window as any).electron.ipcRenderer.on('dating-sim-toggle', () => {
        const ds = useDatingSimStore()
        if (ds.enabled)
          ds.disable()
        else ds.enable()
      })

      onUnmounted(() => {
        if (removeListener)
          removeListener()
      })
    }
  }
})
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('dating-sim:trigger-motion', handleTriggerMotion)
    window.removeEventListener('dating-sim:clear-exp', handleClearExp)
    window.removeEventListener('dating-sim:motions-enable', handleMotionsEnable)
    window.removeEventListener('dating-sim:change-cos', handleChangeCos)

    if ((window as any).electron) {
      (window as any).electron.ipcRenderer.removeAllListeners('dating-sim-toggle')
    }
  }
})

defineExpose({
  canvasElement,
  captureFrame,
  readRenderTargetRegionAtClientPoint,
  vrmViewerRef,
  live2dSceneRef,
  spineViewerRef,
})
</script>

<template>
  <div class="relative h-full w-full">
    <Live2DScene
      v-if="stageModelRenderer === 'live2d'"
      ref="live2dSceneRef"
      v-model:state="componentState"
      :class="['min-w-50% <lg:full min-h-100 sm:100', 'h-full w-full flex-1']"
      :model-src="stageModelSelectedUrl"
      :model-id="stageModelSelected"
      :model-file="stageModelSelectedFile"
      :focus-at="focusAt"
      :mouth-open-size="mouthOpenSize"
      :paused="paused"
      :x-offset="xOffset"
      :y-offset="yOffset"
      :scale="scale"
      :disable-focus-at="live2dDisableFocus"
      :theme-colors-hue="themeColorsHue"
      :theme-colors-hue-dynamic="themeColorsHueDynamic"
      :live2d-idle-animation-enabled="live2dIdleAnimationEnabled"
      :live2d-auto-blink-enabled="live2dAutoBlinkEnabled"
      :live2d-force-auto-blink-enabled="live2dForceAutoBlinkEnabled"
      :live2d-shadow-enabled="live2dShadowEnabled"
      :live2d-max-fps="live2dMaxFps"
      :idle-animations="activeCard?.extensions?.airi?.acting?.idleAnimations"
      :draggable="stageViewControlsEnabled"
      :interaction-mode="vrmStore.interactionMode === 'tactile' ? 'tactile' : 'orbit'"
      @scale-change="(val) => emits('scaleChange', val)"
      @offset-change="(val) => emits('offsetChange', val)"
      @hit-area-hover="(val) => emits('hitAreaHover', val)"
    />
    <ThreeScene
      v-if="stageModelRenderer === 'vrm' && stageModelSelectedUrl"
      v-slot
      ref="vrmViewerRef"
      v-model:state="componentState"
      :mouth-open-size="mouthOpenSize"
      :model-src="stageModelSelectedUrl"
      :model-identity="stageModelSelected"
      :idle-animation="props.vrmActiveAnimation"
      :idle-animations="activeCard?.extensions?.airi?.acting?.idleAnimations"
      :idle-cycle-enabled="props.vrmEffectiveIdleCycleEnabled"
      :render-scale-override="isWindowResizing ? reducedRenderScale : undefined"
      :class="['min-w-50% <lg:full min-h-100 sm:100', 'h-full w-full flex-1']"
      :paused="paused"
      :show-axes="false"
      :current-audio-source="currentAudioSource"
      :scale="scale !== undefined ? Number(scale) : undefined"
      :x-offset="xOffset !== undefined ? Number(xOffset) : undefined"
      :y-offset="yOffset !== undefined ? Number(yOffset) : undefined"
      :draggable="stageViewControlsEnabled"
      @error="console.error"
      @binary-loaded="vhackStore.setSourceArrayBuffer"
      @finished="emits('animationFinished')"
      @play-status="(status) => emits('animationPlayStatus', status)"
      @scale-change="(val) => emits('scaleChange', val)"
      @offset-change="(val) => emits('offsetChange', val)"
    />
    <SpineScene
      v-if="stageModelRenderer === 'spine'"
      ref="spineViewerRef"
      v-model:state="componentState"
      :model-src="stageModelSelectedUrl"
      :model-id="stageModelSelected"
      :class="['min-w-50% <lg:full min-h-100 sm:100', 'h-full w-full flex-1']"
      :paused="paused"
      :interaction-mode="vrmStore.interactionMode === 'tactile' ? 'tactile' : 'orbit'"
      :x-offset="xOffset !== undefined ? Number(xOffset) : undefined"
      :y-offset="yOffset !== undefined ? Number(yOffset) : undefined"
      :scale="scale !== undefined ? Number(scale) : undefined"
      :premultiplied-alpha="spinePremultipliedAlpha"
      :default-mix-duration="spineDefaultMixDuration"
      :idle-animation-enabled="spineIdleAnimationEnabled"
      :max-fps="spineMaxFps"
      :render-scale="spineRenderScale"
      :draggable="stageViewControlsEnabled"
      :idle-animations="activeCard?.extensions?.airi?.acting?.idleAnimations"
      :mouth-open-size="mouthOpenSize"
      @scale-change="(val) => emits('scaleChange', val)"
      @offset-change="(val) => emits('offsetChange', val)"
      @hit-area-hover="(val) => emits('hitAreaHover', val)"
    />
    <MMDScene
      v-if="stageModelRenderer === 'mmd' && stageModelSelectedUrl"
      v-slot
      v-model:state="componentState"
      :class="['min-w-50% <lg:full min-h-100 sm:100', 'h-full w-full flex-1']"
      :model-src="stageModelSelectedUrl"
      :paused="paused"
      :mouth-open-size="mouthOpenSize"
      :texture-map="mmdTextureMap"
      :scale="scale !== undefined ? Number(scale) : undefined"
      :position-x="xOffset !== undefined ? Number(xOffset) : undefined"
      :position-y="yOffset !== undefined ? Number(yOffset) : undefined"
      :idle-animations="activeCard?.extensions?.airi?.acting?.idleAnimations"
      :draggable="stageViewControlsEnabled"
      @error="console.error"
      @scale-change="(val) => emits('scaleChange', val)"
      @offset-change="(val) => emits('offsetChange', val)"
    />
    <DatingSimOverlay />
  </div>
</template>
