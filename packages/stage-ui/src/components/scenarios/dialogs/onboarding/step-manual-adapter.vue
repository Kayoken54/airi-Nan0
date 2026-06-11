<script setup lang="ts">
import type { OnboardingStepNextHandler, OnboardingStepPrevHandler } from './types'

import { Button } from '@proj-airi/ui'
import { ref } from 'vue'

interface Props {
  onNext: OnboardingStepNextHandler
  onPrevious: OnboardingStepPrevHandler
}

const props = defineProps<Props>()

const adapterType = ref<'s3' | 'local'>('s3')

// S3 config
const endpoint = ref('')
const bucket = ref('')
const region = ref('us-east-1')
const accessKey = ref('')
const secretKey = ref('')

// Local path
const localPath = ref('/Users/richardpinedo/airi-backups')

function handleNext() {
  props.onNext({
    adapterType: adapterType.value,
    s3: {
      endpoint: endpoint.value,
      bucket: bucket.value,
      region: region.value,
      accessKey: accessKey.value,
      secretKey: secretKey.value,
    },
    local: {
      path: localPath.value,
    },
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
        Storage Adapter
      </h2>
      <div class="h-5 w-5" />
    </div>

    <!-- Main Form Scroll Area -->
    <div class="flex flex-1 flex-col gap-4 overflow-y-auto px-1">
      <!-- Selector Tabs -->
      <div class="flex rounded-xl bg-neutral-100 p-1 dark:bg-neutral-900">
        <button
          class="flex-1 rounded-lg py-2 text-xs font-semibold transition-all"
          :class="adapterType === 's3' ? 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'"
          @click="adapterType = 's3'"
        >
          S3 Compatible
        </button>
        <button
          class="flex-1 rounded-lg py-2 text-xs font-semibold transition-all"
          :class="adapterType === 'local' ? 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'"
          @click="adapterType = 'local'"
        >
          Local File System
        </button>
      </div>

      <!-- S3 Fields -->
      <div v-if="adapterType === 's3'" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs text-neutral-600 font-semibold dark:text-neutral-400">Endpoint URL</label>
          <input
            v-model="endpoint"
            type="text"
            placeholder="https://s3.amazonaws.com or R2 Endpoint"
            class="w-full border border-neutral-200/60 rounded-xl bg-white/40 px-3 py-2 text-sm text-neutral-800 outline-none backdrop-blur-sm transition-colors dark:border-neutral-800/80 focus:border-primary-500 dark:bg-neutral-900/40 dark:text-neutral-100"
          >
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-neutral-600 font-semibold dark:text-neutral-400">Bucket Name</label>
            <input
              v-model="bucket"
              type="text"
              placeholder="my-bucket"
              class="w-full border border-neutral-200/60 rounded-xl bg-white/40 px-3 py-2 text-sm text-neutral-800 outline-none backdrop-blur-sm transition-colors dark:border-neutral-800/80 focus:border-primary-500 dark:bg-neutral-900/40 dark:text-neutral-100"
            >
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-neutral-600 font-semibold dark:text-neutral-400">Region</label>
            <input
              v-model="region"
              type="text"
              placeholder="us-east-1"
              class="w-full border border-neutral-200/60 rounded-xl bg-white/40 px-3 py-2 text-sm text-neutral-800 outline-none backdrop-blur-sm transition-colors dark:border-neutral-800/80 focus:border-primary-500 dark:bg-neutral-900/40 dark:text-neutral-100"
            >
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs text-neutral-600 font-semibold dark:text-neutral-400">Access Key ID</label>
          <input
            v-model="accessKey"
            type="text"
            placeholder="AKIAIOSFODNN7EXAMPLE"
            class="w-full border border-neutral-200/60 rounded-xl bg-white/40 px-3 py-2 text-sm text-neutral-800 outline-none backdrop-blur-sm transition-colors dark:border-neutral-800/80 focus:border-primary-500 dark:bg-neutral-900/40 dark:text-neutral-100"
          >
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-xs text-neutral-600 font-semibold dark:text-neutral-400">Secret Access Key</label>
          <input
            v-model="secretKey"
            type="password"
            placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
            class="w-full border border-neutral-200/60 rounded-xl bg-white/40 px-3 py-2 text-sm text-neutral-800 outline-none backdrop-blur-sm transition-colors dark:border-neutral-800/80 focus:border-primary-500 dark:bg-neutral-900/40 dark:text-neutral-100"
          >
        </div>
      </div>

      <!-- Local File System Fields -->
      <div v-else class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs text-neutral-600 font-semibold dark:text-neutral-400">Local Directory Path</label>
          <input
            v-model="localPath"
            type="text"
            placeholder="/path/to/airi-backups"
            class="w-full border border-neutral-200/60 rounded-xl bg-white/40 px-3 py-2 text-sm text-neutral-800 outline-none backdrop-blur-sm transition-colors dark:border-neutral-800/80 focus:border-primary-500 dark:bg-neutral-900/40 dark:text-neutral-100"
          >
          <p class="text-[10px] text-neutral-500">
            Ensure the directory is write-accessible by the browser/application stage sandbox.
          </p>
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
      label="Next: Selective Sync"
      @click="handleNext"
    />
  </div>
</template>
