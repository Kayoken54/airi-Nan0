<script setup lang="ts">
import type { OnboardingStepNextHandler, OnboardingStepPrevHandler } from './types'

import { Button } from '@proj-airi/ui'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  onNext: OnboardingStepNextHandler
  onPrevious: OnboardingStepPrevHandler
  onSelectPath?: (path: 'new' | 'returning') => void
}

const props = defineProps<Props>()
const { t } = useI18n()
const selectedPath = ref<'new' | 'returning'>('new')

function handleNext() {
  if (props.onSelectPath) {
    props.onSelectPath(selectedPath.value)
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
        Get Started
      </h2>
      <div class="h-5 w-5" />
    </div>

    <!-- Choice Selection Cards -->
    <div class="flex flex-1 flex-col justify-center overflow-y-auto px-1">
      <div
        v-motion
        :initial="{ opacity: 0, y: 10 }"
        :enter="{ opacity: 1, y: 0 }"
        :duration="500"
        :delay="100"
        class="grid grid-cols-1 gap-6 sm:grid-cols-2"
      >
        <!-- New User Option -->
        <div
          class="relative min-h-[160px] flex flex-col cursor-pointer justify-between overflow-hidden border-2 rounded-2xl p-6 transition-all duration-300 ease-out"
          :class="[
            selectedPath === 'new'
              ? 'bg-gradient-to-br from-primary-500/10 to-indigo-500/10 border-primary-500 dark:border-primary-400 shadow-lg shadow-primary-500/5'
              : 'bg-white/40 dark:bg-neutral-900/40 border-neutral-200/60 dark:border-neutral-800/80 hover:border-primary-500/50 dark:hover:border-primary-400/50 backdrop-blur-md',
          ]"
          @click="selectedPath = 'new'"
        >
          <div>
            <div class="mb-4 flex items-center justify-between">
              <div
                class="rounded-xl p-3"
                :class="[
                  selectedPath === 'new'
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300',
                ]"
              >
                <div class="i-solar:stars-line-duotone h-6 w-6" />
              </div>
              <div
                class="h-5 w-5 flex items-center justify-center border-2 rounded-full transition-colors"
                :class="selectedPath === 'new' ? 'border-primary-500 dark:border-primary-400' : 'border-neutral-300 dark:border-neutral-600'"
              >
                <div v-if="selectedPath === 'new'" class="h-2.5 w-2.5 rounded-full bg-primary-500 dark:bg-primary-400" />
              </div>
            </div>
            <h3 class="text-lg text-neutral-800 font-bold dark:text-neutral-100">
              Set Up as New User
            </h3>
            <p class="mt-2 text-xs text-neutral-500 leading-relaxed dark:text-neutral-400">
              Start fresh with a clean slate. Configure model keys and choose or customize a default character to begin chatting.
            </p>
          </div>
        </div>

        <!-- Returning User Option -->
        <div
          class="relative min-h-[160px] flex flex-col cursor-pointer justify-between overflow-hidden border-2 rounded-2xl p-6 transition-all duration-300 ease-out"
          :class="[
            selectedPath === 'returning'
              ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500 dark:border-purple-400 shadow-lg shadow-purple-500/5'
              : 'bg-white/40 dark:bg-neutral-900/40 border-neutral-200/60 dark:border-neutral-800/80 hover:border-purple-500/50 dark:hover:border-purple-400/50 backdrop-blur-md',
          ]"
          @click="selectedPath = 'returning'"
        >
          <div>
            <div class="mb-4 flex items-center justify-between">
              <div
                class="rounded-xl p-3"
                :class="[
                  selectedPath === 'returning'
                    ? 'bg-purple-500 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300',
                ]"
              >
                <div class="i-solar:cloud-storage-line-duotone h-6 w-6" />
              </div>
              <div
                class="h-5 w-5 flex items-center justify-center border-2 rounded-full transition-colors"
                :class="selectedPath === 'returning' ? 'border-purple-500 dark:border-purple-400' : 'border-neutral-300 dark:border-neutral-600'"
              >
                <div v-if="selectedPath === 'returning'" class="h-2.5 w-2.5 rounded-full bg-purple-500 dark:bg-purple-400" />
              </div>
            </div>
            <h3 class="text-lg text-neutral-800 font-bold dark:text-neutral-100">
              Returning User
            </h3>
            <p class="mt-2 text-xs text-neutral-500 leading-relaxed dark:text-neutral-400">
              Restore your databases, settings, and media assets using your existing Google account or S3 storage provider.
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
