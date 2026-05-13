<script setup lang="ts">
import { Screen } from '@proj-airi/ui'
import { TresCanvas } from '@tresjs/core'
import { ACESFilmicToneMapping, PerspectiveCamera } from 'three'
import { shallowRef } from 'vue'

import MMDModel from './mmd/Model.vue'

const props = withDefaults(defineProps<{
  modelSrc?: string
  paused?: boolean
  currentAudioSource?: AudioBufferSourceNode
  textureMap?: Map<string, string>
}>(), {
  paused: false,
})

const emit = defineEmits<{
  (e: 'error', value: unknown): void
}>()

const componentState = defineModel<'pending' | 'loading' | 'mounted'>('state', { default: 'pending' })

const camera = shallowRef(new PerspectiveCamera())

function onTresReady() {
  componentState.value = 'mounted'
}

function onSceneBootstrap(data: any) {
  if (camera.value) {
    camera.value.position.set(data.cameraPosition.x, data.cameraPosition.y, data.cameraPosition.z)
    camera.value.lookAt(data.lookAtTarget.x, data.lookAtTarget.y, data.lookAtTarget.z)
  }
}
</script>

<template>
  <Screen v-slot="{ width, height }" relative>
    <div class="h-full w-full">
      <TresCanvas
        :camera="(camera as any)"
        :alpha="true"
        :antialias="true"
        :width="width"
        :height="height"
        :tone-mapping="ACESFilmicToneMapping"
        :tone-mapping-exposure="1"
        :clear-alpha="0"
        power-preference="high-performance"
        @ready="onTresReady"
      >
        <TresAmbientLight :intensity="1.0" />
        <TresDirectionalLight :position="[0, 10, 10]" :intensity="1.5" />

        <MMDModel
          :model-src="modelSrc"
          :paused="paused"
          :current-audio-source="currentAudioSource"
          :texture-map="textureMap"
          :model-offset="{ x: 0, y: 0, z: 0 }"
          :model-rotation-y="0"
          :look-at-target="{ x: 0, y: 0, z: -100 }"
          tracking-mode="orbit"
          :eye-height="1.5"
          :camera-position="{ x: 0, y: 1.5, z: 5 }"
          :camera="camera"
          @scene-bootstrap="onSceneBootstrap"
          @error="(err) => emit('error', err)"
        />
      </TresCanvas>
    </div>
  </Screen>
</template>
