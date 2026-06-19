<script setup lang="ts">
import { useMmd } from '@proj-airi/stage-ui-mmd/stores/mmd'
import { Button, Checkbox, FieldRange, SelectTab } from '@proj-airi/ui'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import ModelSceneSettings from './components/ModelSceneSettings.vue'

import { useAiriCardStore } from '../../../../stores/modules'
import { useSettings } from '../../../../stores/settings'
import { usePositioningStore } from '../../../../stores/settings/positioning'
import { Section } from '../../../layouts'

const props = withDefaults(defineProps<{
  palette: string[]
  allowExtractColors?: boolean
  modelId?: string
}>(), {
  allowExtractColors: true,
})

const mmdStore = useMmd()
const positioningStore = usePositioningStore()
const settingsStore = useSettings()
const { t } = useI18n()
const { stageModelSelected } = storeToRefs(settingsStore)
const {
  availableMorphs,
  morphMappings,
  hiddenMorphs,
  availableMotions,
  currentMotion,
  previewExpression,
  followSpeed,
  physicsEnabled,
  ikEnabled,
  grantEnabled,
  physicsGravity,
  gazeMode,
  customMotions,
} = storeToRefs(mmdStore)

const mouseTrackingEnabled = computed({
  get: () => gazeMode.value === 'mouse',
  set: (val) => {
    gazeMode.value = val ? 'mouse' : 'none'
  },
})

const airiCardStore = useAiriCardStore()
const { activeCard, activeCardId } = storeToRefs(airiCardStore)
const { updateCard } = airiCardStore

function isMotionSelected(motion: string) {
  const key = `mmd:${motion}`
  return activeCard.value?.extensions?.airi?.acting?.idleAnimations?.includes(key) ?? false
}

function toggleMotion(motion: string) {
  if (!activeCardId.value || !activeCard.value)
    return

  const key = `mmd:${motion}`
  const current = activeCard.value.extensions.airi.acting?.idleAnimations || []
  const next = current.includes(key)
    ? current.filter(k => k !== key)
    : [...current, key]

  updateCard(activeCardId.value, {
    extensions: {
      ...activeCard.value.extensions,
      airi: {
        ...activeCard.value.extensions.airi,
        acting: {
          ...activeCard.value.extensions.airi.acting,
          idleAnimations: next,
        },
      },
    },
  })
}

// Tabs State
const customizationTabs = computed(() => [
  { value: 'expressions', label: 'Expressions', icon: 'i-solar:face-scan-circle-bold-duotone' },
  { value: 'motions', label: 'Motions', icon: 'i-solar:play-bold-duotone' },
])
const activeCustomizationTab = ref('expressions')

// Expressions (Morphs) List State
const showHiddenMorphs = ref(false)
const filterRenamedOnly = ref(false)
const editingMorphKey = ref<string | null>(null)
const editingMorphValue = ref('')

const filteredMorphs = computed(() => {
  return availableMorphs.value.filter((morph) => {
    // Filter hidden
    if (!showHiddenMorphs.value && hiddenMorphs.value.includes(morph)) {
      return false
    }
    // Filter renamed
    if (filterRenamedOnly.value && !morphMappings.value[morph]) {
      return false
    }
    return true
  })
})

function getDisplayName(morph: string) {
  return morphMappings.value[morph] || morph
}

function isHidden(morph: string) {
  return hiddenMorphs.value.includes(morph)
}

function toggleVisibility(morph: string) {
  if (hiddenMorphs.value.includes(morph)) {
    hiddenMorphs.value = hiddenMorphs.value.filter(p => p !== morph)
  }
  else {
    hiddenMorphs.value = [...hiddenMorphs.value, morph]
  }
}

function startEditing(morph: string) {
  editingMorphKey.value = morph
  editingMorphValue.value = morphMappings.value[morph] || ''
}

function saveMorphName(morph: string) {
  if (editingMorphValue.value.trim() === '') {
    const updated = { ...morphMappings.value }
    delete updated[morph]
    morphMappings.value = updated
  }
  else {
    morphMappings.value = { ...morphMappings.value, [morph]: editingMorphValue.value.trim() }
  }
  editingMorphKey.value = null
  editingMorphValue.value = ''
}

function cancelEditing() {
  editingMorphKey.value = null
  editingMorphValue.value = ''
}

function handleMorphSelect(morph: string) {
  console.log('[MMD Settings] Previewing morph:', morph)
  previewExpression.value = morph
}

// Motions List State

function handleMotionSelect(motion: string) {
  console.log('[MMD Settings] Selecting motion:', motion)
  currentMotion.value = motion

  if (motion === '') {
    // Clear all mmd: prefix animations from card idleAnimations cycle list
    if (activeCardId.value && activeCard.value) {
      const current = activeCard.value.extensions.airi.acting?.idleAnimations || []
      const next = current.filter(key => !key.startsWith('mmd:'))
      updateCard(activeCardId.value, {
        extensions: {
          ...activeCard.value.extensions,
          airi: {
            ...activeCard.value.extensions.airi,
            acting: {
              ...activeCard.value.extensions.airi.acting,
              idleAnimations: next,
            },
          },
        },
      })
    }
  }
}
</script>

<template>
  <!-- Block 1: Character Customizations -->
  <Section
    title="Character Customizations"
    icon="i-solar:user-bold-duotone"
    :class="['rounded-xl', 'bg-white/80 dark:bg-black/75', 'backdrop-blur-lg']"
    size="sm"
    :expand="true"
  >
    <div class="w-full">
      <!-- Tabs -->
      <SelectTab v-model="activeCustomizationTab" :options="customizationTabs" size="sm" compact class="mb-4" />

      <!-- Expressions Tab -->
      <div v-if="activeCustomizationTab === 'expressions'" class="relative flex flex-col gap-2">
        <!-- Controls Bar -->
        <div class="mb-2 flex items-center justify-between gap-2">
          <div class="flex gap-1">
            <Button
              size="sm"
              :variant="showHiddenMorphs ? 'primary' : 'secondary'"
              @click="showHiddenMorphs = !showHiddenMorphs"
            >
              <template #icon>
                <div :class="showHiddenMorphs ? 'i-solar:eye-bold-duotone' : 'i-solar:eye-closed-bold-duotone'" />
              </template>
              {{ showHiddenMorphs ? 'Showing Hidden' : 'Hide Hidden' }}
            </Button>
            <Button
              size="sm"
              :variant="filterRenamedOnly ? 'primary' : 'secondary'"
              @click="filterRenamedOnly = !filterRenamedOnly"
            >
              <template #icon>
                <div class="i-solar:pen-bold-duotone" />
              </template>
              {{ filterRenamedOnly ? 'Renamed Only' : 'All' }}
            </Button>
          </div>
          <div class="text-xs text-neutral-500">
            {{ filteredMorphs.length }} expressions
          </div>
        </div>

        <!-- Fixed Height Scrollable List -->
        <div class="max-h-[300px] overflow-y-auto border border-neutral-200 rounded-lg bg-white dark:border-neutral-700 dark:bg-neutral-900">
          <div v-if="filteredMorphs.length === 0" class="p-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
            No expressions match filters
          </div>
          <div
            v-for="morph in filteredMorphs"
            :key="morph"
            :class="[
              'flex items-center justify-between px-4 py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-b-0 transition-colors',
              previewExpression === morph ? 'bg-primary-50/50 dark:bg-primary-900/20' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
            ]"
          >
            <!-- Left Side: Name -->
            <div class="min-w-0 flex-1 cursor-pointer" @click="handleMorphSelect(morph)">
              <div class="flex items-center gap-2">
                <!-- Active Indicator -->
                <div v-if="previewExpression === morph" class="h-2 w-2 rounded-full bg-primary-500" />

                <!-- Name (Editable) -->
                <div v-if="editingMorphKey === morph" class="flex flex-1 items-center gap-1" @click.stop>
                  <input
                    v-model="editingMorphValue"
                    type="text"
                    :placeholder="morph"
                    class="max-w-[230px] w-full border-b border-primary-500 bg-transparent text-sm dark:text-neutral-100 focus:outline-none"
                    @keydown.enter="saveMorphName(morph)"
                    @keydown.esc="cancelEditing"
                  >
                  <button class="text-xs text-green-500 hover:text-green-600" @click="saveMorphName(morph)">
                    <div class="i-solar:check-circle-bold-duotone text-lg" />
                  </button>
                  <button class="text-xs text-red-500 hover:text-red-600" @click="cancelEditing">
                    <div class="i-solar:close-circle-bold-duotone text-lg" />
                  </button>
                </div>
                <div v-else class="max-w-[230px] truncate text-sm text-neutral-900 font-medium dark:text-neutral-100">
                  {{ getDisplayName(morph) }}
                </div>
              </div>
              <div class="ml-4 max-w-[230px] truncate text-xs text-neutral-500 dark:text-neutral-400">
                {{ morph }}
              </div>
            </div>

            <!-- Right Side: Actions -->
            <div class="flex items-center gap-1" @click.stop>
              <!-- Edit Button -->
              <button
                class="rounded p-1 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
                title="Rename"
                @click="startEditing(morph)"
              >
                <div class="i-solar:pen-bold-duotone text-sm" />
              </button>

              <!-- Visibility Toggle -->
              <button
                class="rounded p-1 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 hover:text-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
                :title="isHidden(morph) ? 'Show' : 'Hide'"
                @click="toggleVisibility(morph)"
              >
                <div :class="isHidden(morph) ? 'i-solar:eye-closed-bold-duotone' : 'i-solar:eye-bold-duotone'" class="text-sm" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Motions Tab -->
      <div v-else-if="activeCustomizationTab === 'motions'" class="relative flex flex-col gap-2">
        <!-- Controls Bar -->
        <div class="mb-2 flex items-center justify-between gap-2">
          <div class="text-xs text-neutral-500">
            {{ availableMotions.length }} motions available
          </div>
        </div>

        <!-- Fixed Height Scrollable List -->
        <div class="max-h-[300px] overflow-y-auto border border-neutral-200 rounded-lg bg-white dark:border-neutral-700 dark:bg-neutral-900">
          <!-- None Option -->
          <div
            :class="[
              'flex items-center justify-between px-4 py-2 border-b border-neutral-100 dark:border-neutral-800 transition-colors cursor-pointer',
              !currentMotion ? 'bg-primary-50/50 dark:bg-primary-900/20' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
            ]"
            @click="handleMotionSelect('')"
          >
            <div class="flex items-center gap-2">
              <div v-if="!currentMotion" class="h-2 w-2 rounded-full bg-primary-500" />
              <div class="text-sm text-neutral-900 font-medium dark:text-neutral-100">
                None
              </div>
            </div>
          </div>

          <div
            v-for="motion in availableMotions"
            :key="motion"
            :class="[
              'flex items-center justify-between px-4 py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-b-0 transition-colors',
              currentMotion === motion || isMotionSelected(motion) ? 'bg-primary-50/50 dark:bg-primary-900/20' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
            ]"
          >
            <!-- Left Side: Name -->
            <div class="min-w-0 flex-1 cursor-pointer" @click="handleMotionSelect(motion)">
              <div class="flex items-center gap-2">
                <!-- Active Indicator -->
                <div v-if="currentMotion === motion" class="h-2 w-2 rounded-full bg-primary-500" />

                <div class="max-w-[230px] truncate text-sm text-neutral-900 font-medium dark:text-neutral-100">
                  {{ motion.replace('.vmd', '').replace(/_/g, ' ') }}
                </div>
              </div>
              <div class="ml-4 max-w-[230px] truncate text-xs text-neutral-500 dark:text-neutral-400">
                {{ motion }}
              </div>
            </div>

            <!-- Right Side: Actions -->
            <div class="flex items-center gap-1" @click.stop>
              <!-- Loop / Cycle Toggle -->
              <button
                v-if="activeCard"
                :class="[
                  'rounded p-1 transition-colors',
                  isMotionSelected(motion)
                    ? 'text-primary-500 hover:text-primary-600 bg-primary-500/10'
                    : 'text-neutral-400 hover:bg-neutral-100 dark:text-neutral-500 dark:hover:bg-neutral-800',
                ]"
                :title="isMotionSelected(motion) ? 'Remove from Idle Cycle' : 'Add to Idle Cycle'"
                @click="toggleMotion(motion)"
              >
                <div class="i-solar:infinity-bold-duotone text-sm" />
              </button>
            </div>
          </div>

          <!-- Custom motions from IndexedDB -->
          <div
            v-for="motion in customMotions"
            :key="motion.id"
            :class="[
              'flex items-center justify-between px-4 py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-b-0 transition-colors',
              currentMotion === motion.name || isMotionSelected(motion.name) ? 'bg-primary-50/50 dark:bg-primary-900/20' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
            ]"
          >
            <!-- Left Side: Name -->
            <div class="min-w-0 flex-1 cursor-pointer" @click="handleMotionSelect(motion.name)">
              <div class="flex items-center gap-2">
                <!-- Active Indicator -->
                <div v-if="currentMotion === motion.name" class="h-2 w-2 rounded-full bg-primary-500" />

                <div class="max-w-[230px] truncate text-sm text-neutral-900 font-medium dark:text-neutral-100">
                  {{ motion.name }}
                </div>
              </div>
              <div class="ml-4 max-w-[230px] truncate text-xs text-neutral-500 dark:text-neutral-400">
                Custom VMD Motion
              </div>
            </div>

            <!-- Right Side: Actions -->
            <div class="flex items-center gap-1" @click.stop>
              <!-- Loop / Cycle Toggle -->
              <button
                v-if="activeCard"
                :class="[
                  'rounded p-1 transition-colors',
                  isMotionSelected(motion.name)
                    ? 'text-primary-500 hover:text-primary-600 bg-primary-500/10'
                    : 'text-neutral-400 hover:bg-neutral-100 dark:text-neutral-500 dark:hover:bg-neutral-800',
                ]"
                :title="isMotionSelected(motion.name) ? 'Remove from Idle Cycle' : 'Add to Idle Cycle'"
                @click="toggleMotion(motion.name)"
              >
                <div class="i-solar:infinity-bold-duotone text-sm" />
              </button>
              <button
                class="rounded p-1 text-red-500 transition-colors hover:bg-red-100 dark:hover:bg-red-950"
                title="Remove Custom Motion"
                @click="mmdStore.removeMotion(motion.id)"
              >
                <div class="i-solar:trash-bin-minimalistic-bold-duotone text-sm" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Section>

  <!-- Block 2: Scene -->
  <ModelSceneSettings
    :store="mmdStore"
    :positioning-store="positioningStore"
    :model-id="props.modelId || stageModelSelected"
    :model-size="mmdStore.modelSize || { x: 1, y: 2, z: 1 }"
    :palette="palette"
  />

  <!-- Block 3: Advanced -->
  <Section
    title="Advanced"
    icon="i-solar:settings-bold-duotone"
    :class="['rounded-xl', 'bg-white/80 dark:bg-black/75', 'backdrop-blur-lg']"
    size="sm"
    :expand="false"
  >
    <div flex="~ col gap-4" p-2>
      <!-- Mouse Tracking & Follow Speed -->
      <div flex="~ col gap-4" class="mb-2 border-b border-neutral-100 pb-4 dark:border-neutral-800">
        <div flex="~ items-center justify-between">
          <div flex="~ col gap-0.5">
            <span class="text-sm text-neutral-600 dark:text-neutral-400">{{ t('settings.vrm.scale-and-position.mouse-tracking') }}</span>
            <span class="text-[10px] text-neutral-400">{{ t('settings.vrm.scale-and-position.mouse-tracking-desc') }}</span>
          </div>
          <Checkbox v-model="mouseTrackingEnabled" />
        </div>

        <div v-if="mouseTrackingEnabled" flex="~ col gap-2">
          <FieldRange
            v-model="followSpeed"
            :min="0.01"
            :max="1"
            :step="0.01"
            :label="t('settings.vrm.scale-and-position.follow-speed')"
          >
            <template #label>
              <div flex="~ items-center justify-between" class="w-full">
                <div class="text-sm text-neutral-600 dark:text-neutral-400">
                  {{ t('settings.vrm.scale-and-position.follow-speed') }}
                </div>
                <div class="text-xs text-neutral-600 font-bold font-mono dark:text-neutral-400">
                  {{ followSpeed.toFixed(2) }}
                </div>
              </div>
            </template>
          </FieldRange>
        </div>
      </div>

      <!-- Physics Solver Toggles -->
      <div flex="~ col gap-4" class="mb-2 border-b border-neutral-100 pb-4 dark:border-neutral-800">
        <div flex="~ items-center justify-between">
          <span class="text-sm text-neutral-600 dark:text-neutral-400">Enable Physics</span>
          <Checkbox v-model="physicsEnabled" />
        </div>
        <div flex="~ items-center justify-between">
          <span class="text-sm text-neutral-600 dark:text-neutral-400">Enable IK Solvers</span>
          <Checkbox v-model="ikEnabled" />
        </div>
        <div flex="~ items-center justify-between">
          <span class="text-sm text-neutral-600 dark:text-neutral-400">Enable Append-Bone (Grant)</span>
          <Checkbox v-model="grantEnabled" />
        </div>
        <div flex="~ col gap-2">
          <FieldRange
            v-model="physicsGravity"
            :min="0"
            :max="200"
            :step="1"
            label="Gravity Strength"
          >
            <template #label>
              <div flex="~ items-center justify-between" class="w-full">
                <div class="text-sm text-neutral-600 dark:text-neutral-400">
                  Gravity Strength
                </div>
                <div class="text-xs text-neutral-600 font-bold font-mono dark:text-neutral-400">
                  {{ physicsGravity }}
                </div>
              </div>
            </template>
          </FieldRange>
        </div>
      </div>
    </div>
  </Section>
</template>
