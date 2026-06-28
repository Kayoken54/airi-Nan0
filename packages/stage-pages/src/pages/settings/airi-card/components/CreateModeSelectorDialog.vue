<script setup lang="ts">
import { Button } from '@proj-airi/ui'
import {
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
} from 'reka-ui'

interface Props {
  modelValue: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'guided'): void
  (e: 'advanced'): void
}>()

function selectGuided() {
  emit('update:modelValue', false)
  emit('guided')
}

function selectAdvanced() {
  emit('update:modelValue', false)
  emit('advanced')
}
</script>

<template>
  <AlertDialogRoot :open="modelValue" @update:open="emit('update:modelValue', $event)">
    <AlertDialogPortal>
      <AlertDialogOverlay class="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm data-[state=closed]:animate-fadeOut data-[state=open]:animate-fadeIn" />
      <AlertDialogContent
        class="fixed left-1/2 top-1/2 z-100 max-w-xl w-[90%] border border-neutral-200/80 rounded-2xl bg-white/95 p-6 shadow-2xl -translate-x-1/2 -translate-y-1/2 data-[state=closed]:animate-contentHide data-[state=open]:animate-contentShow dark:border-neutral-800/80 dark:bg-neutral-900/95"
      >
        <AlertDialogTitle class="mb-2 text-xl text-neutral-800 font-bold dark:text-neutral-100">
          Create New Character Card
        </AlertDialogTitle>
        <p class="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
          Choose how you want to create your new character roleplay card.
        </p>

        <div class="grid grid-cols-1 mb-6 gap-4 md:grid-cols-2">
          <!-- Guided Creator Option -->
          <div
            class="group flex flex-col cursor-pointer border border-primary-500/20 rounded-xl bg-primary-500/5 p-5 transition-all duration-300 hover:border-primary-500/40 hover:bg-primary-500/10"
            @click="selectGuided"
          >
            <div class="mb-3 flex items-center justify-between">
              <div class="rounded-lg bg-primary-500/20 p-2.5 text-primary-500">
                <div i-solar:magic-stick-3-line-duotone class="text-2xl" />
              </div>
              <span class="rounded bg-primary-500/10 px-2 py-0.5 text-[10px] text-primary-500 font-bold tracking-wider uppercase">
                Recommended
              </span>
            </div>
            <h4 class="text-base text-neutral-800 font-bold transition-colors dark:text-neutral-200 group-hover:text-primary-600 dark:group-hover:text-primary-400">
              Guided AI Creator
            </h4>
            <p class="mt-1 text-xs text-neutral-500 leading-relaxed dark:text-neutral-400">
              Select one or more characters from the 36k AnimaDex catalog, configure custom story prompts, and let the AI synthesize a roleplay card.
            </p>
          </div>

          <!-- Advanced Creator Option -->
          <div
            class="group flex flex-col cursor-pointer border border-neutral-200 rounded-xl bg-neutral-50/50 p-5 transition-all duration-300 dark:border-neutral-800 hover:border-neutral-300 dark:bg-neutral-800/10 hover:bg-neutral-100/50 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/30"
            @click="selectAdvanced"
          >
            <div class="mb-3 flex items-center">
              <div class="rounded-lg bg-neutral-200 p-2.5 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                <div i-solar:settings-line-duotone class="text-2xl" />
              </div>
            </div>
            <h4 class="text-base text-neutral-800 font-bold transition-colors dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-white">
              Advanced Manual Card
            </h4>
            <p class="mt-1 text-xs text-neutral-500 leading-relaxed dark:text-neutral-400">
              Manually fill out character definitions, personality traits, custom greeting lines, prompts, and configure display models from scratch.
            </p>
          </div>
        </div>

        <div class="flex flex-row justify-end">
          <Button
            variant="secondary"
            label="Cancel"
            class="h-[36px] px-4 text-xs"
            @click="emit('update:modelValue', false)"
          />
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
