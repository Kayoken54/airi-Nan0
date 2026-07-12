<script setup lang="ts">
// Model-specific Stores
import { useLive2d } from '@proj-airi/stage-ui-live2d/stores'
import { useMmd } from '@proj-airi/stage-ui-mmd'
import { useSpine } from '@proj-airi/stage-ui-spine'
import { useModelStore } from '@proj-airi/stage-ui-three'
import { DisplayModelFormat, useDisplayModelsStore } from '@proj-airi/stage-ui/stores/display-models'
// AIRI Stores
import { useAiriCardStore } from '@proj-airi/stage-ui/stores/modules/airi-card'
import { useSettingsControlStrip } from '@proj-airi/stage-ui/stores/settings/control-strip'
import { useSettingsStageModel } from '@proj-airi/stage-ui/stores/settings/stage-model'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'

// Setup Stores
const airiCardStore = useAiriCardStore()
const stageModelStore = useSettingsStageModel()
const controlStripStore = useSettingsControlStrip()
const displayModelsStore = useDisplayModelsStore()

const live2dStore = useLive2d()
const mmdStore = useMmd()
const spineStore = useSpine()
const modelStore = useModelStore() // VRM

const { activeCard, activeCardId } = storeToRefs(airiCardStore)
const { stageModelSelected } = storeToRefs(stageModelStore)
const { stageEnabled } = storeToRefs(controlStripStore)

// Resolve Model Format
const currentModel = computed(() => {
  return displayModelsStore.displayModels.find(m => m.id === stageModelSelected.value)
})

const modelType = computed<'live2d' | 'vrm' | 'mmd' | 'spine' | 'unknown'>(() => {
  if (!currentModel.value)
    return 'unknown'
  const fmt = currentModel.value.format
  if (fmt === DisplayModelFormat.Live2dZip || fmt === DisplayModelFormat.Live2dDirectory)
    return 'live2d'
  if (fmt === DisplayModelFormat.VRM)
    return 'vrm'
  if (fmt === DisplayModelFormat.PMXZip || fmt === DisplayModelFormat.PMXDirectory || fmt === DisplayModelFormat.PMD)
    return 'mmd'
  if (fmt === DisplayModelFormat.SpineZip)
    return 'spine'
  return 'unknown'
})

// Unified interface mappings
interface UnifiedExpression {
  key: string
  displayName: string
  isActive: boolean
  actMapping?: string
  isFavorite: boolean
  isVisible: boolean
  category?: string
}

interface UnifiedMotion {
  key: string
  displayName: string
  isActive: boolean
  group: string
  duration: number
  hasSound: boolean
  isInIdleCycle: boolean
  isVisible: boolean
}

// Expression Lists mapping from active stores
const rawExpressions = computed<UnifiedExpression[]>(() => {
  const card = activeCard.value
  const mType = modelType.value
  if (mType === 'unknown')
    return []

  const modules = (card?.extensions?.airi?.modules as any) || {}
  const mappings = modules[mType]?.emotionMappings || {}
  const favorites = modules[mType]?.favoriteExpressions || []
  const hidden = modules[mType]?.hiddenExpressions || []

  if (mType === 'live2d') {
    return live2dStore.availableExpressions.map(e => ({
      key: e.fileName,
      displayName: mappings[e.fileName] || e.name || e.fileName.split(/[\\/]/).pop()?.replace(/\.exp3$/, '') || e.fileName,
      isActive: !!live2dStore.activeExpressions[e.fileName],
      actMapping: live2dStore.emotionMappings[e.fileName] || mappings[e.fileName],
      isFavorite: favorites.includes(e.fileName),
      isVisible: !hidden.includes(e.fileName),
    }))
  }
  if (mType === 'vrm') {
    return modelStore.availableExpressions.map((name: string) => ({
      key: name,
      displayName: mappings[name] || name,
      isActive: false, // VRM store uses custom actions
      actMapping: mappings[name],
      isFavorite: favorites.includes(name),
      isVisible: !hidden.includes(name),
      category: name === name.toUpperCase() ? 'preset' : 'custom',
    }))
  }
  if (mType === 'mmd') {
    return mmdStore.availableMorphs.map(name => ({
      key: name,
      displayName: mappings[name] || name,
      isActive: mmdStore.previewExpression === name,
      actMapping: mappings[name],
      isFavorite: favorites.includes(name),
      isVisible: !hidden.includes(name),
    }))
  }
  if (mType === 'spine') {
    return spineStore.availableAnimations.map(anim => ({
      key: anim.name,
      displayName: mappings[anim.name] || anim.name,
      isActive: !!spineStore.activeAnimations[stageModelSelected.value]?.[anim.name],
      actMapping: mappings[anim.name],
      isFavorite: favorites.includes(anim.name),
      isVisible: !hidden.includes(anim.name),
    }))
  }
  return []
})

const rawMotions = computed<UnifiedMotion[]>(() => {
  const card = activeCard.value
  const mType = modelType.value
  if (mType === 'unknown')
    return []

  const modules = (card?.extensions?.airi?.modules as any) || {}
  const mappings = modules[mType]?.motionMappings || {}
  const hidden = modules[mType]?.hiddenMotions || []
  const idleCycles = card?.extensions?.airi?.acting?.idleAnimations || []

  if (mType === 'live2d') {
    return live2dStore.availableMotions.map(m => ({
      key: m.fileName,
      displayName: mappings[m.fileName] || m.motionName || m.fileName,
      isActive: live2dStore.currentMotion.group === m.motionName,
      group: m.motionName || 'Motions',
      duration: 3.0, // fallback
      hasSound: !!m.sound,
      isInIdleCycle: idleCycles.includes(`live2d:${m.motionName}`),
      isVisible: !hidden.includes(m.fileName),
    }))
  }
  if (mType === 'mmd') {
    const list = [...(mmdStore.availableMotions as any[]), ...(mmdStore.customMotions as any[])]
    return list.map((item) => {
      const isStr = typeof item === 'string'
      const key = isStr ? item : item.id
      const name = isStr ? item : item.name
      return {
        key,
        displayName: mappings[key] || name.split(/[\\/]/).pop() || name,
        isActive: mmdStore.currentMotion === name,
        group: 'Animations',
        duration: 5.0,
        hasSound: false,
        isInIdleCycle: idleCycles.includes(`mmd:${key}`),
        isVisible: !hidden.includes(key),
      }
    })
  }
  if (mType === 'spine') {
    return spineStore.availableAnimations.map(anim => ({
      key: anim.name,
      displayName: mappings[anim.name] || anim.name,
      isActive: false,
      group: 'Animations',
      duration: anim.duration || 1.0,
      hasSound: false,
      isInIdleCycle: idleCycles.includes(`spine:${anim.name}`),
      isVisible: !hidden.includes(anim.name),
    }))
  }
  return []
})

// Filter states
const activeTab = ref<'expressions' | 'motions'>('expressions')
const showHidden = ref(false)
const filterRenamedOnly = ref(false)
const editingKey = ref<string | null>(null)
const editingValue = ref('')

const expressionsToRender = computed(() => {
  let list = showHidden.value ? rawExpressions.value : rawExpressions.value.filter(e => e.isVisible)
  if (filterRenamedOnly.value) {
    list = list.filter(e => e.displayName !== e.key)
  }
  return list
})

const motionsToRender = computed(() => {
  const groups = new Map<string, UnifiedMotion[]>()
  for (const m of rawMotions.value) {
    if (!showHidden.value && !m.isVisible)
      continue
    if (filterRenamedOnly.value && m.displayName === m.key)
      continue
    if (!groups.has(m.group))
      groups.set(m.group, [])
    groups.get(m.group)!.push(m)
  }
  return groups
})

// Warnings detection
const hasTechnicalKeys = computed(() => {
  // Detect if any visible expressions have technical/file names
  const technicalRegex = /(\.json|\.vmd|expression_|morph_|\d)/i
  return rawExpressions.value.some(e => e.isVisible && technicalRegex.test(e.key) && e.displayName === e.key)
})

// Trigger Click-to-Effectuate on Stage
function triggerExpressionEffect(key: string) {
  if (!stageEnabled.value) {
    toast.error('Stage window must be open to preview expressions.')
    return
  }
  if (modelType.value === 'live2d') {
    live2dStore.triggerEmotion(key, 1.0)
  }
  else if (modelType.value === 'vrm') {
    modelStore.triggerEmotion(key, 1.0)
  }
  else if (modelType.value === 'mmd') {
    mmdStore.previewExpression = key
    setTimeout(() => {
      if (mmdStore.previewExpression === key)
        mmdStore.previewExpression = null
    }, 2000)
  }
  else if (modelType.value === 'spine') {
    spineStore.playOneShotAnimation(key)
  }
  toast.info(`Triggered expression: ${key}`)
}

function triggerMotionEffect(key: string, group: string) {
  if (!stageEnabled.value) {
    toast.error('Stage window must be open to preview motions.')
    return
  }
  if (modelType.value === 'live2d') {
    live2dStore.triggerMotion(group)
  }
  else if (modelType.value === 'mmd') {
    mmdStore.playOneShotAction(key)
  }
  else if (modelType.value === 'spine') {
    spineStore.playOneShotAnimation(key)
  }
  toast.info(`Triggered motion: ${key}`)
}

// Rename Label persisting to Card Extensions
function startEditing(key: string, currentDisplayName: string) {
  editingKey.value = key
  editingValue.value = currentDisplayName
}

function saveEdits(key: string) {
  if (!activeCardId.value || !activeCard.value)
    return

  const extensions = JSON.parse(JSON.stringify(activeCard.value.extensions || {}))
  if (!extensions.airi)
    extensions.airi = {}
  if (!extensions.airi.modules)
    extensions.airi.modules = {}
  if (!extensions.airi.modules[modelType.value])
    extensions.airi.modules[modelType.value] = {}
  if (!extensions.airi.modules[modelType.value].emotionMappings) {
    extensions.airi.modules[modelType.value].emotionMappings = {}
  }
  if (!extensions.airi.modules[modelType.value].motionMappings) {
    extensions.airi.modules[modelType.value].motionMappings = {}
  }

  const newValue = editingValue.value.trim() || key
  if (activeTab.value === 'expressions') {
    extensions.airi.modules[modelType.value].emotionMappings[key] = newValue
  }
  else {
    extensions.airi.modules[modelType.value].motionMappings[key] = newValue
  }

  airiCardStore.updateCard(activeCardId.value, { ...activeCard.value, extensions })
  editingKey.value = null
  editingValue.value = ''
  toast.success('Label updated and saved to card.')
}

function toggleVisibility(key: string) {
  if (!activeCardId.value || !activeCard.value)
    return
  const extensions = JSON.parse(JSON.stringify(activeCard.value.extensions || {}))
  if (!extensions.airi)
    extensions.airi = {}
  if (!extensions.airi.modules)
    extensions.airi.modules = {}
  if (!extensions.airi.modules[modelType.value])
    extensions.airi.modules[modelType.value] = {}

  const listName = activeTab.value === 'expressions' ? 'hiddenExpressions' : 'hiddenMotions'
  let list = extensions.airi.modules[modelType.value][listName] || []
  if (list.includes(key)) {
    list = list.filter((k: string) => k !== key)
  }
  else {
    list.push(key)
  }
  extensions.airi.modules[modelType.value][listName] = list
  airiCardStore.updateCard(activeCardId.value, { ...activeCard.value, extensions })
}

function toggleFavorite(key: string) {
  if (!activeCardId.value || !activeCard.value)
    return
  const extensions = JSON.parse(JSON.stringify(activeCard.value.extensions || {}))
  if (!extensions.airi)
    extensions.airi = {}
  if (!extensions.airi.modules)
    extensions.airi.modules = {}
  if (!extensions.airi.modules[modelType.value])
    extensions.airi.modules[modelType.value] = {}

  let list = extensions.airi.modules[modelType.value].favoriteExpressions || []
  if (list.includes(key)) {
    list = list.filter((k: string) => k !== key)
  }
  else {
    list.push(key)
  }
  extensions.airi.modules[modelType.value].favoriteExpressions = list
  airiCardStore.updateCard(activeCardId.value, { ...activeCard.value, extensions })
}

// ACT Mapping Dialog
const ACT_MAPPING_TARGET = ref<string | null>(null)
function openActMapping(key: string) {
  ACT_MAPPING_TARGET.value = key
}

function assignActMapping(emotion: string) {
  if (!activeCardId.value || !activeCard.value || !ACT_MAPPING_TARGET.value)
    return
  const extensions = JSON.parse(JSON.stringify(activeCard.value.extensions || {}))
  if (!extensions.airi)
    extensions.airi = {}
  if (!extensions.airi.modules)
    extensions.airi.modules = {}
  if (!extensions.airi.modules[modelType.value])
    extensions.airi.modules[modelType.value] = {}
  if (!extensions.airi.modules[modelType.value].emotionMappings) {
    extensions.airi.modules[modelType.value].emotionMappings = {}
  }
  // Store ACT mapping
  if (modelType.value === 'live2d') {
    live2dStore.emotionMappings[ACT_MAPPING_TARGET.value] = emotion
  }
  extensions.airi.modules[modelType.value].emotionMappings[ACT_MAPPING_TARGET.value] = emotion
  airiCardStore.updateCard(activeCardId.value, { ...activeCard.value, extensions })
  ACT_MAPPING_TARGET.value = null
  toast.success(`Mapped expression to ACT:${emotion}`)
}

// Playground & Rehearsal Sandbox
const playgroundText = ref('<|ACT:emotion="happy"|> Hello world! Welcome to the Stage.')
const isRehearsing = ref(false)

const REHEARSAL_PRESETS = [
  { label: 'Basic Joy', text: '<|ACT:emotion="happy"|> Hello there! I am so glad to see you.' },
  { label: 'Dramatic Shock', text: '<|ACT:emotion="surprised"|> Wait! What do you mean by that?!' },
  { label: 'Pensive Thoughts', text: '<|ACT:emotion="thinking"|> Let me think... that seems quite interesting.' },
]

function applyPreset(text: string) {
  playgroundText.value = text
}

// Sandbox Play Rehearsal (TTS + Animation Injection)
async function playRehearsal() {
  if (!stageEnabled.value) {
    toast.error('Stage window must be open to orchestrate rehearsals.')
    return
  }
  if (isRehearsing.value)
    return
  isRehearsing.value = true

  try {
    const text = playgroundText.value.trim()
    // Parse tags: <|ACT:emotion="xxx"|> or <|ACT:motion="xxx"|>
    const actRegex = /<\|ACT:(emotion|motion)="([^"]+)"\|>/g
    let match
    const triggers: Array<{ type: 'emotion' | 'motion', value: string, index: number }> = []
    while ((match = actRegex.exec(text)) !== null) {
      triggers.push({
        type: match[1] as 'emotion' | 'motion',
        value: match[2],
        index: match.index,
      })
    }

    // Clean text for speech synthesis
    const cleanText = text.replace(/<\|ACT:[^|]+\|>/g, '').trim()

    // Trigger loaded emotions/motions immediately
    for (const t of triggers) {
      if (t.type === 'emotion') {
        triggerExpressionEffect(t.value)
      }
      else {
        triggerMotionEffect(t.value, t.value)
      }
    }

    // Try Speech Synthesis Fallback / Provider
    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.onend = () => { isRehearsing.value = false }
      utterance.onerror = () => { isRehearsing.value = false }
      window.speechSynthesis.speak(utterance)
    }
    else {
      isRehearsing.value = false
    }
  }
  catch (err) {
    console.error('Rehearsal failed:', err)
    isRehearsing.value = false
  }
}

// AI Dialog Generator Suggestion
const isGeneratingAI = ref(false)
async function suggestDialogue() {
  if (!activeCard.value)
    return
  isGeneratingAI.value = true
  try {
    const available = rawExpressions.value.slice(0, 4).map(e => e.displayName).join(', ')
    playgroundText.value = `Loading suggestion... using tokens: [${available}]`

    // Simulate AI generation locally matching available mapping tags
    setTimeout(() => {
      const tag = rawExpressions.value[0]?.displayName || 'happy'
      playgroundText.value = `<|ACT:emotion="${tag}"|> Oh, hello! I was just practicing in the Rehearsal Room.`
      isGeneratingAI.value = false
      toast.success('Dialogue script suggested!')
    }, 1500)
  }
  catch (err) {
    isGeneratingAI.value = false
    toast.error('AI suggestion failed.')
  }
}
</script>

<template>
  <div class="h-full w-full flex flex-col overflow-hidden bg-white dark:bg-neutral-900/10">
    <!-- Header -->
    <div class="shrink-0 p-4 pb-2">
      <h3 class="text-sm text-neutral-800 font-bold dark:text-neutral-200">
        Rehearsal Room (Debugger)
      </h3>
      <p class="mt-0.5 text-[10px] text-neutral-500">
        Debug acting tags and map emotion keys to display labels in real time.
      </p>
    </div>

    <!-- Warning Status Guard -->
    <div v-if="!stageEnabled" class="mx-4 mb-3 border border-amber-200/50 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-700 dark:border-amber-900/50 dark:text-amber-400">
      <div class="flex items-center gap-1 font-semibold">
        <div class="i-solar:shield-warning-bold-duotone text-base" />
        Stage Window Offline
      </div>
      <p class="mt-1 text-[11px] leading-relaxed">
        The Stage window must be open to preview expressions and orchestrate rehearsals. Toggle Stage on in the Control Strip.
      </p>
    </div>

    <!-- Empty State Fallback -->
    <div v-if="modelType === 'unknown'" class="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <div class="i-solar:box-minimalistic-bold-duotone mb-2 text-4xl text-neutral-300 dark:text-neutral-700" />
      <h4 class="text-sm text-neutral-700 font-semibold dark:text-neutral-300">
        No Creative Controls Available
      </h4>
      <p class="mt-1 max-w-xs text-xs text-neutral-500">
        This character model does not contain any expressions or motions. Select a model that supports metadata.
      </p>

      <!-- Inline Model Selector -->
      <div class="mt-4 max-w-xs w-full">
        <select
          v-model="stageModelSelected"
          class="w-full border-2 border-neutral-100 rounded-lg bg-neutral-50 p-2 text-xs dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 focus:outline-none"
        >
          <option v-for="m in displayModelsStore.displayModels" :key="m.id" :value="m.id">
            {{ m.name }} ({{ m.format }})
          </option>
        </select>
      </div>
    </div>

    <template v-else>
      <!-- Playground Section -->
      <div class="shrink-0 px-4 pb-3">
        <div class="border border-neutral-200 rounded-xl bg-neutral-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-950/20">
          <div class="mb-2 flex items-center justify-between">
            <span class="text-[10px] text-neutral-400 font-bold tracking-wider uppercase">Sandbox Playground</span>
            <div class="flex gap-1.5">
              <button
                v-for="p in REHEARSAL_PRESETS"
                :key="p.label"
                class="cursor-pointer rounded bg-neutral-100 px-2 py-0.5 text-[9px] text-neutral-600 dark:bg-neutral-800 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-700"
                @click="applyPreset(p.text)"
              >
                {{ p.label }}
              </button>
            </div>
          </div>

          <div class="relative flex items-center border border-neutral-200 rounded-lg bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <textarea
              v-model="playgroundText"
              rows="2"
              class="w-full border-none bg-transparent p-2 text-xs dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-0"
              placeholder="e.g. <|ACT:emotion=&quot;happy&quot;|> Hello world!"
            />
            <button
              class="absolute right-2 cursor-pointer rounded-lg border-none bg-primary-500 p-2 text-white transition-colors hover:bg-primary-600"
              title="Play Rehearsal"
              :disabled="isRehearsing"
              @click="playRehearsal"
            >
              <div :class="isRehearsing ? 'i-solar:spinner-bold animate-spin' : 'i-solar:clapperboard-play-bold-duotone'" class="text-base" />
            </button>
          </div>

          <div class="mt-2 flex items-center justify-between">
            <button
              class="flex cursor-pointer items-center gap-1 rounded bg-primary-500/10 px-2.5 py-1 text-[10px] text-primary-600 font-medium transition-all hover:bg-primary-500/20 dark:text-primary-400"
              :disabled="isGeneratingAI"
              @click="suggestDialogue"
            >
              <div class="i-solar:magic-stick-3-bold-duotone" />
              {{ isGeneratingAI ? 'Generating...' : 'Suggest Dialog' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Labeling Warning Helper -->
      <div v-if="hasTechnicalKeys" class="mx-4 mb-3 border border-primary-200/40 rounded-xl bg-primary-500/5 p-3 text-xs text-primary-700 dark:border-primary-900/40 dark:text-primary-400">
        <div class="flex items-center gap-1 font-semibold">
          <div class="i-solar:info-square-bold-duotone text-base" />
          Technical Keys Detected
        </div>
        <p class="mt-1 text-[11px] leading-relaxed">
          Some expressions use system names. Click **Rename (✎)** on each item below to rename them to simple words (e.g., `happy`, `sad`) so the AI can use them.
        </p>
      </div>

      <!-- Segment Toggle: Expressions / Motions -->
      <div class="shrink-0 px-4 pb-1">
        <div class="flex rounded-lg bg-neutral-100 p-0.5 dark:bg-neutral-800">
          <button
            class="flex-1 cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-all"
            :class="activeTab === 'expressions'
              ? 'bg-white text-neutral-800 shadow-sm dark:bg-neutral-700 dark:text-neutral-100'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'"
            @click="activeTab = 'expressions'"
          >
            Expressions
          </button>
          <button
            class="flex-1 cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-all"
            :class="activeTab === 'motions'
              ? 'bg-white text-neutral-800 shadow-sm dark:bg-neutral-700 dark:text-neutral-100'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'"
            @click="activeTab = 'motions'"
          >
            Motions
          </button>
        </div>
      </div>

      <!-- Filter Controls -->
      <div class="flex shrink-0 items-center justify-between px-4 py-2">
        <span class="text-[10px] text-neutral-400 font-bold tracking-wider uppercase">
          {{ activeTab === 'expressions' ? 'Expressions' : 'Motions' }}
          <span class="ml-1 font-normal opacity-60">({{ activeTab === 'expressions' ? rawExpressions.length : rawMotions.length }})</span>
        </span>
        <div class="flex gap-1">
          <button
            class="cursor-pointer rounded-md px-2 py-0.5 text-[10px] transition-colors"
            :class="showHidden
              ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
              : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'"
            @click="showHidden = !showHidden"
          >
            {{ showHidden ? 'Show All' : 'Show Hidden' }}
          </button>
          <button
            class="cursor-pointer rounded-md px-2 py-0.5 text-[10px] transition-colors"
            :class="filterRenamedOnly
              ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
              : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'"
            @click="filterRenamedOnly = !filterRenamedOnly"
          >
            {{ filterRenamedOnly ? 'Renamed Only' : 'All' }}
          </button>
        </div>
      </div>

      <!-- Scrollable List Area -->
      <div class="flex-1 overflow-y-auto px-4 pb-4">
        <!-- ====== EXPRESSIONS LIST ====== -->
        <template v-if="activeTab === 'expressions'">
          <div v-if="expressionsToRender.length === 0" class="py-8 text-center text-xs text-neutral-400">
            No expressions match filters
          </div>
          <div v-else class="overflow-hidden border border-neutral-200 rounded-lg bg-white dark:border-neutral-700 dark:bg-neutral-900">
            <div
              v-for="exp in expressionsToRender"
              :key="exp.key"
              :class="[
                'flex items-center justify-between px-3 py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-b-0 transition-colors',
                exp.isActive ? 'bg-primary-50/30 dark:bg-primary-900/15' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
              ]"
            >
              <!-- Left: Active dot + name + key -->
              <div class="min-w-0 flex flex-1 cursor-pointer items-center gap-2" @click="triggerExpressionEffect(exp.key)">
                <div
                  :class="['h-2 w-2 rounded-full shrink-0 transition-colors', exp.isActive ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-600']"
                />
                <div class="min-w-0 flex-1">
                  <template v-if="editingKey === exp.key">
                    <input
                      v-model="editingValue"
                      type="text"
                      class="w-full border-b border-primary-500 bg-transparent text-sm dark:text-neutral-100 focus:outline-none"
                      @click.stop
                      @keydown.enter="saveEdits(exp.key)"
                      @keydown.esc="editingKey = null"
                    >
                  </template>
                  <template v-else>
                    <span class="block truncate text-sm text-neutral-900 font-medium dark:text-neutral-100">
                      <span v-if="exp.isFavorite" class="mr-0.5" title="Favorite">⭐</span>
                      {{ exp.displayName }}
                      <span
                        v-if="exp.actMapping"
                        class="ml-1 rounded bg-primary-100 px-1 text-[10px] opacity-60 dark:bg-primary-900"
                        :title="`ACT: ${exp.actMapping}`"
                      >{{ exp.actMapping }}</span>
                    </span>
                  </template>
                  <span class="block truncate text-[10px] text-neutral-400">{{ exp.key }}</span>
                </div>
              </div>

              <!-- Right: Actions -->
              <div class="ml-2 flex shrink-0 items-center gap-0.5">
                <!-- ACT Mapping -->
                <button
                  class="cursor-pointer rounded p-1 transition-colors"
                  :class="exp.actMapping
                    ? 'text-primary-500 hover:text-primary-600 bg-primary-500/10'
                    : 'text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-700'"
                  title="Map to ACT emotion"
                  @click.stop="openActMapping(exp.key)"
                >
                  <div class="i-solar:magic-stick-3-bold-duotone text-sm" />
                </button>
                <!-- Favorite -->
                <button
                  class="cursor-pointer rounded p-1 transition-colors"
                  :class="exp.isFavorite
                    ? 'text-amber-500 hover:text-amber-600 bg-amber-500/10'
                    : 'text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-700'"
                  title="Favorite Toggle"
                  @click.stop="toggleFavorite(exp.key)"
                >
                  <div :class="exp.isFavorite ? 'i-solar:star-bold-duotone' : 'i-solar:star-linear'" class="text-sm" />
                </button>
                <!-- Rename -->
                <button
                  class="cursor-pointer rounded p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:bg-neutral-700"
                  title="Rename"
                  @click.stop="startEditing(exp.key, exp.displayName)"
                >
                  <div class="i-solar:pen-bold-duotone text-sm" />
                </button>
                <!-- Visibility -->
                <button
                  class="cursor-pointer rounded p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:bg-neutral-700"
                  title="Visibility Toggle"
                  @click.stop="toggleVisibility(exp.key)"
                >
                  <div :class="!exp.isVisible ? 'i-solar:eye-closed-bold-duotone' : 'i-solar:eye-bold-duotone'" class="text-sm" />
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- ====== MOTIONS LIST ====== -->
        <template v-else>
          <div v-if="motionsToRender.size === 0" class="py-8 text-center text-xs text-neutral-400">
            No motions available for this model.
          </div>

          <template v-for="[groupName, groupMotions] in motionsToRender" :key="groupName">
            <div class="mb-1 px-1">
              <span class="inline-flex items-center rounded-md bg-primary-50 px-1.5 py-0.5 text-[10px] text-primary-700 font-semibold ring-1 ring-primary-700/10 ring-inset dark:bg-primary-900/30 dark:text-primary-400 dark:ring-primary-400/20">
                {{ groupName }}
              </span>
            </div>
            <div class="mb-3 overflow-hidden border border-neutral-200 rounded-lg bg-white dark:border-neutral-700 dark:bg-neutral-900">
              <div
                v-for="mot in groupMotions"
                :key="mot.key"
                :class="[
                  'flex items-center justify-between px-3 py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-b-0 transition-colors',
                  mot.isActive ? 'bg-primary-50/30 dark:bg-primary-900/15' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                ]"
              >
                <!-- Left: Active dot + name -->
                <div class="min-w-0 flex flex-1 cursor-pointer items-center gap-2" @click="triggerMotionEffect(mot.key, mot.group)">
                  <div
                    :class="['h-2 w-2 rounded-full shrink-0 transition-colors', mot.isActive ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-600']"
                  />
                  <div class="min-w-0 flex-1">
                    <template v-if="editingKey === mot.key">
                      <input
                        v-model="editingValue"
                        type="text"
                        class="w-full border-b border-primary-500 bg-transparent text-sm dark:text-neutral-100 focus:outline-none"
                        @click.stop
                        @keydown.enter="saveEdits(mot.key)"
                        @keydown.esc="editingKey = null"
                      >
                    </template>
                    <template v-else>
                      <span class="block truncate text-sm text-neutral-900 font-medium dark:text-neutral-100">
                        {{ mot.displayName }}
                      </span>
                    </template>
                    <span class="block truncate text-[10px] text-neutral-400">{{ mot.key }}</span>
                  </div>
                </div>

                <!-- Right: Actions -->
                <div class="ml-2 flex shrink-0 items-center gap-0.5">
                  <!-- Rename -->
                  <button
                    class="cursor-pointer rounded p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:bg-neutral-700"
                    title="Rename"
                    @click.stop="startEditing(mot.key, mot.displayName)"
                  >
                    <div class="i-solar:pen-bold-duotone text-sm" />
                  </button>
                  <!-- Visibility -->
                  <button
                    class="cursor-pointer rounded p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:bg-neutral-700"
                    title="Visibility Toggle"
                    @click.stop="toggleVisibility(mot.key)"
                  >
                    <div :class="!mot.isVisible ? 'i-solar:eye-closed-bold-duotone' : 'i-solar:eye-bold-duotone'" class="text-sm" />
                  </button>
                </div>
              </div>
            </div>
          </template>
        </template>
      </div>
    </template>

    <!-- ACT Mapping Dialog -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-150"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="ACT_MAPPING_TARGET"
          class="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          @click.self="ACT_MAPPING_TARGET = null"
        >
          <div class="w-72 border border-neutral-200 rounded-xl border-solid bg-white p-4 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">
            <div class="mb-3 text-center">
              <div class="text-sm text-neutral-700 font-medium dark:text-neutral-200">
                Map to ACT Emotion
              </div>
              <div class="mt-1 block truncate rounded-md bg-neutral-100 px-3 py-1 text-xs text-primary-500 font-mono dark:bg-neutral-800">
                {{ ACT_MAPPING_TARGET }}
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="emotion in ['happy', 'sad', 'angry', 'surprised', 'neutral', 'think', 'cool']"
                :key="emotion"
                class="cursor-pointer border rounded-lg border-solid px-3 py-2 text-sm transition-all"
                :class="rawExpressions.find(e => e.key === ACT_MAPPING_TARGET)?.actMapping === emotion
                  ? 'bg-primary-500/20 border-primary-400 text-primary-600 dark:text-primary-300 font-medium'
                  : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'"
                @click="assignActMapping(emotion)"
              >
                {{ emotion }}
              </button>
            </div>
            <div class="mt-3 flex gap-2">
              <button
                class="flex-1 cursor-pointer border border-neutral-200 rounded-lg border-solid bg-neutral-50 px-3 py-1.5 text-xs text-neutral-600 transition-colors dark:border-neutral-700 dark:bg-neutral-800 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                @click="ACT_MAPPING_TARGET = null"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
