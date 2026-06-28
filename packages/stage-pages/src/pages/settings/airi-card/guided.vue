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
import { Select } from '@proj-airi/ui/components/form'
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

const voicePresets = [
  { id: 'af_heart', name: 'Heart', gender: 'Female', accent: 'US', description: 'Conversational, warm, smiling tone, natural breathiness.' },
  { id: 'af_bella', name: 'Bella', gender: 'Female', accent: 'US', description: 'Polished, articulate, professional narration.' },
  { id: 'af_nicole', name: 'Nicole', gender: 'Female', accent: 'US', description: 'Soothing, whisper-soft, ASMR-style, noticeable vocal fry.' },
  { id: 'af_sky', name: 'Sky', gender: 'Female', accent: 'US', description: 'Youthful energy, clear, helpful assistant tone.' },
  { id: 'af_sarah', name: 'Sarah', gender: 'Female', accent: 'US', description: 'Standard narrator voice, balanced and neutral.' },
  { id: 'am_adam', name: 'Adam', gender: 'Male', accent: 'US', description: 'Clear, low-pitched, general-purpose male narrator.' },
  { id: 'am_echo', name: 'Echo', gender: 'Male', accent: 'US', description: 'Distinct, clear American male voice.' },
  { id: 'am_eric', name: 'Eric', gender: 'Male', accent: 'US', description: 'Polished corporate voice, excellent for instructions.' },
  { id: 'bf_emma', name: 'Emma', gender: 'Female', accent: 'UK', description: 'Gentle, friendly British female speaker.' },
  { id: 'bm_george', name: 'George', gender: 'Male', accent: 'UK', description: 'Rich, deep, professional British male voice.' },
]

const voiceForm = ref({
  name: '',
  baseProvider: 'kokoro-local',
  baseModel: '',
  baseVoice: 'af_heart',
  pitch: 1.0,
  rate: 1.0,
  filterByGender: true,
  testText: 'Hello! This is a preview of my new voice. How does it sound?',
})

const speechProviders = computed(() => {
  const list = [
    { value: 'kokoro-local', label: 'Kokoro TTS (Local)' },
    { value: 'virtual-audio-studio', label: 'Audio Studio (Saved Profiles)' },
  ]
  providersStore.configuredSpeechProvidersMetadata.forEach((meta) => {
    if (meta.id !== 'kokoro-local' && meta.id !== 'virtual-audio-studio' && meta.id !== 'speech-noop') {
      list.push({ value: meta.id, label: meta.name })
    }
  })
  return list
})

const isLoadingProviderData = ref(false)
const selectedProviderVoices = ref<any[]>([])
const selectedProviderModels = ref<any[]>([])

watch(() => voiceForm.value.baseProvider, async (newProvider) => {
  if (!newProvider || newProvider === 'kokoro-local') {
    selectedProviderVoices.value = []
    selectedProviderModels.value = []
    return
  }

  if (newProvider === 'virtual-audio-studio') {
    selectedProviderModels.value = []
    selectedProviderVoices.value = speechStore.savedVoiceProfiles.map(p => ({
      id: p.id,
      name: p.name,
      gender: 'saved profile',
    }))
    if (selectedProviderVoices.value.length > 0) {
      voiceForm.value.baseVoice = selectedProviderVoices.value[0].id
    }
    else {
      voiceForm.value.baseVoice = ''
    }
    return
  }

  isLoadingProviderData.value = true
  try {
    await speechStore.loadVoicesForProvider(newProvider)
    await providersStore.loadModelsForConfiguredProviders()

    selectedProviderVoices.value = speechStore.availableVoices[newProvider] || []
    selectedProviderModels.value = speechStore.providerModels || []

    if (selectedProviderVoices.value.length > 0) {
      voiceForm.value.baseVoice = selectedProviderVoices.value[0].id
    }
    else {
      voiceForm.value.baseVoice = ''
    }

    if (selectedProviderModels.value.length > 0) {
      voiceForm.value.baseModel = selectedProviderModels.value[0].id
    }
    else {
      const config = providersStore.getProviderConfig(newProvider)
      voiceForm.value.baseModel = (config?.model as string) || ''
    }
  }
  catch (err) {
    console.error('Error loading provider models/voices:', err)
  }
  finally {
    isLoadingProviderData.value = false
  }
})

watch(voiceTargetCharacterId, (newVal) => {
  if (newVal) {
    const char = selectedCharacters.value.find(c => c.id === newVal)
    if (char) {
      voiceForm.value.name = `${char.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_voice`
      voiceForm.value.baseProvider = 'kokoro-local'
      const genderIdx = char.traits[0]
      const genderName = wizardStore.facets.gender[genderIdx]
      if (genderName) {
        if (genderName.toLowerCase() === 'female') {
          voiceForm.value.baseVoice = 'af_heart'
          voiceForm.value.filterByGender = true
        }
        else if (genderName.toLowerCase() === 'male') {
          voiceForm.value.baseVoice = 'am_adam'
          voiceForm.value.filterByGender = true
        }
        else {
          voiceForm.value.filterByGender = false
        }
      }
    }
  }
})

const filteredVoicePresets = computed(() => {
  if (!voiceForm.value.filterByGender || !voiceTargetCharacterId.value) {
    return voicePresets
  }
  const char = selectedCharacters.value.find(c => c.id === voiceTargetCharacterId.value)
  if (!char)
    return voicePresets
  const genderIdx = char.traits[0]
  const genderName = wizardStore.facets.gender[genderIdx] || ''

  return voicePresets.filter((v) => {
    return v.gender.toLowerCase() === genderName.toLowerCase()
  })
})

function saveCustomVoiceProfile() {
  if (!voiceTargetCharacterId.value)
    return

  if (voiceForm.value.baseProvider === 'virtual-audio-studio') {
    wizardStore.bindVoiceToCharacter(voiceTargetCharacterId.value, voiceForm.value.baseVoice)
    toast.success('Voice profile bound successfully!')
    voiceCreatorOpen.value = false
    return
  }

  const profileId = `voice_profile_${voiceForm.value.name}`
  const newProfile = {
    id: profileId,
    name: voiceForm.value.name,
    baseProvider: voiceForm.value.baseProvider,
    baseModel: voiceForm.value.baseProvider === 'kokoro-local' ? '' : voiceForm.value.baseModel,
    baseVoice: voiceForm.value.baseVoice,
    effects: {
      pitch: voiceForm.value.pitch,
      rate: voiceForm.value.rate,
      volume: 1.0,
      asmr: 0,
      radio: 0,
      robot: 0,
      reverb: 0,
      spatial: 0,
    },
    ust: {
      enabled: true,
      mode: 'mute' as any,
      customStripChars: '*_[]()<>"\'',
      stripEmojis: true,
      tildeReplacement: '',
      autoLowercaseCapsThreshold: 2,
      autoLowercaseCapsExclude: [],
      convertBracketsToTokenFormat: true,
      customReplacements: [],
    },
  }

  speechStore.saveVoiceProfile(newProfile as any)
  wizardStore.bindVoiceToCharacter(voiceTargetCharacterId.value, profileId)
  toast.success(`Voice profile "${voiceForm.value.name}" saved!`)
  voiceCreatorOpen.value = false
}

async function playVoicePreview() {
  try {
    toast.info('Synthesizing audio preview...')
    if (voiceForm.value.baseProvider === 'virtual-audio-studio') {
      const profile = speechStore.savedVoiceProfiles.find(p => p.id === voiceForm.value.baseVoice)
      if (!profile) {
        throw new Error('Selected voice profile not found.')
      }
      const provider = await providersStore.getProviderInstance(profile.baseProvider)
      if (!provider) {
        throw new Error(`The base provider "${profile.baseProvider}" for this profile is not active.`)
      }
      const audioData = await speechStore.speech(
        provider as any,
        profile.baseModel || '',
        voiceForm.value.testText,
        profile.baseVoice,
        profile.effects,
      )
      const audioUrl = URL.createObjectURL(new Blob([audioData]))
      const audio = new Audio(audioUrl)
      audio.play()
      return
    }

    const provider = await providersStore.getProviderInstance(voiceForm.value.baseProvider)
    if (!provider) {
      throw new Error(`Provider "${voiceForm.value.baseProvider}" is not active or configured. Please enable it in Settings > Providers.`)
    }
    const model = voiceForm.value.baseProvider === 'kokoro-local'
      ? ((providersStore.getProviderConfig('kokoro-local')?.model as string) || 'q4')
      : voiceForm.value.baseModel

    const audioData = await speechStore.speech(
      provider as any,
      model,
      voiceForm.value.testText,
      voiceForm.value.baseVoice,
    )
    const audioUrl = URL.createObjectURL(new Blob([audioData]))
    const audio = new Audio(audioUrl)
    audio.play()
  }
  catch (err: any) {
    console.error('[AnimaDexWizard] Play preview error:', err)
    toast.error(err.message || 'Failed to play voice preview.')
  }
}

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

      <!-- Quick Audio Studio Creator Modal Overlay -->
      <div
        v-if="voiceCreatorOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
        @click.self="voiceCreatorOpen = false"
      >
        <div class="max-w-xl w-full border border-neutral-800 rounded-2xl bg-neutral-900 p-6 shadow-2xl">
          <!-- Header -->
          <div class="mb-5 flex items-center justify-between border-b border-neutral-800 pb-4">
            <div class="flex items-center gap-2">
              <div i-solar:music-notes-bold-duotone class="text-lg text-primary-500" />
              <h3 class="text-base text-neutral-100 font-bold">
                Configure Voice Profile
              </h3>
            </div>
            <button class="text-neutral-500 hover:text-neutral-300" @click="voiceCreatorOpen = false">
              <div i-solar:close-circle-bold class="text-xl" />
            </button>
          </div>

          <div class="flex flex-col gap-5">
            <div class="grid grid-cols-2 gap-4">
              <!-- Voice Profile Name -->
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] text-neutral-400 font-bold tracking-wider uppercase">Voice Profile Name</label>
                <input
                  v-model="voiceForm.name"
                  type="text"
                  class="w-full border border-neutral-800 rounded-xl bg-neutral-950/60 px-4 py-2 text-sm text-neutral-200 outline-none focus:border-primary-500"
                >
              </div>

              <!-- Voice Provider Dropdown -->
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] text-neutral-400 font-bold tracking-wider uppercase">Voice Provider</label>
                <Select
                  v-model="voiceForm.baseProvider"
                  :options="speechProviders"
                  class="w-full"
                />
              </div>
            </div>

            <!-- Kokoro-Local Specialized UI -->
            <div v-if="voiceForm.baseProvider === 'kokoro-local'" class="flex flex-col gap-5">
              <!-- Kokoro Voice Presets Selector Grid -->
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <label class="text-[10px] text-neutral-400 font-bold tracking-wider uppercase">Select Voice Preset (Kokoro Local)</label>
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] text-neutral-500 font-semibold">Gender Filter:</span>
                    <input
                      v-model="voiceForm.filterByGender"
                      type="checkbox"
                      class="border-neutral-800 rounded bg-neutral-950 text-primary-500 focus:ring-primary-500"
                    >
                  </div>
                </div>

                <!-- Collapsed List Grid (Inline style) -->
                <div class="grid grid-cols-1 max-h-[160px] gap-2 overflow-y-auto pr-1">
                  <div
                    v-for="voice in filteredVoicePresets"
                    :key="voice.id"
                    :class="[
                      'flex items-center justify-between p-2.5 border rounded-xl cursor-pointer transition-colors',
                      voiceForm.baseVoice === voice.id
                        ? 'border-primary-500 bg-primary-500/5'
                        : 'border-neutral-800 bg-neutral-950/40 hover:bg-neutral-950/80',
                    ]"
                    @click="voiceForm.baseVoice = voice.id"
                  >
                    <div class="min-w-0 flex items-center gap-2">
                      <span class="shrink-0 text-xs text-neutral-200 font-bold">{{ voice.name }}</span>
                      <span class="text-xs text-neutral-500">—</span>
                      <span class="truncate text-[10px] text-neutral-500 italic">{{ voice.description }}</span>
                    </div>
                    <div class="ml-3 flex shrink-0 items-center gap-1.5">
                      <span class="rounded bg-neutral-800 px-1.5 py-0.5 text-[8px] text-neutral-400 font-bold uppercase">
                        {{ voice.gender }}
                      </span>
                      <span class="rounded bg-neutral-800 px-1.5 py-0.5 text-[8px] text-neutral-400 font-bold uppercase">
                        {{ voice.accent }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- DSP Effects Sliders -->
              <div class="grid grid-cols-2 gap-4">
                <!-- Pitch -->
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between">
                    <label class="text-[10px] text-neutral-400 font-bold tracking-wider uppercase">Pitch Shift</label>
                    <span class="text-xs text-primary-500 font-semibold">{{ voiceForm.pitch.toFixed(1) }}x</span>
                  </div>
                  <input
                    v-model.number="voiceForm.pitch"
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    class="h-1 w-full cursor-pointer appearance-none rounded-lg bg-neutral-800 accent-primary-500"
                  >
                </div>

                <!-- Speed -->
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between">
                    <label class="text-[10px] text-neutral-400 font-bold tracking-wider uppercase">Speech Speed</label>
                    <span class="text-xs text-primary-500 font-semibold">{{ voiceForm.rate.toFixed(1) }}x</span>
                  </div>
                  <input
                    v-model.number="voiceForm.rate"
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    class="h-1 w-full cursor-pointer appearance-none rounded-lg bg-neutral-800 accent-primary-500"
                  >
                </div>
              </div>
            </div>

            <!-- Standard Providers Options (Searchable Dropdowns) -->
            <div v-else class="flex flex-col gap-4">
              <!-- Speech Model Select -->
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] text-neutral-400 font-bold tracking-wider uppercase">Speech Model</label>
                <Select
                  v-if="selectedProviderModels.length > 0"
                  v-model="voiceForm.baseModel"
                  :options="selectedProviderModels.map(m => ({ value: m.id, label: m.name || m.id }))"
                  placeholder="Select model"
                  class="w-full"
                />
                <input
                  v-else
                  v-model="voiceForm.baseModel"
                  type="text"
                  placeholder="e.g. tts-1"
                  class="w-full border border-neutral-800 rounded-xl bg-neutral-950/60 px-4 py-2.5 text-sm text-neutral-200 outline-none focus:border-primary-500"
                >
              </div>

              <!-- Speech Voice ID Select -->
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] text-neutral-400 font-bold tracking-wider uppercase">Speech Voice ID</label>
                <Select
                  v-if="selectedProviderVoices.length > 0"
                  v-model="voiceForm.baseVoice"
                  :options="selectedProviderVoices.map(v => ({ value: v.id, label: `${v.name} (${v.gender})` }))"
                  placeholder="Select voice"
                  class="w-full"
                />
                <input
                  v-else
                  v-model="voiceForm.baseVoice"
                  type="text"
                  placeholder="e.g. alloy, bella"
                  class="w-full border border-neutral-800 rounded-xl bg-neutral-950/60 px-4 py-2.5 text-sm text-neutral-200 outline-none focus:border-primary-500"
                >
              </div>
            </div>

            <!-- Test Sandbox Playground -->
            <div class="flex flex-col gap-2 border-t border-neutral-800/60 pt-4">
              <label class="text-[10px] text-neutral-400 font-bold tracking-wider uppercase">Voice Playground (Test speech)</label>
              <div class="flex gap-2">
                <input
                  v-model="voiceForm.testText"
                  type="text"
                  class="flex-1 border border-neutral-800 rounded-xl bg-neutral-950/60 px-4 py-2 text-xs text-neutral-300 outline-none focus:border-primary-500"
                >
                <Button
                  variant="secondary"
                  class="h-[36px] flex items-center gap-1 border border-neutral-800 rounded-xl px-4 text-xs font-bold"
                  @click="playVoicePreview"
                >
                  <div i-solar:play-circle-bold-duotone class="text-sm" />
                  Play
                </Button>
              </div>
            </div>
          </div>

          <!-- Footer actions -->
          <div class="mt-6 flex items-center justify-end gap-3 border-t border-neutral-800 pt-4">
            <Button
              variant="ghost"
              class="h-[36px] border border-neutral-800 rounded-xl px-4 text-xs font-bold"
              @click="voiceCreatorOpen = false"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              class="h-[36px] border border-primary-500/20 rounded-xl px-5 text-xs font-bold shadow-lg shadow-primary-500/10"
              @click="saveCustomVoiceProfile"
            >
              Save Voice Profile
            </Button>
          </div>
        </div>
      </div>
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
