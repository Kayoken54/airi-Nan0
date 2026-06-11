<script setup lang="ts">
import type { OnboardingStepNextHandler, OnboardingStepPrevHandler } from './types'

import { Button } from '@proj-airi/ui'
import { ref } from 'vue'

import SelectiveSyncPanel from '../../providers/selective-sync-panel.vue'

interface Props {
  onNext: OnboardingStepNextHandler
  onPrevious: OnboardingStepPrevHandler
  isGoogleAuthenticated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isGoogleAuthenticated: false,
})

const panelRef = ref<InstanceType<typeof SelectiveSyncPanel> | null>(null)
const saveToGoogle = ref(true)

function handleNext() {
  const selectedCheckedIds = panelRef.value ? panelRef.value.getSelectedCheckedIds() : []

  props.onNext({
    checkedIds: selectedCheckedIds,
    saveToGoogle: !props.isGoogleAuthenticated && saveToGoogle.value,
  })
}
</script>

<template>
  <div class="h-full flex flex-col gap-6 font-sans">
    <!-- Header -->
    <div
      v-motion
      :initial="{ opacity: 0, y: -10 }"
      :enter="{ opacity: 1, y: 0 }"
      :duration="400"
      class="flex items-center gap-2"
    >
      <button class="outline-none" @click="props.onPrevious">
        <div class="i-solar:alt-arrow-left-line-duotone h-5 w-5 transition-colors hover:text-primary-500" />
      </button>
      <h2 class="flex-1 text-center text-xl text-neutral-800 font-semibold md:text-left md:text-2xl dark:text-neutral-100">
        Selective Sync
      </h2>
      <div class="h-5 w-5" />
    </div>

    <!-- Reusable Selective Sync Panel -->
    <div class="min-h-[200px] flex-1 overflow-y-auto">
      <SelectiveSyncPanel
        ref="panelRef"
        :show-actions="false"
      />
    </div>

    <!-- Link settings to google drive prompt -->
    <div
      v-if="!props.isGoogleAuthenticated"
      v-motion
      :initial="{ opacity: 0, y: 5 }"
      :enter="{ opacity: 1, y: 0 }"
      class="flex items-start gap-3 border border-neutral-200 rounded-xl border-dashed bg-neutral-50/50 p-4 text-left dark:border-neutral-800 dark:bg-neutral-900/30"
    >
      <input
        id="save-to-google-drive"
        v-model="saveToGoogle"
        type="checkbox"
        class="mt-1 cursor-pointer border-neutral-300 rounded text-primary-500 focus:ring-primary-500"
      >
      <label for="save-to-google-drive" class="flex-1 cursor-pointer select-none">
        <span class="block text-xs text-neutral-800 font-bold dark:text-neutral-100">Link connection details to Google Drive</span>
        <span class="mt-0.5 block text-[11px] text-neutral-500 leading-relaxed dark:text-neutral-400">
          Saves your storage credentials securely to your Google AppData folder. Next time you restore from a new device, your connection profile will be auto-detected.
        </span>
      </label>
    </div>

    <!-- Footer Action -->
    <Button
      v-motion
      :initial="{ opacity: 0, y: 10 }"
      :enter="{ opacity: 1, y: 0 }"
      :duration="400"
      :delay="300"
      label="Restore Selected Items"
      @click="handleNext"
    />
  </div>
</template>
