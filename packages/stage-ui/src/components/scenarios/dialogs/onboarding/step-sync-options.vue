<script setup lang="ts">
import type { OnboardingStepNextHandler, OnboardingStepPrevHandler } from './types'

import { Button } from '@proj-airi/ui'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  onNext: OnboardingStepNextHandler
  onPrevious: OnboardingStepPrevHandler
  onSelectMethod?: (method: 'google' | 'manual') => void
}

const props = defineProps<Props>()
const { t } = useI18n()
const selectedMethod = ref<'google' | 'manual'>('google')

function handleNext() {
  if (props.onSelectMethod) {
    props.onSelectMethod(selectedMethod.value)
  }
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
      <button class="outline-none" @click="props.onPrevious">
        <div class="i-solar:alt-arrow-left-line-duotone h-5 w-5 transition-colors hover:text-primary-500" />
      </button>
      <h2 class="flex-1 text-center text-xl text-neutral-800 font-semibold md:text-left md:text-2xl dark:text-neutral-100">
        Choose Backup Provider
      </h2>
      <div class="h-5 w-5" />
    </div>

    <!-- Options Selection Cards -->
    <div class="flex flex-1 flex-col justify-center overflow-y-auto px-1">
      <div
        v-motion
        :initial="{ opacity: 0, y: 10 }"
        :enter="{ opacity: 1, y: 0 }"
        :duration="500"
        :delay="100"
        class="grid grid-cols-1 gap-6 sm:grid-cols-2"
      >
        <!-- Google Sign-In Option -->
        <div
          class="relative min-h-[160px] flex flex-col cursor-pointer justify-between overflow-hidden border-2 rounded-2xl p-6 transition-all duration-300 ease-out"
          :class="[
            selectedMethod === 'google'
              ? 'bg-gradient-to-br from-blue-500/10 to-emerald-500/10 border-blue-500 dark:border-blue-400 shadow-lg shadow-blue-500/5'
              : 'bg-white/40 dark:bg-neutral-900/40 border-neutral-200/60 dark:border-neutral-800/80 hover:border-blue-500/50 dark:hover:border-blue-400/50 backdrop-blur-md',
          ]"
          @click="selectedMethod = 'google'"
        >
          <div>
            <div class="mb-4 flex items-center justify-between">
              <div
                class="rounded-xl p-3"
                :class="[
                  selectedMethod === 'google'
                    ? 'bg-blue-500 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300',
                ]"
              >
                <div class="i-solar:letter-bold-duotone h-6 w-6" />
              </div>
              <div
                class="h-5 w-5 flex items-center justify-center border-2 rounded-full transition-colors"
                :class="selectedMethod === 'google' ? 'border-blue-500 dark:border-blue-400' : 'border-neutral-300 dark:border-neutral-600'"
              >
                <div v-if="selectedMethod === 'google'" class="h-2.5 w-2.5 rounded-full bg-blue-500 dark:bg-blue-400" />
              </div>
            </div>
            <h3 class="text-lg text-neutral-800 font-bold dark:text-neutral-100">
              Sign In with Google
            </h3>
            <p class="mt-2 text-xs text-neutral-500 leading-relaxed dark:text-neutral-400">
              Link your Google Account securely to search for existing cloud backups in Google Drive or compatible object store integrations.
            </p>
          </div>
        </div>

        <!-- Manual S3/FS Config Option -->
        <div
          class="relative min-h-[160px] flex flex-col cursor-pointer justify-between overflow-hidden border-2 rounded-2xl p-6 transition-all duration-300 ease-out"
          :class="[
            selectedMethod === 'manual'
              ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500 dark:border-amber-400 shadow-lg shadow-amber-500/5'
              : 'bg-white/40 dark:bg-neutral-900/40 border-neutral-200/60 dark:border-neutral-800/80 hover:border-amber-500/50 dark:hover:border-amber-400/50 backdrop-blur-md',
          ]"
          @click="selectedMethod = 'manual'"
        >
          <div>
            <div class="mb-4 flex items-center justify-between">
              <div
                class="rounded-xl p-3"
                :class="[
                  selectedMethod === 'manual'
                    ? 'bg-amber-500 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300',
                ]"
              >
                <div class="i-solar:database-bold-duotone h-6 w-6" />
              </div>
              <div
                class="h-5 w-5 flex items-center justify-center border-2 rounded-full transition-colors"
                :class="selectedMethod === 'manual' ? 'border-amber-500 dark:border-amber-400' : 'border-neutral-300 dark:border-neutral-600'"
              >
                <div v-if="selectedMethod === 'manual'" class="h-2.5 w-2.5 rounded-full bg-amber-500 dark:bg-amber-400" />
              </div>
            </div>
            <h3 class="text-lg text-neutral-800 font-bold dark:text-neutral-100">
              Manual Configuration
            </h3>
            <p class="mt-2 text-xs text-neutral-500 leading-relaxed dark:text-neutral-400">
              Manually connect your custom S3-compatible cloud storage (AWS, Cloudflare R2, MinIO) or target local file systems.
            </p>
          </div>
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
      :label="t('settings.dialogs.onboarding.next')"
      @click="handleNext"
    />
  </div>
</template>
