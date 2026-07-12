<script setup lang="ts">
import { ModelCustomizer } from '@proj-airi/stage-ui/components/scenarios/settings/model-settings'
import { useAnimaDexWizardStore } from '@proj-airi/stage-ui/stores/animadex-wizard'
import { useDisplayModelsStore } from '@proj-airi/stage-ui/stores/display-models'
import { useAiriCardStore } from '@proj-airi/stage-ui/stores/modules/airi-card'
import { useSettingsControlStrip } from '@proj-airi/stage-ui/stores/settings/control-strip'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'

const airiCardStore = useAiriCardStore()
const displayModelsStore = useDisplayModelsStore()
const wizardStore = useAnimaDexWizardStore()
const controlStripStore = useSettingsControlStrip()

const { activeCard, activeCardId } = storeToRefs(airiCardStore)
const { stageEnabled } = storeToRefs(controlStripStore)

onMounted(async () => {
  if (wizardStore.characters.length === 0)
    await wizardStore.loadCatalog()
})

// Currently selected character key in the rehearsal selector
const selectedKey = ref<string | null>(null)

// Get preview image from display model store (bound model takes priority)
function getModelPreviewUrl(modelId?: string) {
  if (!modelId)
    return ''
  const model = displayModelsStore.displayModels.find(m => m.id === modelId)
  return model?.previewImage || ''
}

// Active concepts from card — drives the "active" indicator dot
const activeConceptsList = computed<string[]>(() => {
  return activeCard.value?.extensions?.airi?.active_concepts || []
})

/**
 * Character derivation — same 3-gen logic as chat_studio.vue.
 *
 * Gen 1: old single-character cards. No actor_/actress_ prefixes,
 *   no manifestation.modelId bindings anywhere. Synthesizes one fallback
 *   entry from the card root (nickname/name + cardModules.displayModelId).
 *
 * Gen 2: hand-rolled multi-character. No actor_ prefixes but at least one
 *   concept has a manifestation.modelId binding. Included by hasBindings check.
 *
 * Gen 3: wizard-generated. Has actor_/actress_ prefixed keys in visual_assets.
 *   Included by the isActor check.
 *
 * A concept qualifies as a "character" if:
 *   - key starts with actor_/actress_, OR key === 'concept_user' (explicit actor)
 *   - OR it has any binding (speech.provider or manifestation.modelId) (Gen 2)
 *
 * place_* keys and unbound non-actor keys are excluded (they're settings/concepts).
 */
const characters = computed(() => {
  if (!activeCard.value)
    return []

  const assets = (activeCard.value.extensions?.airi?.visual_assets || {}) as Record<string, any>
  const cardModules = (activeCard.value.extensions?.airi?.modules || {}) as Record<string, any>

  const list: Array<{
    key: string
    name: string
    modelId?: string
    avatarUrl: string
    isActive: boolean
    isFallback?: boolean
  }> = []

  const keys = Object.keys(assets)

  // Gen detection
  const hasActorPrefixes = keys.some(k => k.startsWith('actor_') || k.startsWith('actress_'))
  const hasAnyModelBinding = keys.some((k) => {
    const asset = assets[k] || {}
    const mod = cardModules[k] || {}
    return mod.manifestation?.modelId || asset.manifestation?.modelId
  })
  const isGen1 = !hasActorPrefixes && !hasAnyModelBinding

  for (const key of keys) {
    const isActor = key.startsWith('actor_') || key.startsWith('actress_') || key === 'concept_user'
    const asset = assets[key] || {}
    const mod = cardModules[key] || {}

    const speech = mod.speech || asset.speech
    const manifestation = mod.manifestation || asset.manifestation
    const hasBindings = speech || manifestation?.modelId

    if (!isActor && !hasBindings)
      continue

    // Normalize display name
    let displayName = key
    if (key === 'concept_user')
      displayName = 'User Entity'
    else
      displayName = key.replace(/^(actor_|actress_)/, '').replace(/_/g, ' ')

    const boundModelId = manifestation?.modelId

    // Avatar: bound model preview first, then wizard catalog thumbnail fallback
    let avatarUrl = getModelPreviewUrl(boundModelId)
    if (!avatarUrl) {
      const rawPrompt = mod.prompt || asset.prompt || ''
      const match = wizardStore.findCatalogCharacter(rawPrompt)
      const canonicalTrigger = match ? match.trigger : rawPrompt.split(',')[0]?.trim()
      avatarUrl = wizardStore.getCharacterThumbUrl(canonicalTrigger) || ''
    }

    list.push({
      key,
      name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
      modelId: boundModelId,
      avatarUrl,
      isActive: activeConceptsList.value.includes(key),
    })
  }

  // Gen 1 fallback: synthesize a single entry from the card root identity
  if (isGen1) {
    const displayName = (activeCard.value as any).nickname || activeCard.value.name || 'Main Character'
    const mainModelId = cardModules.displayModelId
    let avatarUrl = getModelPreviewUrl(mainModelId)
    if (!avatarUrl) {
      const rawPrompt = activeCard.value.systemPrompt || ''
      const match = wizardStore.findCatalogCharacter(rawPrompt)
      const canonicalTrigger = match ? match.trigger : rawPrompt.split(',')[0]?.trim()
      avatarUrl = wizardStore.getCharacterThumbUrl(canonicalTrigger) || ''
    }

    list.push({
      key: 'actor_primary',
      name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
      modelId: mainModelId,
      avatarUrl,
      isActive: true,
      isFallback: true,
    })
  }

  return list
})

// Auto-select first character when cast changes and nothing is selected
const selectedChar = computed(() =>
  characters.value.find(c => c.key === selectedKey.value) || characters.value[0] || null,
)

// Auto-select on first load or when card changes
function autoSelect() {
  if (characters.value.length > 0 && !selectedKey.value)
    selectedKey.value = characters.value[0].key
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
        Select a character then map emotion &amp; motion keys in real time.
      </p>
    </div>

    <!-- Stage offline warning -->
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

    <!-- No card loaded -->
    <div v-if="!activeCardId" class="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <div class="i-solar:user-id-bold-duotone mb-2 text-4xl text-neutral-300 dark:text-neutral-700" />
      <h4 class="text-sm text-neutral-700 font-semibold dark:text-neutral-300">
        No Card Active
      </h4>
      <p class="mt-1 max-w-xs text-xs text-neutral-500">
        Open a chat session with an active character card to use the rehearsal room.
      </p>
    </div>

    <template v-else>
      <!-- Character Selector Grid (5 columns, compact) -->
      <div class="shrink-0 px-4 pb-2">
        <div v-if="characters.length === 0" class="py-2 text-center text-[10px] text-neutral-400 italic">
          No characters found in this card.
        </div>
        <div v-else class="grid grid-cols-5 gap-1.5" @vue:mounted="autoSelect">
          <button
            v-for="char in characters"
            :key="char.key"
            class="group relative h-16 w-full flex flex-col justify-end overflow-hidden border rounded-xl transition-all duration-200"
            :class="selectedChar?.key === char.key
              ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-md shadow-primary-500/10'
              : 'border-neutral-200 dark:border-neutral-800 opacity-60 hover:opacity-90 hover:border-neutral-300 dark:hover:border-neutral-700'"
            @click="selectedKey = char.key"
          >
            <!-- Avatar / Preview -->
            <div class="absolute inset-0 bg-neutral-100 dark:bg-neutral-900">
              <img
                v-if="char.avatarUrl"
                :src="char.avatarUrl"
                class="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
              >
              <div v-else class="h-full w-full flex items-center justify-center text-neutral-400 dark:text-neutral-600">
                <div class="i-solar:user-bold-duotone text-xl" />
              </div>
            </div>

            <!-- Gradient overlay -->
            <div class="absolute inset-0 from-black/80 via-black/20 to-transparent bg-gradient-to-t" />

            <!-- Active concept pulse dot -->
            <div
              v-if="char.isActive"
              class="absolute right-1.5 top-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-primary-400 ring-2 ring-primary-500/40"
            />

            <!-- No model bound indicator -->
            <div
              v-if="!char.modelId"
              class="absolute left-1.5 top-1.5 rounded bg-neutral-700/60 px-1 py-0.5 text-[8px] text-white/70 font-bold leading-none"
            >
              unbound
            </div>

            <!-- Name -->
            <div class="relative z-10 px-1.5 pb-1.5">
              <span class="line-clamp-1 block text-[9px] text-white font-bold leading-tight drop-shadow">
                {{ char.name }}
              </span>
            </div>
          </button>
        </div>
      </div>

      <!-- Divider -->
      <div class="mx-4 mb-2 border-t border-neutral-100 dark:border-neutral-800/60" />

      <!-- No model bound to selected character -->
      <div
        v-if="selectedChar && !selectedChar.modelId"
        class="flex flex-1 flex-col items-center justify-center p-6 text-center"
      >
        <div class="i-solar:link-broken-bold-duotone mb-2 text-4xl text-neutral-300 dark:text-neutral-700" />
        <h4 class="text-sm text-neutral-700 font-semibold dark:text-neutral-300">
          No Model Bound
        </h4>
        <p class="mt-1 max-w-xs text-xs text-neutral-500">
          <strong>{{ selectedChar.name }}</strong> doesn't have a display model assigned yet.
          Bind one in Settings → Card → Studio.
        </p>
      </div>

      <!-- ModelCustomizer powered by the selected character's bound modelId -->
      <div v-else-if="selectedChar?.modelId" class="flex flex-1 flex-col overflow-hidden px-4 pb-4">
        <ModelCustomizer
          :key="selectedChar.modelId"
          :model-id="selectedChar.modelId"
          :show-rehearsal-sandbox="true"
        />
      </div>

      <!-- No character selected yet -->
      <div v-else class="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div class="i-solar:users-group-two-rounded-bold-duotone mb-2 text-4xl text-neutral-300 dark:text-neutral-700" />
        <h4 class="text-sm text-neutral-700 font-semibold dark:text-neutral-300">
          Select a Character
        </h4>
        <p class="mt-1 max-w-xs text-xs text-neutral-500">
          Pick a cast member above to start rehearsing.
        </p>
      </div>
    </template>
  </div>
</template>
