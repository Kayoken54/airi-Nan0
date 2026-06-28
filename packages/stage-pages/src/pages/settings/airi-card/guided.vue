<script setup lang="ts">
import { ModelSelectorDialog } from '@proj-airi/stage-ui/components/scenarios/dialogs/model-selector'
import { useAnimaDexWizardStore } from '@proj-airi/stage-ui/stores/animadex-wizard'
import { useDisplayModelsStore } from '@proj-airi/stage-ui/stores/display-models'
import { useLLM } from '@proj-airi/stage-ui/stores/llm'
import { useAiriCardStore } from '@proj-airi/stage-ui/stores/modules/airi-card'
import { useConsciousnessStore } from '@proj-airi/stage-ui/stores/modules/consciousness'
import { useSpeechStore } from '@proj-airi/stage-ui/stores/modules/speech'
import { useProvidersStore } from '@proj-airi/stage-ui/stores/providers'
import { Button } from '@proj-airi/ui'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

const router = useRouter()
const wizardStore = useAnimaDexWizardStore()
const airiCardStore = useAiriCardStore()
const llmStore = useLLM()
const consciousnessStore = useConsciousnessStore()
const providersStore = useProvidersStore()
const displayModelsStore = useDisplayModelsStore()
const speechStore = useSpeechStore()

const {
  catalogLoaded,
  selectedCharacters,
  currentStep,
  storyPrompt,
  isGenerating,
  selectedGender,
  selectedChips,
  searchQuery,
  suggestions,
  filteredCharacters,
  boundModels,
  boundVoices,
  copyrights,
} = storeToRefs(wizardStore)

// Local UI state
const isSearchFocused = ref(false)
const displayLimit = ref(60) // Paginate/limit grid size for performance

// Model & Voice Selector state
const activeBindingCharacterId = ref<string | null>(null)
const modelSelectorOpen = ref(false)
const voiceCreatorOpen = ref(false)
const voiceTargetCharacterId = ref<string | null>(null)

const activeBindingCharacterModel = computed(() => {
  if (!activeBindingCharacterId.value)
    return undefined
  const boundId = boundModels.value[activeBindingCharacterId.value]
  if (!boundId)
    return undefined
  return displayModelsStore.displayModels.find(m => m.id === boundId)
})

onMounted(async () => {
  await wizardStore.loadCatalog()
})

// Reset scroll pagination when search or chips change
watch([searchQuery, selectedChips, selectedGender], () => {
  displayLimit.value = 60
})

// Infinite scroll helper
function loadMore() {
  displayLimit.value += 60
}

function handleScroll(e: Event) {
  const target = e.target as HTMLElement
  if (target.scrollHeight - target.scrollTop <= target.clientHeight + 100) {
    loadMore()
  }
}

// Autocomplete actions
function selectSuggestion(item: any) {
  if (item.type === 'character') {
    // Add character directly to basket
    const char = wizardStore.characters.find(c => c.name === item.label)
    if (char) {
      wizardStore.addCharacterToBasket(char)
      toast.success(`Added ${char.name} to cast`)
    }
  }
  else {
    // Add filter chip
    wizardStore.addChip(item.type, item.label)
  }
  searchQuery.value = ''
  isSearchFocused.value = false
}

// Add raw text tag on Enter
function handleSearchEnter() {
  const query = searchQuery.value.trim()
  if (query) {
    wizardStore.addChip('tag', query)
    searchQuery.value = ''
    isSearchFocused.value = false
  }
}

// Thumbnail resolver
function getThumbUrl(trigger: string) {
  // Replace invalid filename characters (Windows/OS forbidden characters) with '_'
  let clean = trigger.replace(/[/\\:*?"<>|]/g, '_')
  // Strip trailing periods to prevent double periods with extension (e.g. 'inc..webp' -> 'inc.webp')
  if (clean.endsWith('.')) {
    clean = clean.slice(0, -1)
  }
  return `https://blobs.animadex.net/Outputs/thumbs/${encodeURIComponent(clean)}.webp`
}

// Navigation helpers
function handleBack() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
  else {
    wizardStore.resetWizard()
    router.push('/settings/airi-card')
  }
}

function handleNext() {
  if (currentStep.value === 1 && selectedCharacters.value.length > 0) {
    currentStep.value = 2
  }
  else if (currentStep.value === 2) {
    currentStep.value = 3
  }
}

function openModelSelector(characterId: string) {
  activeBindingCharacterId.value = characterId
  modelSelectorOpen.value = true
}

function handlePickModel(model: any) {
  if (activeBindingCharacterId.value) {
    wizardStore.bindModelToCharacter(activeBindingCharacterId.value, model?.id || '')
  }
}

function getBoundModel(characterId: string) {
  const modelId = boundModels.value[characterId]
  if (!modelId)
    return undefined
  return displayModelsStore.displayModels.find(m => m.id === modelId)
}

// Card Synthesis Pipeline
async function handleGenerate() {
  isGenerating.value = true
  currentStep.value = 3

  try {
    const activeModel = consciousnessStore.activeModel
    const activeProviderName = consciousnessStore.activeProvider
    if (!activeModel || !activeProviderName) {
      throw new Error('No active LLM model or provider configured. Please check your AI Settings.')
    }

    const providerInstance = await providersStore.getProviderInstance(activeProviderName)
    if (!providerInstance) {
      throw new Error('Failed to retrieve active provider instance.')
    }

    // Build cast metadata
    const castInfo = selectedCharacters.value.map((c) => {
      const series = wizardStore.copyrights[c.copyrightIndex] || 'Unknown Series'
      return `- Name: ${c.name}\n  Series: ${series}\n  Trigger Words: ${c.trigger}\n  Tags: ${c.tags}`
    }).join('\n\n')

    // Construct Synthesis Prompts
    const systemInstruction = `You are a premium character and roleplay scenario synthesizer for a Virtual AI companion platform.
Your task is to take the selected character cast details and the user's custom story setting, and compile them into a high-fidelity roleplay card configuration.
You MUST output ONLY a valid raw JSON object matching the schema below. Do not wrap in markdown code blocks (\`\`\`json). Do not add introductory or trailing conversational text.

JSON Schema format:
{
  "name": "Name of the World / Setting or Character",
  "system_prompt": "Detailed multi-paragraph roleplay prompt setting the scene. Describe the characters' appearance, personality traits, and default behaviors contextually to the setting. Define how they interact with each other and the user (referred to as {{user}} or '${storyPrompt.value.nickname || 'User'}').",
  "first_mes": "Lively first message/greeting from one or more characters to kickstart the roleplay, written in-character, using asterisks for actions.",
  "alternate_greetings": [
    "First alternative greeting option",
    "Second alternative greeting option"
  ]
}`

    const userPrompt = `Characters Cast Roster:\n${castInfo}\n\nUser Story Settings:\n- Setting / Location: ${storyPrompt.value.setting || 'A cozy matching lounge'}\n- User Nickname: ${storyPrompt.value.nickname || 'Companion'}\n- Lore / Behavior Rules: ${storyPrompt.value.lore || 'Follow canon personalities and themes'}`

    const messages = [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userPrompt },
    ]

    const response = await llmStore.generate(activeModel, providerInstance as any, messages as any)
    const jsonText = response.text?.trim() || ''

    // Clean JSON of any code blocks if LLM outputted them anyway
    const cleanJsonText = jsonText.replace(/^```json\s*/i, '').replace(/```$/, '').trim()
    const parsedCard = JSON.parse(cleanJsonText)

    if (!parsedCard.name || !parsedCard.system_prompt) {
      throw new Error('Synthesized card data did not return correct fields.')
    }

    // Setup visual avatar from first cast member
    const avatarUrl = getThumbUrl(selectedCharacters.value[0].trigger)

    // Build AiriCard V2 structure
    const newCard = {
      id: '', // Will be assigned by addCard
      name: parsedCard.name,
      avatarUrl,
      data: {
        name: parsedCard.name,
        description: selectedCharacters.value.map(c => c.name).join(', '),
        personality: selectedCharacters.value.map(c => c.trigger).join(' | '),
        scenario: storyPrompt.value.setting || 'Unified setting',
        first_mes: parsedCard.first_mes,
        mes_example: [],
        system_prompt: parsedCard.system_prompt,
        creator_notes: 'Synthesized via AnimaDex guided wizard.',
        alternate_greetings: parsedCard.alternate_greetings || [],
        extensions: {
          airi: {
            modules: {
              activeBackgroundId: undefined,
            },
          },
        },
      },
    }

    await airiCardStore.addCard(newCard as any)
    toast.success(`Successfully synthesized "${parsedCard.name}"!`)
    wizardStore.resetWizard()
    router.push('/settings/airi-card')
  }
  catch (error: any) {
    console.error('[AnimaDexWizard] Synthesis error:', error)
    toast.error(`Synthesis failed: ${error.message || 'Check logs for details.'}`)
    currentStep.value = 2 // Let user try again or review prompts
  }
  finally {
    isGenerating.value = false
  }
}
</script>

<template>
  <div class="h-screen flex flex-col select-none bg-neutral-950 text-neutral-200">
    <!-- Header -->
    <header class="flex items-center justify-between border-b border-neutral-800/60 bg-neutral-900/40 px-6 py-4 backdrop-blur-md">
      <div class="flex items-center gap-3">
        <Button
          variant="ghost"
          class="border border-neutral-800 rounded-xl p-2 hover:bg-neutral-800/50"
          @click="handleBack"
        >
          <div i-solar:arrow-left-outline class="text-lg" />
        </Button>
        <div>
          <h2 class="flex items-center gap-2 text-lg text-neutral-100 font-bold">
            <div i-solar:magic-stick-3-line-duotone class="text-primary-500" />
            AnimaDex Guided Creator
          </h2>
          <p class="text-xs text-neutral-500">
            AI-driven multi-character world builder
          </p>
        </div>
      </div>

      <!-- Step Indicator -->
      <div class="mr-4 flex items-center gap-2 text-xs font-semibold">
        <span :class="[currentStep >= 1 ? 'text-primary-500' : 'text-neutral-600']">1. Cast Selection</span>
        <div i-solar:alt-arrow-right-line-duotone class="text-neutral-700" />
        <span :class="[currentStep >= 2 ? 'text-primary-500' : 'text-neutral-600']">2. Roster Settings</span>
        <div i-solar:alt-arrow-right-line-duotone class="text-neutral-700" />
        <span :class="[currentStep >= 3 ? 'text-primary-500' : 'text-neutral-600']">3. Story Prompts</span>
        <div i-solar:alt-arrow-right-line-duotone class="text-neutral-700" />
        <span :class="[currentStep >= 4 ? 'text-primary-500' : 'text-neutral-600']">4. LLM Synthesis</span>
      </div>
    </header>

    <!-- Content loading state -->
    <div v-if="!catalogLoaded" class="flex flex-1 flex-col items-center justify-center gap-3">
      <div class="h-8 w-8 animate-spin border-2 border-primary-500 border-t-transparent rounded-full" />
      <span class="text-sm text-neutral-500">Loading catalog database...</span>
    </div>

    <!-- main workspace -->
    <main v-else class="relative flex flex-1 flex-col overflow-hidden">
      <!-- STEP 1: CAST SELECTION -->
      <div v-if="currentStep === 1" class="flex flex-1 flex-col overflow-hidden">
        <!-- Search & Filter Bar -->
        <div class="z-20 flex flex-col gap-4 border-b border-neutral-900/60 bg-neutral-950 p-6">
          <div class="relative mx-auto max-w-2xl w-full">
            <div class="relative flex items-center border border-neutral-800 rounded-xl bg-neutral-900/40 px-4 transition-all duration-300 focus-within:border-primary-500">
              <div i-solar:magnifer-linear class="mr-3 text-lg text-neutral-500" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search characters by name, series, or tags (e.g. 'blonde hair')..."
                class="flex-1 border-none bg-transparent py-3 text-sm text-neutral-200 outline-none placeholder-neutral-500"
                @focus="isSearchFocused = true"
                @keydown.enter="handleSearchEnter"
              >
              <button
                v-if="searchQuery"
                class="p-1 text-neutral-500 hover:text-neutral-300"
                @click="searchQuery = ''"
              >
                <div i-solar:close-circle-bold class="text-base" />
              </button>
            </div>

            <!-- Autocomplete suggestions dropdown -->
            <transition name="fade">
              <div
                v-if="isSearchFocused && suggestions.length > 0"
                class="absolute left-0 right-0 z-30 mt-2 max-h-[300px] overflow-y-auto border border-neutral-800 rounded-xl bg-neutral-900/95 shadow-2xl backdrop-blur-md"
              >
                <div
                  v-for="(item, idx) in suggestions"
                  :key="idx"
                  class="flex cursor-pointer items-center justify-between border-b border-neutral-800/30 px-4 py-2.5 transition-colors last:border-none hover:bg-neutral-800/60"
                  @mousedown="selectSuggestion(item)"
                >
                  <div class="flex items-center gap-2">
                    <span v-if="item.type === 'tag'" class="text-xs text-neutral-500">🏷️ Tag:</span>
                    <span v-else-if="item.type === 'copyright'" class="text-xs text-neutral-500">🎬 Series:</span>
                    <span v-else-if="item.type === 'character'" class="text-xs text-neutral-500">👤 Character:</span>
                    <span class="text-sm text-neutral-200 font-medium">{{ item.label }}</span>
                  </div>
                  <span v-if="item.extra" class="text-xs text-neutral-500 font-normal italic">
                    {{ item.extra }}
                  </span>
                </div>
              </div>
            </transition>
          </div>

          <!-- Active Chip Filters -->
          <div v-if="selectedChips.length > 0" class="mx-auto max-w-2xl w-full flex flex-wrap items-center gap-2">
            <span class="mr-1 text-xs text-neutral-500 font-bold tracking-wider uppercase">Active filters:</span>
            <div
              v-for="(chip, index) in selectedChips"
              :key="index"
              class="flex items-center gap-1 border border-primary-500/30 rounded-lg bg-primary-500/5 px-2.5 py-1 text-xs text-primary-400 font-medium"
            >
              <span class="text-[10px] capitalize opacity-70">{{ chip.type }}:</span>
              <span>{{ chip.value }}</span>
              <button class="ml-1 hover:text-white" @click="wizardStore.removeChip(index)">
                <div i-solar:close-circle-bold class="text-xs" />
              </button>
            </div>
          </div>

          <!-- Root Gender Selector Row -->
          <div class="mt-1 flex items-center justify-center gap-2.5">
            <span class="mr-2 text-xs text-neutral-500 font-bold tracking-wider uppercase">Gender:</span>
            <Button
              v-for="g in ['All', 'Female', 'Male', 'Ambiguous', 'Non-Human']"
              :key="g"
              :variant="selectedGender === (g === 'All' ? null : g) ? 'primary' : 'secondary'"
              class="h-[30px] border border-neutral-800 rounded-lg px-3.5 text-xs"
              @click="wizardStore.setGender(g === 'All' ? null : g)"
            >
              {{ g }}
            </Button>
          </div>
        </div>

        <!-- Scrollable Character Grid -->
        <div class="flex-1 overflow-y-auto p-6" @scroll="handleScroll">
          <div v-if="filteredCharacters.length === 0" class="h-full flex flex-col items-center justify-center text-neutral-500">
            <div i-solar:sad-ellipse-line-duotone class="mb-2 text-5xl text-neutral-700" />
            <span class="text-sm">No matching characters found in catalog.</span>
          </div>

          <div v-else class="grid grid-cols-2 gap-5 lg:grid-cols-5 md:grid-cols-4 sm:grid-cols-3 xl:grid-cols-6">
            <div
              v-for="char in filteredCharacters.slice(0, displayLimit)"
              :key="char.id"
              class="group relative flex flex-col overflow-hidden border border-neutral-900 rounded-2xl bg-neutral-900/20 transition-all duration-300 hover:border-neutral-800"
            >
              <!-- Card Portrait Image -->
              <div class="relative aspect-[3/4] overflow-hidden bg-neutral-900">
                <img
                  :src="getThumbUrl(char.trigger)"
                  alt=""
                  loading="lazy"
                  class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                >

                <!-- Selection Status Badge -->
                <div
                  v-if="selectedCharacters.some(c => c.id === char.id)"
                  class="absolute right-2 top-2 rounded-full bg-primary-500 p-1 text-white shadow-lg"
                >
                  <div i-solar:check-circle-bold class="text-sm" />
                </div>

                <!-- Hover action overlay -->
                <div class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
                  <Button
                    v-if="!selectedCharacters.some(c => c.id === char.id)"
                    variant="primary"
                    class="h-[36px] flex items-center gap-1 border border-primary-500/20 rounded-xl text-xs font-bold"
                    @click="wizardStore.addCharacterToBasket(char)"
                  >
                    <div i-solar:add-square-line-duotone class="text-base" />
                    Add to World
                  </Button>
                  <Button
                    v-else
                    variant="danger"
                    class="h-[36px] flex items-center gap-1 border border-red-500/20 rounded-xl text-xs font-bold"
                    @click="wizardStore.removeCharacterFromBasket(char.id)"
                  >
                    <div i-solar:trash-bin-trash-outline class="text-base" />
                    Remove
                  </Button>
                </div>
              </div>

              <!-- Name Details -->
              <div class="flex flex-1 flex-col justify-between bg-neutral-950 p-3.5">
                <h4 class="line-clamp-1 text-xs text-neutral-200 font-bold transition-colors group-hover:text-primary-400">
                  {{ char.name }}
                </h4>
                <p class="line-clamp-1 mt-0.5 text-[10px] text-neutral-500 italic">
                  {{ wizardStore.copyrights[char.copyrightIndex] || 'Original' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Persistent World Dock (Hotbar) -->
        <transition name="slide-up">
          <div
            v-if="selectedCharacters.length > 0"
            class="sticky bottom-0 left-0 right-0 z-30 flex items-center justify-between border-t border-neutral-800 bg-neutral-950/90 px-6 py-4 backdrop-blur-lg"
          >
            <div class="flex items-center gap-4">
              <div class="flex flex-col">
                <span class="text-xs text-neutral-400 font-bold tracking-wider uppercase">World Cast</span>
                <span class="text-[10px] text-neutral-500">{{ selectedCharacters.length }} characters selected</span>
              </div>

              <!-- Cast avatars -->
              <div class="max-w-[50vw] flex items-center gap-2 overflow-x-auto py-1">
                <div
                  v-for="char in selectedCharacters"
                  :key="char.id"
                  class="group relative h-10 w-10 flex-shrink-0 cursor-pointer overflow-hidden border border-neutral-800 rounded-full transition-colors hover:border-red-500"
                  :title="`Remove ${char.name}`"
                  @click="wizardStore.removeCharacterFromBasket(char.id)"
                >
                  <img :src="getThumbUrl(char.trigger)" alt="" class="h-full w-full object-cover">
                  <div class="absolute inset-0 flex items-center justify-center bg-red-600/60 opacity-0 transition-opacity group-hover:opacity-100">
                    <div i-solar:trash-bin-trash-bold class="text-xs text-white" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Next Action -->
            <Button
              variant="primary"
              class="h-[40px] flex items-center gap-1.5 border border-primary-500/20 rounded-xl px-5 text-xs font-bold shadow-lg shadow-primary-500/10"
              @click="handleNext"
            >
              Next: Align Roster
              <div i-solar:alt-arrow-right-bold class="text-base" />
            </Button>
          </div>
        </transition>
      </div>

      <!-- STEP 2: ROSTER SETTINGS (MODEL & VOICE BINDING) -->
      <div v-else-if="currentStep === 2" class="flex flex-1 flex-col items-center overflow-y-auto bg-neutral-950 p-6">
        <div class="max-w-4xl w-full border border-neutral-900 rounded-2xl bg-neutral-900/20 p-8 shadow-xl">
          <h3 class="mb-6 flex items-center gap-2 text-lg text-neutral-200 font-bold">
            <div i-solar:user-circle-bold-duotone class="text-primary-500" />
            Actor Alignment (Visual & Audio Settings)
          </h3>

          <div class="flex flex-col gap-4">
            <!-- Row per character -->
            <div
              v-for="char in selectedCharacters"
              :key="char.id"
              class="flex flex-col justify-between gap-4 border border-neutral-800 rounded-2xl bg-neutral-900/40 p-5 md:flex-row md:items-center"
            >
              <!-- Left Column: Character card thumb + name -->
              <div class="min-w-[200px] flex items-center gap-3.5">
                <div class="h-14 w-14 overflow-hidden border border-neutral-800 rounded-full bg-neutral-900">
                  <img :src="getThumbUrl(char.trigger)" alt="" class="h-full w-full object-cover">
                </div>
                <div class="min-w-0 flex flex-col">
                  <span class="truncate text-sm text-neutral-100 font-bold">{{ char.name }}</span>
                  <span class="truncate text-xs text-neutral-500 italic">
                    {{ copyrights[char.copyrightIndex] || 'Original' }}
                  </span>
                </div>
              </div>

              <!-- Center Column: Visual Model Selector -->
              <div class="min-w-[240px] flex flex-col gap-2">
                <label class="text-[10px] text-neutral-500 font-bold tracking-wider uppercase">Visual Model / Avatar</label>
                <div
                  class="flex cursor-pointer items-center justify-between border border-neutral-800 rounded-xl bg-neutral-950/40 p-2.5 transition-colors hover:border-neutral-700"
                  @click="openModelSelector(char.id)"
                >
                  <div class="flex items-center gap-3 overflow-hidden">
                    <div class="h-10 w-10 flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-900">
                      <img
                        v-if="getBoundModel(char.id)?.previewImage"
                        :src="getBoundModel(char.id)?.previewImage"
                        class="h-full w-full object-cover"
                      >
                      <div v-else class="i-solar:gallery-bold text-lg text-neutral-600" />
                    </div>
                    <div class="min-w-0 flex flex-col">
                      <span class="truncate text-xs text-neutral-200 font-semibold">
                        {{ getBoundModel(char.id)?.name || 'LLM Only (No Avatar)' }}
                      </span>
                      <span
                        v-if="getBoundModel(char.id)"
                        class="mt-0.5 self-start rounded bg-primary-500/10 px-1.5 py-0.2 text-[8px] text-primary-500 font-bold uppercase"
                      >
                        {{ getBoundModel(char.id)?.format.toLowerCase().includes('live2d') ? 'Live2D' : 'VRM' }}
                      </span>
                    </div>
                  </div>
                  <div i-solar:gallery-send-bold-duotone class="mr-1 text-sm text-neutral-500" />
                </div>
              </div>

              <!-- Right Column: Speech Voice Selector -->
              <div class="min-w-[240px] flex flex-col gap-2">
                <label class="text-[10px] text-neutral-500 font-bold tracking-wider uppercase">TTS Speech Voice</label>
                <div class="flex items-center gap-2">
                  <!-- Select dropdown or current voice -->
                  <div class="flex flex-1 items-center justify-between border border-neutral-800 rounded-xl bg-neutral-950/40 p-2.5">
                    <div class="min-w-0 flex items-center gap-2">
                      <div i-solar:music-bold class="shrink-0 text-sm text-neutral-600" />
                      <span class="truncate text-xs text-neutral-200">
                        {{ boundVoices[char.id] ? speechStore.savedVoiceProfiles.find(p => p.id === boundVoices[char.id])?.name || 'Default Voice' : 'Inherit Default' }}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    class="h-[40px] w-[40px] border border-neutral-800 rounded-xl p-0 hover:bg-neutral-800/40"
                    title="Configure Custom Voice"
                    @click="voiceCreatorOpen = true; voiceTargetCharacterId = char.id"
                  >
                    <div i-solar:settings-bold-duotone class="text-sm text-neutral-400" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Actions -->
          <div class="mt-8 flex items-center justify-between border-t border-neutral-800/60 pt-6">
            <Button
              variant="secondary"
              class="h-[38px] flex items-center gap-1.5 border border-neutral-800 rounded-xl px-4 text-xs font-bold"
              @click="currentStep = 1"
            >
              <div i-solar:alt-arrow-left-bold class="text-base" />
              Back
            </Button>

            <Button
              variant="primary"
              class="h-[38px] flex items-center gap-1.5 border border-primary-500/20 rounded-xl px-5 text-xs font-bold shadow-lg shadow-primary-500/10"
              @click="handleNext"
            >
              Next: Configure Story
              <div i-solar:alt-arrow-right-bold class="text-base" />
            </Button>
          </div>
        </div>
      </div>

      <!-- STEP 3: CONTEXT & STORY PROMPTS -->
      <div v-else-if="currentStep === 3" class="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-neutral-950 p-6">
        <div class="max-w-xl w-full border border-neutral-900 rounded-2xl bg-neutral-900/20 p-8 shadow-xl">
          <h3 class="mb-6 flex items-center gap-2 text-lg text-neutral-200 font-bold">
            <div i-solar:clipboard-text-line-duotone class="text-primary-500" />
            Outline Your Story Settings
          </h3>

          <div class="flex flex-col gap-5">
            <!-- Setting / Location -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs text-neutral-400 font-bold tracking-wider uppercase">Where does this take place?</label>
              <textarea
                v-model="storyPrompt.setting"
                placeholder="Leave blank to let the AI suggest a fitting location (e.g., 'A rainy cafe in Tokyo', 'A fantasy medieval tavern')."
                class="h-[60px] w-full resize-none border border-neutral-800 rounded-xl bg-neutral-900/60 px-4 py-2.5 text-sm text-neutral-200 outline-none transition-all focus:border-primary-500 placeholder-neutral-600"
              />
            </div>

            <!-- User Nickname -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs text-neutral-400 font-bold tracking-wider uppercase">What should the characters call you?</label>
              <input
                v-model="storyPrompt.nickname"
                type="text"
                placeholder="Leave blank for the AI to choose a name (e.g., 'Master', 'Detective', 'Stranger')."
                class="w-full border border-neutral-800 rounded-xl bg-neutral-900/60 px-4 py-2.5 text-sm text-neutral-200 outline-none transition-all focus:border-primary-500 placeholder-neutral-600"
              >
            </div>

            <!-- Lore / Rule overrides -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs text-neutral-400 font-bold tracking-wider uppercase">Lore & Behavior Rules</label>
              <textarea
                v-model="storyPrompt.lore"
                placeholder="Describe custom personality overrides or AU rules (e.g., 'Make them tsundere', 'Set in a school AU', 'Characters are rival musicians')."
                class="h-[80px] w-full resize-none border border-neutral-800 rounded-xl bg-neutral-900/60 px-4 py-2.5 text-sm text-neutral-200 outline-none transition-all focus:border-primary-500 placeholder-neutral-600"
              />
            </div>
          </div>

          <!-- Bottom Actions -->
          <div class="mt-8 flex items-center justify-between border-t border-neutral-800/60 pt-6">
            <Button
              variant="secondary"
              class="h-[38px] flex items-center gap-1.5 border border-neutral-800 rounded-xl px-4 text-xs font-bold"
              @click="currentStep = 2"
            >
              <div i-solar:alt-arrow-left-bold class="text-base" />
              Back
            </Button>

            <Button
              variant="primary"
              class="h-[38px] flex items-center gap-1.5 border border-primary-500/20 rounded-xl px-5 text-xs font-bold shadow-lg shadow-primary-500/10"
              @click="handleGenerate"
            >
              Generate Roleplay World
              <div i-solar:magic-stick-3-bold class="text-base" />
            </Button>
          </div>
        </div>
      </div>

      <!-- STEP 4: LLM SYNTHESIS (LOADING STATE) -->
      <div v-else-if="currentStep === 4" class="flex flex-1 flex-col items-center justify-center bg-neutral-950 p-6">
        <div class="max-w-md w-full flex flex-col items-center gap-5 text-center">
          <!-- Premium Glowing Loader -->
          <div class="relative flex items-center justify-center">
            <div class="absolute h-20 w-20 animate-pulse rounded-full bg-primary-500/20 blur-xl" />
            <div class="h-14 w-14 animate-spin border-4 border-primary-500 border-t-transparent rounded-full shadow-lg shadow-primary-500/30" />
          </div>

          <div>
            <h3 class="text-lg text-neutral-200 font-bold">
              Synthesizing Your World...
            </h3>
            <p class="mx-auto mt-1 max-w-xs text-xs text-neutral-500 leading-relaxed">
              AIRI is compiling the cast descriptions and your story outline. Generating system prompts and custom greetings...
            </p>
          </div>

          <!-- Progress Bar simulation -->
          <div class="h-2.5 w-full overflow-hidden border border-neutral-800 rounded-full bg-neutral-900">
            <div class="h-full w-[80%] animate-pulse rounded-full bg-primary-500" />
          </div>
        </div>
      </div>

      <!-- Dialog Components -->
      <ModelSelectorDialog
        v-model:show="modelSelectorOpen"
        :selected-model="activeBindingCharacterModel"
        @pick="handlePickModel"
      />
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
