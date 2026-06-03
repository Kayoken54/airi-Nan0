<script setup lang="ts">
interface Choice {
  title: string
  message: string
}

const props = defineProps<{
  message: {
    choices: Choice[]
    loading?: boolean
  }
}>()

const emit = defineEmits<{
  (e: 'choose', choice: Choice): void
  (e: 'retry'): void
  (e: 'delete'): void
}>()
</script>

<template>
  <div
    class="producer-choice-bubble relative my-2 flex flex-col border border-primary-500/30 rounded-xl bg-black/40 p-3 text-sm shadow-[0_0_15px_rgba(var(--primary-rgb),0.15)] backdrop-blur-md transition-all hover:border-primary-500/40"
  >
    <!-- Subtle scanline effect overlay -->
    <div class="pointer-events-none absolute inset-0 rounded-xl bg-[length:100%_4px] bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.15)_50%)] opacity-10" />

    <!-- Header Actions -->
    <div class="z-10 flex select-none items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="i-solar:magic-stick-3-bold-duotone animate-pulse text-lg text-primary-400" />
        <span class="text-xs text-primary-300 font-bold tracking-widest font-mono">PRODUCER DIRECTIVES</span>
      </div>

      <div class="flex items-center gap-1.5 border border-primary-500/10 rounded-lg bg-black/40 p-0.5">
        <button
          class="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-neutral-400 font-semibold transition-colors hover:bg-neutral-800/50 hover:text-primary-300"
          title="Regenerate choices"
          @click="emit('retry')"
        >
          <span class="i-solar:restart-square-outline text-xs" />
          <span>Retry</span>
        </button>
        <div class="h-2.5 w-[1px] bg-neutral-800" />
        <button
          class="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-neutral-400 font-semibold transition-colors hover:bg-red-950/20 hover:text-red-400"
          title="Dismiss suggestions"
          @click="emit('delete')"
        >
          <span class="i-solar:trash-bin-trash-outline text-xs" />
          <span>Dismiss</span>
        </button>
      </div>
    </div>

    <!-- Cards Grid -->
    <div class="z-10 mt-3 flex flex-col gap-2">
      <!-- Loading Skeleton State -->
      <div v-if="message.loading" class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div
          v-for="i in 4"
          :key="i"
          class="h-18 flex flex-col animate-pulse gap-2 border border-neutral-800/50 rounded-xl bg-neutral-900/30 p-3"
        >
          <div class="h-4 w-1/3 rounded bg-neutral-800" />
          <div class="h-3 w-3/4 rounded bg-neutral-800" />
        </div>
      </div>

      <!-- Generated Options -->
      <div v-else class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          v-for="(choice, idx) in message.choices"
          :key="idx"
          class="group border border-neutral-800 rounded-xl bg-neutral-900/20 p-3 text-left transition-all active:scale-[0.98] hover:border-primary-500/40 hover:bg-primary-950/10 hover:shadow-[0_2px_10px_rgba(var(--primary-rgb),0.05)]"
          @click="emit('choose', choice)"
        >
          <div class="flex items-start justify-between">
            <span class="text-xs text-neutral-400 font-bold tracking-wider uppercase transition-colors group-hover:text-primary-300">
              {{ choice.title }}
            </span>
            <span class="i-solar:arrow-right-up-outline translate-y-1 transform text-xs text-neutral-600 opacity-0 transition-all group-hover:translate-y-0 group-hover:text-primary-400 group-hover:opacity-100" />
          </div>
          <p class="line-clamp-2 mt-1 text-xs text-neutral-300 font-medium leading-relaxed">
            {{ choice.message }}
          </p>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.producer-choice-bubble {
  --primary-rgb: 99, 102, 241; /* Tailwind Indigo-500 or equivalent primary color */
}
</style>
