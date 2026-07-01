<script setup lang="ts">
import { voicePresets } from '@proj-airi/stage-ui/constants/voices'
import { useLLM } from '@proj-airi/stage-ui/stores/llm'
import { useConsciousnessStore } from '@proj-airi/stage-ui/stores/modules/consciousness'
import { useSpeechStore } from '@proj-airi/stage-ui/stores/modules/speech'
import { useProvidersStore } from '@proj-airi/stage-ui/stores/providers'
import { Button } from '@proj-airi/ui'
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'

interface Character {
  id: string
  name: string
  trigger: string
  copyrightIndex: number
  tags: string
  traits: [number, number, number, number]
}

interface Props {
  modelValue: boolean
  selectedCharacters: Character[]
  copyrights: string[]
  genders: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'apply', payload: Record<string, { baseProvider: string, baseModel: string, baseVoice: string }>): void
}>()

const llmStore = useLLM()
const providersStore = useProvidersStore()
const speechStore = useSpeechStore()
const consciousnessStore = useConsciousnessStore()

const state = ref<'idle' | 'loading' | 'results' | 'error'>('idle')
const errorMessage = ref('')

interface Recommendation {
  characterId: string
  name: string
  voiceId: string
  rate: number
  pitch: number
  reasoning: string
}

const recommendations = ref<Recommendation[]>([])
const activePlayingId = ref<string | null>(null)
let activeAudio: HTMLAudioElement | null = null

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    state.value = 'idle'
    recommendations.value = []
    errorMessage.value = ''
    stopAudio()
    // Auto-trigger analysis when modal opens
    void runAutoConfiguration()
  }
  else {
    stopAudio()
  }
})

function stopAudio() {
  if (activeAudio) {
    activeAudio.pause()
    activeAudio = null
  }
  activePlayingId.value = null
}

async function runAutoConfiguration() {
  state.value = 'loading'
  try {
    const activeModel = consciousnessStore.activeModel
    const activeProviderName = consciousnessStore.activeProvider
    if (!activeModel || !activeProviderName) {
      throw new Error('No active LLM configured in settings.')
    }
    const providerInstance = await providersStore.getProviderInstance(activeProviderName)
    if (!providerInstance) {
      throw new Error('Failed to retrieve active provider instance.')
    }

    const castList = props.selectedCharacters.map((c) => {
      const series = props.copyrights[c.copyrightIndex] || 'Unknown Series'
      const gender = props.genders[Number(c.traits[0] || 0)] || 'Unknown'
      return `- ID: "${c.id}", Name: "${c.name}", Series: "${series}", Gender: "${gender}", Description/Traits: ${c.tags}`
    }).join('\n')

    const voicesList = voicePresets.map((v) => {
      return `- ID: "${v.id}", Name: "${v.name}", Gender: "${v.gender}", Description: ${v.description}`
    }).join('\n')

    const systemMsg = `You are a professional voice casting director. 
Match each of the provided characters with the single best-fitting voice from the available Kokoro voice list.

For each character, suggest optimal "rate" (speech speed, normally 1.0, range 0.7 to 1.4) and "pitch" (speech pitch, normally 1.0, range 0.7 to 1.4) to match their canon character description. For example:
- High energy, hyperactive, young girls: slightly higher rate (e.g. 1.05 - 1.15) and higher pitch (e.g. 1.05 - 1.15)
- Deep, calm, older characters: lower pitch (e.g. 0.85 - 0.95)

Return ONLY a raw JSON array matching this schema (no markdown formatting, no wrapping text):
[
  {
    "characterId": "the character ID string",
    "voiceId": "the selected Kokoro voice ID",
    "rate": 1.0,
    "pitch": 1.0,
    "reasoning": "A 1-sentence explanation of why this voice fits the character."
  }
]`

    const userMsg = `AVAILABLE VOICES:\n${voicesList}\n\nCHARACTERS TO CONFIGURE:\n${castList}`

    const response = await llmStore.generate(activeModel, providerInstance as any, [
      { role: 'system', content: systemMsg },
      { role: 'user', content: userMsg },
    ])

    const rawText = (response.text || '').trim()
    let cleanJson = rawText
    const match = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (match) {
      cleanJson = match[1].trim()
    }

    const parsed = JSON.parse(cleanJson)
    if (!Array.isArray(parsed)) {
      throw new TypeError('LLM did not return a valid array.')
    }

    recommendations.value = parsed.map((item: any) => {
      let char = props.selectedCharacters.find(c => c.id === item.characterId)
      if (!char && item.name) {
        char = props.selectedCharacters.find(c => c.name.toLowerCase() === item.name.toLowerCase())
      }
      return {
        characterId: char ? char.id : item.characterId,
        name: char ? char.name : (item.name || 'Unknown'),
        voiceId: item.voiceId || 'af_heart',
        rate: typeof item.rate === 'number' ? item.rate : 1.0,
        pitch: typeof item.pitch === 'number' ? item.pitch : 1.0,
        reasoning: item.reasoning || 'Automatically matched.',
      }
    })

    state.value = 'results'
  }
  catch (err: any) {
    console.error('[AutoVoiceConfigModal] Recommendation failed:', err)
    errorMessage.value = err.message || 'Unknown error occurred during analysis.'
    state.value = 'error'
  }
}

async function playPreview(rec: Recommendation) {
  if (activePlayingId.value === rec.characterId) {
    stopAudio()
    return
  }

  stopAudio()
  activePlayingId.value = rec.characterId

  try {
    const provider = await providersStore.getProviderInstance('virtual-audio-studio')
    if (!provider) {
      throw new Error('Virtual Audio Studio provider is not active.')
    }

    const configuredModel = (providersStore.getProviderConfig('kokoro-local')?.model as string) || 'q4'
    const testText = `Hello, I am ${rec.name}. How does my voice sound?`

    // Save a temporary voice profile to speechStore to run pitch and rate effects via the proxy
    const tempProfileId = 'voice_profile_auto_preview'
    const tempProfile = {
      id: tempProfileId,
      name: 'Voice Profile Auto Preview',
      baseProvider: 'kokoro-local',
      baseModel: configuredModel,
      baseVoice: rec.voiceId,
      effects: {
        pitch: rec.pitch,
        rate: rec.rate,
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

    speechStore.saveVoiceProfile(tempProfile as any)

    const audioData = await speechStore.speech(
      provider as any,
      'virtual',
      testText,
      tempProfileId,
    )

    if (activePlayingId.value !== rec.characterId)
      return

    const audioUrl = URL.createObjectURL(new Blob([audioData]))
    const audio = new Audio(audioUrl)
    audio.addEventListener('ended', () => {
      if (activePlayingId.value === rec.characterId) {
        activePlayingId.value = null
      }
    })
    activeAudio = audio
    audio.play()
  }
  catch (err: any) {
    toast.error(err.message || 'Failed to play voice preview.')
    activePlayingId.value = null
  }
}

function handleApply() {
  const payload: Record<string, { baseProvider: string, baseModel: string, baseVoice: string }> = {}

  recommendations.value.forEach((rec) => {
    const profileId = `voice_profile_${rec.name.trim()}_auto`
    const configuredModel = (providersStore.getProviderConfig('kokoro-local')?.model as string) || 'q4'

    const newProfile = {
      id: profileId,
      name: `${rec.name} (Auto)`,
      baseProvider: 'kokoro-local',
      baseModel: configuredModel,
      baseVoice: rec.voiceId,
      effects: {
        pitch: rec.pitch,
        rate: rec.rate,
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

    payload[rec.characterId] = {
      baseProvider: 'virtual-audio-studio',
      baseModel: 'virtual',
      baseVoice: profileId,
    }
  })

  emit('apply', payload)
  emit('update:modelValue', false)
  toast.success('Successfully applied automatic voice profiles!')
}
</script>

<template>
  <DialogRoot :open="modelValue" @update:open="emit('update:modelValue', $event)">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-120 bg-black/60 backdrop-blur-md" />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-120 m-0 max-h-[85vh] max-w-2xl w-[90vw] flex flex-col overflow-hidden border border-neutral-800 rounded-2xl bg-neutral-900 shadow-2xl -translate-x-1/2 -translate-y-1/2"
      >
        <!-- Header -->
        <div class="border-b border-neutral-800 p-6">
          <div class="flex items-center gap-2">
            <div class="rounded-xl bg-primary-500/10 p-2 text-primary-500 shadow-primary-500/10 shadow-sm">
              <div class="i-solar:magic-stick-3-bold-duotone animate-pulse text-xl" />
            </div>
            <DialogTitle class="text-base text-neutral-100 font-bold">
              Magic Voice Configurator
            </DialogTitle>
          </div>
        </div>

        <!-- Body Content -->
        <div class="min-h-[250px] flex flex-1 flex-col overflow-y-auto p-6">
          <!-- Loading State -->
          <div v-if="state === 'loading'" class="flex flex-1 flex-col items-center justify-center gap-4 py-8">
            <div class="h-10 w-10 flex items-center justify-center rounded-full bg-primary-500/15 text-primary-400">
              <span class="i-solar:restart-square-outline animate-spin text-2xl" />
            </div>
            <div class="text-center">
              <h4 class="text-sm text-neutral-200 font-bold">
                Analyzing Cast Profiles
              </h4>
              <p class="mt-1 text-xs text-neutral-400">
                matching characters with the best Kokoro voice presets...
              </p>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="state === 'error'" class="flex flex-1 flex-col items-center justify-center gap-4 py-8">
            <div class="h-10 w-10 flex items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <span class="i-solar:shield-warning-bold text-2xl" />
            </div>
            <div class="text-center">
              <h4 class="text-sm text-neutral-200 font-bold">
                Configuration Failed
              </h4>
              <p class="mt-1 text-xs text-red-400">
                {{ errorMessage }}
              </p>
            </div>
            <Button variant="secondary" class="mt-2 text-xs" @click="runAutoConfiguration">
              Retry Configuration
            </Button>
          </div>

          <!-- Results Review State -->
          <div v-else-if="state === 'results'" class="flex flex-col gap-4">
            <p class="text-xs text-neutral-400 leading-normal">
              Review and adjust the recommended voice presets and parameters for each character. Click Apply to save voice profiles for all characters at once.
            </p>

            <div class="flex flex-col gap-3">
              <div
                v-for="rec in recommendations"
                :key="rec.characterId"
                class="flex flex-col border border-neutral-800 rounded-xl bg-neutral-950/20 p-4"
              >
                <!-- Character & Voice Selector Row -->
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <!-- Character title -->
                  <div class="flex items-center gap-2">
                    <div class="i-solar:user-circle-bold-duotone shrink-0 text-lg text-primary-400" />
                    <span class="text-sm text-neutral-100 font-bold">{{ rec.name }}</span>
                  </div>

                  <!-- Voice settings controls -->
                  <div class="flex items-center gap-3">
                    <!-- Dropdown preset picker -->
                    <select
                      v-model="rec.voiceId"
                      class="border border-neutral-800 rounded-lg bg-neutral-900 px-2 py-1 text-xs text-neutral-300 outline-none focus:border-primary-500"
                    >
                      <option v-for="voice in voicePresets" :key="voice.id" :value="voice.id">
                        {{ voice.name }} ({{ voice.gender }})
                      </option>
                    </select>

                    <!-- Preview voice btn -->
                    <button
                      class="h-7 flex items-center gap-1 rounded bg-neutral-800 px-2.5 text-xs text-neutral-300 transition-colors hover:bg-neutral-700"
                      @click="playPreview(rec)"
                    >
                      <span
                        :class="activePlayingId === rec.characterId ? 'i-solar:pause-circle-bold-duotone text-primary-400 animate-pulse' : 'i-solar:play-stream-bold-duotone'"
                        class="shrink-0 text-sm"
                      />
                      <span>{{ activePlayingId === rec.characterId ? 'Stop' : 'Preview' }}</span>
                    </button>
                  </div>
                </div>

                <!-- Sliders Row -->
                <div class="grid grid-cols-1 mt-3.5 gap-4 border-t border-neutral-800/40 pt-3 sm:grid-cols-2">
                  <!-- Pitch slider -->
                  <div class="flex flex-col gap-1">
                    <div class="flex items-center justify-between text-[10px] text-neutral-400">
                      <span>Pitch Modifier</span>
                      <span class="text-primary-400 font-mono">{{ rec.pitch.toFixed(2) }}x</span>
                    </div>
                    <input
                      v-model.number="rec.pitch"
                      type="range"
                      min="0.7"
                      max="1.4"
                      step="0.05"
                      class="h-1 cursor-pointer appearance-none rounded-lg bg-neutral-800 accent-primary-500"
                    >
                  </div>

                  <!-- Speed Rate slider -->
                  <div class="flex flex-col gap-1">
                    <div class="flex items-center justify-between text-[10px] text-neutral-400">
                      <span>Speed Rate</span>
                      <span class="text-primary-400 font-mono">{{ rec.rate.toFixed(2) }}x</span>
                    </div>
                    <input
                      v-model.number="rec.rate"
                      type="range"
                      min="0.7"
                      max="1.4"
                      step="0.05"
                      class="h-1 cursor-pointer appearance-none rounded-lg bg-neutral-800 accent-primary-500"
                    >
                  </div>
                </div>

                <!-- Reasoning text -->
                <p class="mt-3.5 border-t border-neutral-800/40 pt-2 text-[11px] text-neutral-400 leading-normal italic">
                  💡 {{ rec.reasoning }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 border-t border-neutral-800 bg-neutral-900/30 px-6 py-4">
          <Button
            variant="secondary"
            class="h-9 px-4 text-xs font-semibold"
            @click="emit('update:modelValue', false)"
          >
            Cancel
          </Button>
          <Button
            v-if="state === 'results'"
            variant="primary"
            class="h-9 px-5 text-xs font-bold"
            @click="handleApply"
          >
            Apply Assignments
          </Button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
