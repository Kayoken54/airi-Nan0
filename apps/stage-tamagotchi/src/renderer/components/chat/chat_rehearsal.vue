<script setup lang="ts">
import { computed, ref } from 'vue'

type ModelType = 'live2d' | 'vrm' | 'mmd' | 'spine'

const activeModelType = ref<ModelType>('live2d')

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

const ACT_EMOTIONS = ['happy', 'sad', 'angry', 'surprised', 'neutral', 'think', 'cool'] as const
const ACT_EMOJI: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  surprised: '😲',
  neutral: '😐',
  think: '🤔',
  cool: '😎',
}

const MOCK_EXPRESSIONS: Record<ModelType, UnifiedExpression[]> = {
  live2d: [
    { key: 'happy', displayName: 'happy', isActive: false, actMapping: 'happy', isFavorite: true, isVisible: true },
    { key: 'sad', displayName: 'sad', isActive: false, actMapping: 'sad', isFavorite: false, isVisible: true },
    { key: 'angry', displayName: 'angry', isActive: true, actMapping: 'angry', isFavorite: false, isVisible: true },
    { key: 'surprised', displayName: 'surprised', isActive: false, actMapping: 'surprised', isFavorite: false, isVisible: true },
    { key: 'thinking', displayName: 'thinking', isActive: false, actMapping: 'think', isFavorite: false, isVisible: true },
    { key: 'blush', displayName: 'blush', isActive: false, isFavorite: false, isVisible: true },
    { key: 'whisper', displayName: 'whisper', isActive: false, isFavorite: false, isVisible: false },
    { key: 'fear', displayName: 'fear', isActive: false, actMapping: 'surprised', isFavorite: false, isVisible: true },
  ],
  vrm: [
    { key: 'Happy', displayName: 'Happy', isActive: false, actMapping: 'happy', isFavorite: true, isVisible: true, category: 'preset' },
    { key: 'Sad', displayName: 'Sad', isActive: false, actMapping: 'sad', isFavorite: false, isVisible: true, category: 'preset' },
    { key: 'Angry', displayName: 'Angry', isActive: true, actMapping: 'angry', isFavorite: false, isVisible: true, category: 'preset' },
    { key: 'Surprised', displayName: 'Surprised', isActive: false, actMapping: 'surprised', isFavorite: false, isVisible: true, category: 'preset' },
    { key: 'Neutral', displayName: 'Neutral', isActive: false, actMapping: 'neutral', isFavorite: false, isVisible: true, category: 'preset' },
    { key: 'Fun', displayName: 'Fun', isActive: false, actMapping: 'happy', isFavorite: false, isVisible: true, category: 'preset' },
    { key: 'Sorrow', displayName: 'Sorrow', isActive: false, isFavorite: false, isVisible: false, category: 'preset' },
    { key: 'A', displayName: 'A (vowel)', isActive: false, isFavorite: false, isVisible: true, category: 'preset' },
    { key: 'I', displayName: 'I (vowel)', isActive: false, isFavorite: false, isVisible: true, category: 'preset' },
    { key: 'U', displayName: 'U (vowel)', isActive: false, isFavorite: false, isVisible: true, category: 'preset' },
    { key: 'E', displayName: 'E (vowel)', isActive: false, isFavorite: false, isVisible: true, category: 'preset' },
    { key: 'O', displayName: 'O (vowel)', isActive: false, isFavorite: false, isVisible: true, category: 'preset' },
    { key: 'browDownLeft', displayName: 'browDownLeft', isActive: false, isFavorite: false, isVisible: true, category: 'custom' },
    { key: 'browDownRight', displayName: 'browDownRight', isActive: false, isFavorite: false, isVisible: true, category: 'custom' },
    { key: 'cheekPuff', displayName: 'cheekPuff', isActive: false, isFavorite: false, isVisible: true, category: 'custom' },
    { key: 'mouthSmile', displayName: 'mouthSmile', isActive: true, isFavorite: false, isVisible: true, category: 'custom' },
  ],
  mmd: [
    { key: '笑い', displayName: 'Smile', isActive: false, actMapping: 'happy', isFavorite: true, isVisible: true },
    { key: '怒り', displayName: 'Angry', isActive: true, actMapping: 'angry', isFavorite: false, isVisible: true },
    { key: '悲しみ', displayName: 'Sad', isActive: false, actMapping: 'sad', isFavorite: false, isVisible: true },
    { key: '驚き', displayName: 'Surprise', isActive: false, actMapping: 'surprised', isFavorite: false, isVisible: true },
    { key: 'まばたき', displayName: 'Blink', isActive: false, isFavorite: false, isVisible: true },
    { key: 'にっこり', displayName: 'Grin', isActive: false, isFavorite: false, isVisible: false },
    { key: '照れ', displayName: 'Shy', isActive: false, isFavorite: false, isVisible: true },
    { key: 'ウィンク', displayName: 'Wink', isActive: false, isFavorite: false, isVisible: true },
    { key: '真面目', displayName: 'Serious', isActive: false, actMapping: 'neutral', isFavorite: false, isVisible: true },
  ],
  spine: [
    { key: 'browRaise', displayName: 'Brow Raise', isActive: false, isFavorite: false, isVisible: true },
    { key: 'eyesClosed', displayName: 'Eyes Closed', isActive: false, isFavorite: false, isVisible: true },
    { key: 'mouthOpen', displayName: 'Mouth Open', isActive: true, isFavorite: false, isVisible: true },
    { key: 'blush', displayName: 'Blush', isActive: false, isFavorite: false, isVisible: true },
    { key: 'sweat', displayName: 'Sweat Drop', isActive: false, isFavorite: false, isVisible: false },
    { key: 'surprised', displayName: 'Surprised', isActive: false, isFavorite: false, isVisible: true },
    { key: 'angryVein', displayName: 'Angry Vein', isActive: false, isFavorite: false, isVisible: true },
  ],
}

const MOCK_MOTIONS: Record<ModelType, UnifiedMotion[]> = {
  live2d: [
    { key: 'idle_01', displayName: 'Idle Loop', isActive: true, group: 'Idle', duration: 4.0, hasSound: false, isInIdleCycle: true, isVisible: true },
    { key: 'idle_02', displayName: 'Fidget', isActive: false, group: 'Idle', duration: 3.2, hasSound: false, isInIdleCycle: true, isVisible: true },
    { key: 'idle_03', displayName: 'Breathing Idle', isActive: false, group: 'Idle', duration: 5.5, hasSound: false, isInIdleCycle: false, isVisible: true },
    { key: 'tap_head', displayName: 'Head Pat', isActive: false, group: 'TapHead', duration: 2.1, hasSound: true, isInIdleCycle: false, isVisible: true },
    { key: 'tap_body', displayName: 'Poke', isActive: false, group: 'TapBody', duration: 1.8, hasSound: true, isInIdleCycle: false, isVisible: true },
    { key: 'pinch_in', displayName: 'Zoom Reaction', isActive: false, group: 'PinchIn', duration: 1.5, hasSound: false, isInIdleCycle: false, isVisible: true },
    { key: 'pinch_out', displayName: 'Expand Reaction', isActive: false, group: 'PinchOut', duration: 1.5, hasSound: false, isInIdleCycle: false, isVisible: false },
  ],
  vrm: [], // VRM motions are vrma animations — loaded separately
  mmd: [
    { key: 'idle_loop.vmd', displayName: 'Idle Loop', isActive: true, group: 'Animations', duration: 4.0, hasSound: false, isInIdleCycle: true, isVisible: true },
    { key: 'walk_01.vmd', displayName: 'Walk', isActive: false, group: 'Animations', duration: 2.5, hasSound: false, isInIdleCycle: false, isVisible: true },
    { key: 'dance_01.vmd', displayName: 'Dance', isActive: false, group: 'Animations', duration: 12.0, hasSound: false, isInIdleCycle: false, isVisible: true },
    { key: 'bow.vmd', displayName: 'Bow', isActive: false, group: 'Animations', duration: 1.8, hasSound: false, isInIdleCycle: false, isVisible: true },
    { key: 'wave_hand.vmd', displayName: 'Wave', isActive: false, group: 'Animations', duration: 2.2, hasSound: false, isInIdleCycle: false, isVisible: true },
  ],
  spine: [
    { key: 'idle', displayName: 'Idle', isActive: true, group: 'Animations', duration: 2.0, hasSound: false, isInIdleCycle: true, isVisible: true },
    { key: 'walk', displayName: 'Walk', isActive: false, group: 'Animations', duration: 1.2, hasSound: false, isInIdleCycle: false, isVisible: true },
    { key: 'run', displayName: 'Run', isActive: false, group: 'Animations', duration: 0.8, hasSound: false, isInIdleCycle: false, isVisible: true },
    { key: 'jump', displayName: 'Jump', isActive: false, group: 'Animations', duration: 0.6, hasSound: false, isInIdleCycle: false, isVisible: true },
    { key: 'attack', displayName: 'Attack', isActive: false, group: 'Animations', duration: 0.9, hasSound: false, isInIdleCycle: false, isVisible: false },
  ],
}

const expressions = computed(() => MOCK_EXPRESSIONS[activeModelType.value])
const motions = computed(() => MOCK_MOTIONS[activeModelType.value])

type ActiveTab = 'expressions' | 'motions'
const activeTab = ref<ActiveTab>('expressions')

const showHidden = ref(false)
const filterRenamedOnly = ref(false)
const editingKey = ref<string | null>(null)
const editingValue = ref('')

const expressionsToRender = computed(() => {
  let list = showHidden.value ? expressions.value : expressions.value.filter(e => e.isVisible)
  if (filterRenamedOnly.value) {
    list = list.filter(e => e.displayName !== e.key)
  }
  return list
})

const motionsToRender = computed(() => {
  const groups = new Map<string, UnifiedMotion[]>()
  for (const m of motions.value) {
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

const currentListCount = computed(() =>
  activeTab.value === 'expressions' ? expressions.value.length : motions.value.length,
)

function toggleExpression(key: string) {
  const exp = expressions.value.find(e => e.key === key)
  if (exp)
    exp.isActive = !exp.isActive
}

function toggleMotion(key: string) {
  const mot = motions.value.find(m => m.key === key)
  if (mot)
    mot.isActive = !mot.isActive
}

function toggleIdleCycle(key: string) {
  const mot = motions.value.find(m => m.key === key)
  if (mot)
    mot.isInIdleCycle = !mot.isInIdleCycle
}

function toggleVisibility(items: { key: string, isVisible: boolean }[], key: string) {
  const item = items.find(i => i.key === key)
  if (item)
    item.isVisible = !item.isVisible
}

function isHidden(items: { key: string, isVisible: boolean }[], key: string) {
  return !items.find(i => i.key === key)?.isVisible
}

function startEditing(key: string) {
  const exp = expressions.value.find(e => e.key === key)
  const mot = motions.value.find(m => m.key === key)
  editingKey.value = key
  editingValue.value = exp?.displayName || mot?.displayName || ''
}

function saveEdits(key: string) {
  const exp = expressions.value.find(e => e.key === key)
  const mot = motions.value.find(m => m.key === key)
  if (exp)
    exp.displayName = editingValue.value.trim() || key
  if (mot)
    mot.displayName = editingValue.value.trim() || key
  editingKey.value = null
  editingValue.value = ''
}

function cancelEditing() {
  editingKey.value = null
  editingValue.value = ''
}

function resetAll() {
  if (activeTab.value === 'expressions') {
    expressions.value.forEach(e => e.isActive = false)
  }
  else {
    motions.value.forEach(m => m.isActive = false)
  }
}

const modelTypeLabels: { type: ModelType, label: string, icon: string }[] = [
  { type: 'live2d', label: 'Live2D', icon: 'i-solar:face-scan-circle-bold-duotone' },
  { type: 'vrm', label: 'VRM', icon: 'i-solar:cube-bold-duotone' },
  { type: 'mmd', label: 'MMD', icon: 'i-solar:stars-minimalistic-bold-duotone' },
  { type: 'spine', label: 'Spine', icon: 'i-solar:widget-4-bold-duotone' },
]

const ACT_MAPPING_TARGET = ref<string | null>(null)

function openActMapping(key: string) {
  ACT_MAPPING_TARGET.value = key
}

function assignActMapping(actEmotion: string) {
  if (!ACT_MAPPING_TARGET.value)
    return
  const exp = expressions.value.find(e => e.key === ACT_MAPPING_TARGET.value)
  if (exp)
    exp.actMapping = actEmotion
  ACT_MAPPING_TARGET.value = null
}

function clearActMapping() {
  if (!ACT_MAPPING_TARGET.value)
    return
  const exp = expressions.value.find(e => e.key === ACT_MAPPING_TARGET.value)
  if (exp)
    exp.actMapping = undefined
  ACT_MAPPING_TARGET.value = null
}

function toggleFavorite(key: string) {
  const exp = expressions.value.find(e => e.key === key)
  if (exp)
    exp.isFavorite = !exp.isFavorite
}
</script>

<template>
  <div class="h-full w-full flex flex-col overflow-hidden bg-white dark:bg-neutral-900/10">
    <!-- Header -->
    <div class="shrink-0 p-4 pb-2">
      <h3 class="text-sm text-neutral-800 font-bold dark:text-neutral-200">
        Rehearsal Room
      </h3>
      <p class="mt-0.5 text-[10px] text-neutral-500">
        Prototype unified expression &amp; motion control. Switch model types via the debug bar below.
      </p>
    </div>

    <!-- Debug Model Type Switcher -->
    <div class="shrink-0 px-4 pb-1">
      <div class="mb-1 text-[10px] text-neutral-400 font-bold tracking-wider uppercase">
        Debug: Model Type
      </div>
      <div class="flex gap-1">
        <button
          v-for="mt in modelTypeLabels"
          :key="mt.type"
          class="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
          :class="activeModelType === mt.type
            ? 'bg-primary-500/15 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 ring-1 ring-primary-500/20'
            : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'"
          @click="activeModelType = mt.type"
        >
          <div :class="[mt.icon, 'text-sm']" />
          {{ mt.label }}
        </button>
      </div>
    </div>

    <!-- Segment Toggle: Expressions / Motions -->
    <div class="shrink-0 px-4 pb-1 pt-3">
      <div class="flex rounded-lg bg-neutral-100 p-0.5 dark:bg-neutral-800">
        <button
          class="flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
          :class="activeTab === 'expressions'
            ? 'bg-white text-neutral-800 shadow-sm dark:bg-neutral-700 dark:text-neutral-100'
            : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'"
          @click="activeTab = 'expressions'"
        >
          Expressions
        </button>
        <button
          class="flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
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
        <span class="ml-1 font-normal opacity-60">({{ currentListCount }})</span>
      </span>
      <div class="flex gap-1">
        <button
          class="rounded-md px-2 py-0.5 text-[10px] transition-colors"
          :class="showHidden
            ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
            : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'"
          @click="showHidden = !showHidden"
        >
          {{ showHidden ? 'Show All' : 'Show Hidden' }}
        </button>
        <button
          class="rounded-md px-2 py-0.5 text-[10px] transition-colors"
          :class="filterRenamedOnly
            ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
            : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'"
          @click="filterRenamedOnly = !filterRenamedOnly"
        >
          {{ filterRenamedOnly ? 'Renamed Only' : 'All' }}
        </button>
        <button
          class="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-500 transition-colors dark:bg-neutral-800 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-700"
          @click="resetAll"
        >
          Reset
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
            <div class="min-w-0 flex flex-1 cursor-pointer items-center gap-2" @click="toggleExpression(exp.key)">
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
                    @keydown.esc="cancelEditing"
                  >
                </template>
                <template v-else>
                  <span class="block truncate text-sm text-neutral-900 font-medium dark:text-neutral-100">
                    <span v-if="exp.isFavorite" class="mr-0.5" title="Favorite">⭐</span>
                    {{ exp.displayName }}
                    <span
                      v-if="exp.actMapping"
                      class="ml-1 text-[10px] opacity-60"
                      :title="`ACT: ${exp.actMapping}`"
                    >{{ ACT_EMOJI[exp.actMapping] || '🔗' }}</span>
                    <span
                      v-if="exp.category"
                      class="ml-1 rounded bg-neutral-100 px-1 py-px text-[9px] text-neutral-400 dark:bg-neutral-700 dark:text-neutral-500"
                    >{{ exp.category }}</span>
                  </span>
                </template>
                <span class="text-[10px] text-neutral-400">{{ exp.key }}</span>
              </div>
            </div>

            <!-- Right: Actions -->
            <div class="ml-2 flex shrink-0 items-center gap-0.5">
              <!-- ACT Mapping -->
              <button
                class="rounded p-1 transition-colors"
                :class="exp.actMapping
                  ? 'text-primary-500 hover:text-primary-600 bg-primary-500/10'
                  : 'text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-700'"
                :title="exp.actMapping ? `ACT: ${exp.actMapping}` : 'Map to ACT emotion'"
                @click.stop="openActMapping(exp.key)"
              >
                <div class="i-solar:magic-stick-3-bold-duotone text-sm" />
              </button>
              <!-- Favorite -->
              <button
                class="rounded p-1 transition-colors"
                :class="exp.isFavorite
                  ? 'text-amber-500 hover:text-amber-600 bg-amber-500/10'
                  : 'text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-700'"
                :title="exp.isFavorite ? 'Remove favorite' : 'Set as favorite'"
                @click.stop="toggleFavorite(exp.key)"
              >
                <div :class="exp.isFavorite ? 'i-solar:star-bold-duotone' : 'i-solar:star-linear'" class="text-sm" />
              </button>
              <!-- Rename -->
              <button
                class="rounded p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:bg-neutral-700"
                title="Rename"
                @click.stop="startEditing(exp.key)"
              >
                <div class="i-solar:pen-bold-duotone text-sm" />
              </button>
              <!-- Visibility -->
              <button
                class="rounded p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:bg-neutral-700"
                :title="isHidden(expressions, exp.key) ? 'Show' : 'Hide'"
                @click.stop="toggleVisibility(expressions, exp.key)"
              >
                <div :class="isHidden(expressions, exp.key) ? 'i-solar:eye-closed-bold-duotone' : 'i-solar:eye-bold-duotone'" class="text-sm" />
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- ====== MOTIONS LIST ====== -->
      <template v-else>
        <div v-if="motionsToRender.size === 0" class="py-8 text-center text-xs text-neutral-400">
          No motions available for {{ activeModelType.toUpperCase() }}.
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
              <!-- Left: Active dot + name + duration -->
              <div class="min-w-0 flex flex-1 cursor-pointer items-center gap-2" @click="toggleMotion(mot.key)">
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
                      @keydown.esc="cancelEditing"
                    >
                  </template>
                  <template v-else>
                    <span class="block truncate text-sm text-neutral-900 font-medium dark:text-neutral-100">
                      {{ mot.displayName }}
                    </span>
                  </template>
                  <span class="text-[10px] text-neutral-400">{{ mot.key }}</span>
                </div>
                <span class="shrink-0 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500 font-mono dark:bg-neutral-800 dark:text-neutral-400">
                  {{ mot.duration.toFixed(1) }}s
                </span>
                <div
                  v-if="activeModelType === 'live2d' && mot.hasSound"
                  class="i-solar:music-notes-bold-duotone shrink-0 text-[10px] text-primary-400"
                  title="Has audio"
                />
              </div>

              <!-- Right: Actions -->
              <div class="ml-2 flex shrink-0 items-center gap-0.5">
                <!-- Idle Cycle -->
                <button
                  class="rounded p-1 transition-colors"
                  :class="mot.isInIdleCycle
                    ? 'text-primary-500 hover:text-primary-600 bg-primary-500/10'
                    : 'text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-700'"
                  :title="mot.isInIdleCycle ? 'Remove from Idle Cycle' : 'Add to Idle Cycle'"
                  @click.stop="toggleIdleCycle(mot.key)"
                >
                  <div class="i-solar:infinity-bold-duotone text-sm" />
                </button>
                <!-- Rename -->
                <button
                  class="rounded p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:bg-neutral-700"
                  title="Rename"
                  @click.stop="startEditing(mot.key)"
                >
                  <div class="i-solar:pen-bold-duotone text-sm" />
                </button>
                <!-- Visibility -->
                <button
                  class="rounded p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:bg-neutral-700"
                  :title="isHidden(motions, mot.key) ? 'Show' : 'Hide'"
                  @click.stop="toggleVisibility(motions, mot.key)"
                >
                  <div :class="isHidden(motions, mot.key) ? 'i-solar:eye-closed-bold-duotone' : 'i-solar:eye-bold-duotone'" class="text-sm" />
                </button>
              </div>
            </div>
          </div>
        </template>
      </template>
    </div>

    <!-- ACT Mapping Modal -->
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
              <div class="mt-1 rounded-md bg-neutral-100 px-3 py-1 text-xs text-primary-500 font-mono dark:bg-neutral-800">
                {{ ACT_MAPPING_TARGET }}
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="emotion in ACT_EMOTIONS"
                :key="emotion"
                class="border rounded-lg border-solid px-3 py-2 text-sm transition-all"
                :class="expressions.find(e => e.key === ACT_MAPPING_TARGET)?.actMapping === emotion
                  ? 'bg-primary-500/20 border-primary-400 text-primary-600 dark:text-primary-300 font-medium'
                  : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'"
                @click="assignActMapping(emotion)"
              >
                {{ ACT_EMOJI[emotion] }} {{ emotion }}
              </button>
            </div>
            <div class="mt-3 flex gap-2">
              <button
                class="flex-1 border border-red-300 rounded-lg border-solid bg-red-50 px-3 py-1.5 text-xs text-red-600 transition-colors dark:border-red-800 dark:bg-red-900/30 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50"
                @click="clearActMapping"
              >
                Clear Mapping
              </button>
              <button
                class="flex-1 border border-neutral-200 rounded-lg border-solid bg-neutral-50 px-3 py-1.5 text-xs text-neutral-600 transition-colors dark:border-neutral-700 dark:bg-neutral-800 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
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
