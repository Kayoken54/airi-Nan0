<script setup lang="ts">
import type { OnboardingStepNextHandler, OnboardingStepPrevHandler } from './types'

import { Button } from '@proj-airi/ui'
import { onMounted, onUnmounted, ref } from 'vue'

interface Props {
  onNext: OnboardingStepNextHandler
  onPrevious: OnboardingStepPrevHandler
}

const props = defineProps<Props>()

const progress = ref(0)
const logs = ref<string[]>([])
const syncComplete = ref(false)

const logPool = [
  'Connecting to storage provider...',
  'Fetching latest snapshot metadata...',
  'Downloading message logs and SQL tables...',
  'Applying migrations to DuckDB instance...',
  'Verifying schema consistency and integrity...',
  'Retrieving character cards & seed configurations...',
  'Downloading compressed Live2D & Spine animation files...',
  'Decompressing assets and storing to local IndexedDB caching...',
  'Synchronizing vector embedding database...',
  'Re-indexing local search indices...',
  'Backup restoration completed successfully!',
]

let intervalId: any

onMounted(() => {
  logs.value.push(logPool[0])

  intervalId = setInterval(() => {
    if (progress.value < 100) {
      progress.value += Math.floor(Math.random() * 8) + 4
      if (progress.value > 100)
        progress.value = 100

      // Add logs at different milestones
      const poolIndex = Math.floor((progress.value / 100) * logPool.length)
      if (poolIndex < logPool.length && !logs.value.includes(logPool[poolIndex])) {
        logs.value.push(logPool[poolIndex])
      }
    }
    else {
      clearInterval(intervalId)
      syncComplete.value = true
    }
  }, 350)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})

function handleFinish() {
  props.onNext()
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
      <div class="flex-1 text-center text-xl text-neutral-800 font-semibold md:text-left md:text-2xl dark:text-neutral-100">
        Restoring Data
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex flex-1 flex-col justify-center gap-6 overflow-y-auto px-1">
      <!-- Progress Ring/Bar -->
      <div class="flex flex-col items-center gap-4 text-center">
        <div class="relative h-3 w-full overflow-hidden border border-neutral-200/40 rounded-full bg-neutral-100 dark:border-neutral-800/40 dark:bg-neutral-900">
          <div
            class="h-full rounded-full from-primary-500 via-indigo-500 to-purple-500 bg-gradient-to-r transition-all duration-300 ease-out"
            :style="{ width: `${progress}%` }"
          />
        </div>
        <div class="w-full flex justify-between text-xs text-neutral-500 font-mono">
          <span>{{ syncComplete ? 'Restoration complete' : 'Syncing databases & assets...' }}</span>
          <span>{{ progress }}%</span>
        </div>
      </div>

      <!-- Simulated Logs -->
      <div class="max-h-[180px] flex flex-1 flex-col gap-1.5 overflow-y-auto border border-neutral-200/50 rounded-xl bg-black/5 p-4 text-xs text-neutral-600 font-mono scrollbar-none dark:border-neutral-800/50 dark:bg-black/35 dark:text-neutral-400">
        <div v-for="(log, idx) in logs" :key="idx" class="flex gap-2">
          <span class="text-neutral-400 dark:text-neutral-600">[{{ 100 + idx }}]</span>
          <span :class="{ 'text-primary-500 dark:text-primary-400 font-bold': idx === logs.length - 1 && !syncComplete, 'text-emerald-500 font-bold': idx === logs.length - 1 && syncComplete }">
            {{ log }}
          </span>
        </div>
      </div>
    </div>

    <!-- Footer Action -->
    <Button
      v-motion
      :initial="{ opacity: 0, y: 10 }"
      :enter="{ opacity: 1, y: 0 }"
      :duration="400"
      :delay="300"
      :disabled="!syncComplete"
      label="Complete Onboarding & Reload"
      @click="handleFinish"
    />
  </div>
</template>
