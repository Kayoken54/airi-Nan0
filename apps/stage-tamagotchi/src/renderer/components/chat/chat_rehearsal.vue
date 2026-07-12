<script setup lang="ts">
import ModelCustomizer from '@proj-airi/stage-ui/src/components/scenarios/settings/model-settings/ModelCustomizer.vue'

// Model-specific Stores
import { DisplayModelFormat, useDisplayModelsStore } from '@proj-airi/stage-ui/stores/display-models'
// AIRI Stores
import { useAiriCardStore } from '@proj-airi/stage-ui/stores/modules/airi-card'
import { useSettingsControlStrip } from '@proj-airi/stage-ui/stores/settings/control-strip'
import { useSettingsStageModel } from '@proj-airi/stage-ui/stores/settings/stage-model'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

// Setup Stores
const airiCardStore = useAiriCardStore()
const stageModelStore = useSettingsStageModel()
const controlStripStore = useSettingsControlStrip()
const displayModelsStore = useDisplayModelsStore()

const { activeCard } = storeToRefs(airiCardStore)
const { stageModelSelected } = storeToRefs(stageModelStore)
const { stageEnabled } = storeToRefs(controlStripStore)

// Resolve Model Format
const currentModel = computed(() => {
  return displayModelsStore.displayModels.find(m => m.id === stageModelSelected.value)
})

const modelType = computed<'live2d' | 'vrm' | 'mmd' | 'spine' | 'unknown'>(() => {
  if (!currentModel.value)
    return 'unknown'
  const fmt = currentModel.value.format
  if (fmt === DisplayModelFormat.Live2dZip || fmt === DisplayModelFormat.Live2dDirectory)
    return 'live2d'
  if (fmt === DisplayModelFormat.VRM)
    return 'vrm'
  if (fmt === DisplayModelFormat.PMXZip || fmt === DisplayModelFormat.PMXDirectory || fmt === DisplayModelFormat.PMD)
    return 'mmd'
  if (fmt === DisplayModelFormat.SpineZip)
    return 'spine'
  return 'unknown'
})
</script>

<template>
  <div class="h-full w-full flex flex-col overflow-hidden bg-white dark:bg-neutral-900/10">
    <!-- Header -->
    <div class="shrink-0 p-4 pb-2">
      <h3 class="text-sm text-neutral-800 font-bold dark:text-neutral-200">
        Rehearsal Room (Debugger)
      </h3>
      <p class="mt-0.5 text-[10px] text-neutral-500">
        Debug acting tags and map emotion keys to display labels in real time.
      </p>
    </div>

    <!-- Warning Status Guard -->
    <div v-if="!stageEnabled" class="mx-4 mb-3 border border-amber-200/50 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-700 dark:border-amber-900/50 dark:text-amber-400">
      <div class="flex items-center gap-1 font-semibold">
        <div class="i-solar:shield-warning-bold-duotone text-base" />
        Stage Window Offline
      </div>
      <p class="mt-1 text-[11px] leading-relaxed">
        The Stage window must be open to preview expressions and orchestrate rehearsals. Toggle Stage on in the Control Strip.
      </p>
    </div>

    <!-- Empty State Fallback -->
    <div v-if="modelType === 'unknown'" class="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <div class="i-solar:box-minimalistic-bold-duotone mb-2 text-4xl text-neutral-300 dark:text-neutral-700" />
      <h4 class="text-sm text-neutral-700 font-semibold dark:text-neutral-300">
        No Creative Controls Available
      </h4>
      <p class="mt-1 max-w-xs text-xs text-neutral-500">
        This character model does not contain any expressions or motions. Select a model that supports metadata.
      </p>

      <!-- Inline Model Selector -->
      <div class="mt-4 max-w-xs w-full">
        <select
          v-model="stageModelSelected"
          class="w-full border-2 border-neutral-100 rounded-lg bg-neutral-50 p-2 text-xs dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 focus:outline-none"
        >
          <option v-for="m in displayModelsStore.displayModels" :key="m.id" :value="m.id">
            {{ m.name }} ({{ m.format }})
          </option>
        </select>
      </div>
    </div>

    <template v-else>
      <div class="flex flex-1 flex-col overflow-hidden px-4 pb-4">
        <ModelCustomizer :model-id="stageModelSelected" :show-rehearsal-sandbox="true" />
      </div>
    </template>
  </div>
</template>
