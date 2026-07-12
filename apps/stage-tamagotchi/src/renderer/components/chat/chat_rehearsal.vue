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

const selectedKey = ref<string | null>(null)

function getModelPreviewUrl(modelId?: string) {
  if (!modelId)
    return ''
  const model = displayModelsStore.displayModels.find(m => m.id === modelId)
  return model?.previewImage || ''
}

/**
 * Rehearsal room is only concerned with 3D models that are physically "on set".
 *
 * Rule: collect every visual_asset entry that has a manifestation.modelId bound
 * (modules[key] takes precedence as runtime director value, fallback to assets[key]).
 *
 * If NO entries have a manifestation.modelId at all (simple/Gen1 card), fall back
 * to modules.displayModelId — the single global runtime model. In that case the
 * selector is non-interactive (nothing to switch between), shown as a single thumbnail.
 */
const onSetModels = computed(() => {
  if (!activeCard.value)
    return []

  const assets = (activeCard.value.extensions?.airi?.visual_assets || {}) as Record<string, any>
  const modules = (activeCard.value.extensions?.airi?.modules || {}) as Record<string, any>

  const list: Array<{
    key: string
    name: string
    modelId: string
    avatarUrl: string
  }> = []

  for (const key of Object.keys(assets)) {
    const asset = assets[key] || {}
    const mod = modules[key] || {}

    // modules value is the authoritative runtime director state
    const modelId = mod.manifestation?.modelId || asset.manifestation?.modelId
    if (!modelId)
      continue

    let displayName = key
    if (key === 'concept_user')
      displayName = 'User Entity'
    else
      displayName = key.replace(/^(actor_|actress_)/, '').replace(/_/g, ' ')

    // Avatar: model preview first, wizard catalog thumbnail fallback
    let avatarUrl = getModelPreviewUrl(modelId)
    if (!avatarUrl) {
      const rawPrompt = mod.prompt || asset.prompt || ''
      const match = wizardStore.findCatalogCharacter(rawPrompt)
      const canonicalTrigger = match ? match.trigger : rawPrompt.split(',')[0]?.trim()
      avatarUrl = wizardStore.getCharacterThumbUrl(canonicalTrigger) || ''
    }

    list.push({
      key,
      name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
      modelId,
      avatarUrl,
    })
  }

  console.log('[RehearsalRoom] onSetModels computed:', {
    cardId: activeCardId.value,
    bound: list.map(m => ({ key: m.key, modelId: m.modelId })),
  })

  return list
})

// Fallback model for cards with no per-actor manifestation bindings (Gen1 / simple cards)
const fallbackModelId = computed<string | null>(() => {
  if (!activeCard.value || onSetModels.value.length > 0)
    return null
  const modules = (activeCard.value.extensions?.airi?.modules || {}) as Record<string, any>
  return modules.displayModelId || null
})

const isMultiModel = computed(() => onSetModels.value.length > 0)

// Active selection — first model auto-selected when list populates
const selectedModel = computed(() => {
  if (isMultiModel.value) {
    const key = selectedKey.value || onSetModels.value[0]?.key
    return onSetModels.value.find(m => m.key === key) || onSetModels.value[0] || null
  }
  return null
})

const activeModelId = computed<string | null>(() => {
  if (isMultiModel.value)
    return selectedModel.value?.modelId || null
  return fallbackModelId.value
})
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
      <!--
        Multi-model: card has actors with manifestation.modelId bindings.
        Show 5-col selector — clicking switches which model the customizer operates on.
      -->
      <div v-if="isMultiModel" class="shrink-0 px-4 pb-2">
        <div class="grid grid-cols-5 gap-1.5">
          <button
            v-for="m in onSetModels"
            :key="m.key"
            class="group relative h-16 w-full flex flex-col justify-end overflow-hidden border rounded-xl transition-all duration-200"
            :class="selectedModel?.key === m.key
              ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-md shadow-primary-500/10'
              : 'border-neutral-200 dark:border-neutral-800 opacity-60 hover:opacity-90 hover:border-neutral-300 dark:hover:border-neutral-700'"
            @click="selectedKey = m.key"
          >
            <!-- Avatar -->
            <div class="absolute inset-0 bg-neutral-100 dark:bg-neutral-900">
              <img
                v-if="m.avatarUrl"
                :src="m.avatarUrl"
                class="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
              >
              <div v-else class="h-full w-full flex items-center justify-center text-neutral-400 dark:text-neutral-600">
                <div class="i-solar:user-bold-duotone text-xl" />
              </div>
            </div>
            <div class="absolute inset-0 from-black/80 via-black/20 to-transparent bg-gradient-to-t" />
            <div class="relative z-10 px-1.5 pb-1.5">
              <span class="line-clamp-1 block text-[9px] text-white font-bold leading-tight drop-shadow">
                {{ m.name }}
              </span>
            </div>
          </button>
        </div>
      </div>

      <!--
        Single-model fallback (Gen1 / simple card): no per-actor bindings.
        Show a non-interactive thumbnail of the single runtime model.
      -->
      <div v-else-if="fallbackModelId" class="shrink-0 px-4 pb-2">
        <div class="flex items-center gap-2 border border-neutral-200 rounded-xl bg-neutral-50 p-2 dark:border-neutral-800 dark:bg-neutral-900">
          <div class="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-200 dark:bg-neutral-800">
            <img
              v-if="getModelPreviewUrl(fallbackModelId)"
              :src="getModelPreviewUrl(fallbackModelId)"
              class="h-full w-full object-cover object-top"
            >
            <div v-else class="h-full w-full flex items-center justify-center text-neutral-400">
              <div class="i-solar:box-minimalistic-bold-duotone text-lg" />
            </div>
          </div>
          <div>
            <p class="text-xs text-neutral-700 font-semibold dark:text-neutral-200">
              {{ displayModelsStore.displayModels.find(m => m.id === fallbackModelId)?.name || 'Active Model' }}
            </p>
            <p class="text-[10px] text-neutral-400">
              Single-model card
            </p>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div v-if="isMultiModel || fallbackModelId" class="mx-4 mb-2 border-t border-neutral-100 dark:border-neutral-800/60" />

      <!-- No model bindings at all -->
      <div v-if="!activeModelId" class="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div class="i-solar:link-broken-bold-duotone mb-2 text-4xl text-neutral-300 dark:text-neutral-700" />
        <h4 class="text-sm text-neutral-700 font-semibold dark:text-neutral-300">
          No Models Bound
        </h4>
        <p class="mt-1 max-w-xs text-xs text-neutral-500">
          This card has no display model assigned. Bind one in Settings → Card → Studio.
        </p>
      </div>

      <!-- ModelCustomizer powered by active model -->
      <div v-else class="flex flex-1 flex-col overflow-hidden px-4 pb-4">
        <ModelCustomizer
          :key="activeModelId"
          :model-id="activeModelId"
          :show-rehearsal-sandbox="true"
        />
      </div>
    </template>
  </div>
</template>
