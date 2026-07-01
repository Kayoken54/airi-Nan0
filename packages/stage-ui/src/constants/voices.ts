export interface VoicePreset {
  id: string
  name: string
  gender: 'Female' | 'Male' | string
  accent: string
  description: string
}

export const voicePresets: VoicePreset[] = [
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
