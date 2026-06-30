import { useLocalStorageManualReset } from '@proj-airi/stage-shared/composables'
import { defineStore } from 'pinia'

export const useSettingsUserProfile = defineStore('settings-user-profile', () => {
  const name = useLocalStorageManualReset<string>('settings/user-profile/name', 'User')
  const description = useLocalStorageManualReset<string>('settings/user-profile/description', 'An observer/manager of this stage.')
  const prompt = useLocalStorageManualReset<string>('settings/user-profile/prompt', '')
  const voiceProfileId = useLocalStorageManualReset<string>('settings/user-profile/voice-profile-id', '')

  function resetState() {
    name.reset()
    description.reset()
    prompt.reset()
    voiceProfileId.reset()
  }

  return {
    name,
    description,
    prompt,
    voiceProfileId,
    resetState,
  }
})
