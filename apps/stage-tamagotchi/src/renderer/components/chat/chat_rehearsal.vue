<script setup lang="ts">
import { ModelCustomizer } from '@proj-airi/stage-ui/components/scenarios/settings/model-settings'
import { DisplayModelFormat, useDisplayModelsStore } from '@proj-airi/stage-ui/stores/display-models'
import { useSettingsControlStrip } from '@proj-airi/stage-ui/stores/settings/control-strip'
import { useSettingsStageModel } from '@proj-airi/stage-ui/stores/settings/stage-model'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'

const stageModelStore = useSettingsStageModel()
const controlStripStore = useSettingsControlStrip()
const displayModelsStore = useDisplayModelsStore()

const { stageModelSelected } = storeToRefs(stageModelStore)
const { stageEnabled } = storeToRefs(controlStripStore)

// Local selection — defaults to whatever is on stage, but user can browse others
const selectedModelId = ref(stageModelSelected.value || '')

// Keep in sync if the stage model changes externally
watch(stageModelSelected, (id) => {
  if (id && !selectedModelId.value)
    selectedModelId.value = id
}, { immediate: true })

const selectedModel = computed(() =>
  displayModelsStore.displayModels.find(m => m.id === selectedModelId.value),
)

function formatLabel(fmt: DisplayModelFormat) {
  if (fmt === DisplayModelFormat.Live2dZip || fmt === DisplayModelFormat.Live2dDirectory)
    return 'L2D'
  if (fmt === DisplayModelFormat.VRM)
    return 'VRM'
  if (fmt === DisplayModelFormat.PMXZip || fmt === DisplayModelFormat.PMXDirectory || fmt === DisplayModelFormat.PMD)
    return 'MMD'
  if (fmt === DisplayModelFormat.SpineZip)
    return 'SPN'
  return '?'
}

function fmtColor(fmt: DisplayModelFormat) {
  if (fmt === DisplayModelFormat.Live2dZip || fmt === DisplayModelFormat.Live2dDirectory)
    return 'bg-pink-500/80'
  if (fmt === DisplayModelFormat.VRM)
    return 'bg-violet-500/80'
  if (fmt === DisplayModelFormat.PMXZip || fmt === DisplayModelFormat.PMXDirectory || fmt === DisplayModelFormat.PMD)
    return 'bg-cyan-500/80'
  if (fmt === DisplayModelFormat.SpineZip)
    return 'bg-amber-500/80'
  return 'bg-neutral-500/80'
}
</script>

<template>
  <div class="h-full w-full flex flex-col overflow-hidden bg-white dark:bg-neutral-900/10">
    <!-- Header -->
    <div class="shrink-0 px-4 pb-2 pt-4">
      <h3 class="text-sm text-neutral-800 font-bold dark:text-neutral-200">
        Rehearsal Room
      </h3>
      <p class="mt-0.5 text-[10px] text-neutral-500">
        Select a model then map emotion &amp; motion keys in real time.
      </p>
    </div>

    <!-- Warning Status Guard -->
    <div
      v-if="!stageEnabled"
      class="mx-4 mb-2 border border-amber-200/50 rounded-xl bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:border-amber-900/50 dark:text-amber-400"
    >
      <div class="flex items-center gap-1 font-semibold">
        <div class="i-solar:shield-warning-bold-duotone text-sm" />
        Stage Window Offline
      </div>
      <p class="mt-0.5 text-[10px] leading-relaxed opacity-80">
        Open the Stage window to preview expressions live.
      </p>
    </div>

    <!-- Model Selector Grid (5 columns) -->
    <div class="shrink-0 px-4 pb-2">
      <div v-if="displayModelsStore.displayModels.length === 0" class="py-2 text-center text-[10px] text-neutral-400 italic">
        No models imported yet.
      </div>
      <div v-else class="grid grid-cols-5 gap-1.5">
        <button
          v-for="model in displayModelsStore.displayModels"
          :key="model.id"
          class="group relative h-16 w-full flex flex-col justify-end overflow-hidden border rounded-xl transition-all duration-200"
          :class="selectedModelId === model.id
            ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-md shadow-primary-500/10'
            : 'border-neutral-200 dark:border-neutral-800 opacity-60 hover:opacity-90 hover:border-neutral-300 dark:hover:border-neutral-700'"
          @click="selectedModelId = model.id"
        >
          <!-- Preview Image -->
          <div class="absolute inset-0 bg-neutral-100 dark:bg-neutral-900">
            <img
              v-if="model.previewImage"
              :src="model.previewImage"
              class="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
            >
            <div v-else class="h-full w-full flex items-center justify-center text-neutral-400 dark:text-neutral-600">
              <div class="i-solar:box-minimalistic-bold-duotone text-xl" />
            </div>
          </div>

          <!-- Gradient overlay -->
          <div class="absolute inset-0 from-black/80 via-black/20 to-transparent bg-gradient-to-t" />

          <!-- Active pulse dot -->
          <div
            v-if="model.id === stageModelSelected"
            class="absolute right-1.5 top-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-primary-400 ring-2 ring-primary-500/40"
          />

          <!-- Format badge -->
          <div
            class="absolute left-1.5 top-1.5 rounded px-1 py-0.5 text-[8px] text-white font-bold leading-none tracking-wider"
            :class="fmtColor(model.format)"
          >
            {{ formatLabel(model.format) }}
          </div>

          <!-- Name -->
          <div class="relative z-10 px-1.5 pb-1.5">
            <span class="line-clamp-1 block text-[9px] text-white font-bold leading-tight drop-shadow">
              {{ model.name }}
            </span>
          </div>
        </button>
      </div>
    </div>

    <!-- Divider -->
    <div class="mx-4 mb-2 border-t border-neutral-100 dark:border-neutral-800/60" />

    <!-- ModelCustomizer or empty state -->
    <div v-if="!selectedModelId || !selectedModel" class="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <div class="i-solar:box-minimalistic-bold-duotone mb-2 text-4xl text-neutral-300 dark:text-neutral-700" />
      <h4 class="text-sm text-neutral-700 font-semibold dark:text-neutral-300">
        No Model Selected
      </h4>
      <p class="mt-1 max-w-xs text-xs text-neutral-500">
        Select a model above to begin editing its emotion &amp; motion keys.
      </p>
    </div>

    <div v-else class="flex flex-1 flex-col overflow-hidden px-4 pb-4">
      <ModelCustomizer
        :key="selectedModelId"
        :model-id="selectedModelId"
        :show-rehearsal-sandbox="true"
      />
    </div>
  </div>
</template>
