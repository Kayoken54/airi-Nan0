<script setup lang="ts">
import type { OnboardingStepNextHandler, OnboardingStepPrevHandler } from './types'

import { Button } from '@proj-airi/ui'
import { onMounted, ref, watch } from 'vue'

import { signIn, signOut } from '../../../../libs/auth'
import { useAuthStore } from '../../../../stores/auth'

interface Props {
  onNext: OnboardingStepNextHandler
  onPrevious: OnboardingStepPrevHandler
}

const props = defineProps<Props>()
const authStore = useAuthStore()

const authState = ref<'idle' | 'authenticating' | 'success'>('idle')
const showAdvanced = ref(false)

// Google settings
const defaultClientId = '576646096961-ikeu3fgji6mqkd0cs7lp8ufjdiv2oohu.apps.googleusercontent.com'
const defaultRedirectUri = `${window.location.origin}/auth/callback/google`

const clientId = ref(defaultClientId)
const redirectUri = ref(defaultRedirectUri)

onMounted(() => {
  if (authStore.isAuthenticated) {
    authState.value = 'success'
  }
})

watch(() => authStore.isAuthenticated, (isAuthed) => {
  if (isAuthed) {
    authState.value = 'success'
  }
  else {
    authState.value = 'idle'
  }
})

async function startOAuth() {
  authState.value = 'authenticating'

  // Set remoteSyncEnabled temporarily in localStorage so fetchSession runs on reload
  localStorage.setItem('settings/privacy/remote-sync-enabled', 'true')

  try {
    await signIn('google')
  }
  catch (err) {
    console.error('OAuth sign in error', err)
    authState.value = 'idle'
  }
}

async function handleDisconnect() {
  await signOut()
  localStorage.removeItem('settings/privacy/remote-sync-enabled')
  authState.value = 'idle'
}
</script>

<template>
  <div class="h-full flex flex-col gap-6 font-sans">
    <!-- Header -->
    <div
      v-motion
      :initial="{ opacity: 0, y: -10 }"
      :enter="{ opacity: 1, y: 0 }"
      :duration="400"
      class="flex items-center gap-2"
    >
      <button class="outline-none" @click="props.onPrevious">
        <div class="i-solar:alt-arrow-left-line-duotone h-5 w-5 transition-colors hover:text-primary-500" />
      </button>
      <h2 class="flex-1 text-center text-xl text-neutral-800 font-semibold md:text-left md:text-2xl dark:text-neutral-100">
        Google Authentication
      </h2>
      <div class="h-5 w-5" />
    </div>

    <!-- Main View -->
    <div class="flex flex-1 flex-col items-center justify-center overflow-y-auto px-1">
      <!-- 1. IDLE STATE: Trigger sign-in -->
      <div v-if="authState === 'idle'" class="max-w-sm w-full flex flex-col items-center gap-6">
        <div class="flex flex-col items-center gap-2 text-center">
          <div class="mb-2 rounded-2xl bg-primary-500/10 p-4 text-primary-500">
            <div class="i-solar:letter-bold-duotone h-10 w-10 animate-pulse" />
          </div>
          <h3 class="text-base text-neutral-800 font-bold dark:text-neutral-100">
            Sign in with your Google Account
          </h3>
          <p class="max-w-xs text-xs text-neutral-500 leading-relaxed dark:text-neutral-400">
            Authenticate to find existing database backups or sync your settings dynamically to Google Drive.
          </p>
        </div>

        <!-- Google button -->
        <button
          class="w-full flex items-center justify-center gap-3 border border-neutral-200 rounded-xl bg-white px-4 py-3 text-sm text-neutral-700 font-semibold shadow-sm transition-all duration-200 dark:border-neutral-800 hover:border-neutral-300 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-neutral-700"
          @click="startOAuth"
        >
          <div class="i-solar:letter-bold-duotone text-lg text-primary-500" />
          <span>Sign In with Google</span>
        </button>

        <!-- Advanced toggle -->
        <div class="w-full border-t border-neutral-100 pt-4 dark:border-neutral-800/80">
          <button
            class="mx-auto flex items-center gap-1.5 text-xs text-neutral-500 font-medium outline-none transition-colors dark:text-neutral-400 hover:text-primary-500"
            @click="showAdvanced = !showAdvanced"
          >
            <span>Configure Custom Credentials</span>
            <div
              class="i-solar:alt-arrow-down-linear text-xs transition-transform duration-200"
              :class="{ 'rotate-180': showAdvanced }"
            />
          </button>

          <!-- Advanced inputs -->
          <div
            v-if="showAdvanced"
            v-motion
            :initial="{ opacity: 0, height: 0 }"
            :enter="{ opacity: 1, height: 'auto' }"
            class="mt-4 w-full flex flex-col gap-3.5 border border-neutral-100 rounded-xl bg-neutral-50/50 p-4 text-left dark:border-neutral-800/80 dark:bg-neutral-900/30"
          >
            <div class="flex flex-col gap-1">
              <label class="text-[10px] text-neutral-500 font-bold tracking-wider uppercase dark:text-neutral-400">OAuth Client ID</label>
              <input
                v-model="clientId"
                type="text"
                class="w-full border border-neutral-200 rounded-lg bg-white px-2.5 py-1.5 text-xs text-neutral-700 font-mono outline-none transition-colors dark:border-neutral-800 focus:border-primary-500 dark:bg-neutral-900 dark:text-neutral-200"
              >
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[10px] text-neutral-500 font-bold tracking-wider uppercase dark:text-neutral-400">Redirect URI</label>
              <input
                v-model="redirectUri"
                type="text"
                class="w-full border border-neutral-200 rounded-lg bg-white px-2.5 py-1.5 text-xs text-neutral-700 font-mono outline-none transition-colors dark:border-neutral-800 focus:border-primary-500 dark:bg-neutral-900 dark:text-neutral-200"
              >
            </div>
          </div>
        </div>
      </div>

      <!-- 2. AUTHENTICATING STATE -->
      <div v-else-if="authState === 'authenticating'" class="flex flex-col items-center gap-4 text-center">
        <div class="relative h-20 w-20 flex items-center justify-center">
          <div class="absolute inset-0 animate-ping border-4 border-primary-500/20 rounded-full dark:border-primary-400/20" />
          <div class="absolute inset-2 animate-spin border-4 border-b-transparent border-l-transparent border-r-transparent border-t-primary-500 rounded-full" />
          <div class="i-solar:letter-bold-duotone h-8 w-8 text-primary-500 dark:text-primary-400" />
        </div>
        <div>
          <h3 class="text-lg text-neutral-800 font-bold dark:text-neutral-100">
            Connecting to Google...
          </h3>
          <p class="mt-1 text-xs text-neutral-500">
            Please log in and authorize the app in the browser popup window.
          </p>
        </div>
      </div>

      <!-- 3. SUCCESS STATE -->
      <div
        v-else-if="authState === 'success'"
        v-motion
        :initial="{ opacity: 0, scale: 0.95 }"
        :enter="{ opacity: 1, scale: 1 }"
        class="max-w-sm w-full flex flex-col items-center gap-4 border border-neutral-200/60 rounded-2xl bg-white/40 p-6 text-center backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/40"
      >
        <div class="relative">
          <div class="h-16 w-16 flex items-center justify-center rounded-full from-blue-500 to-indigo-500 bg-gradient-to-tr text-xl text-white font-bold uppercase shadow-blue-500/10 shadow-md">
            {{ authStore.user?.name?.slice(0, 2) || 'US' }}
          </div>
          <div class="absolute h-6 w-6 flex items-center justify-center border-2 border-white rounded-full bg-emerald-500 text-white -bottom-1 -right-1 dark:border-neutral-950">
            <div class="i-solar:check-circle-bold h-4 w-4" />
          </div>
        </div>
        <div>
          <h3 class="text-base text-neutral-800 font-bold dark:text-neutral-100">
            {{ authStore.user?.name || 'Authorized User' }}
          </h3>
          <p class="text-xs text-neutral-500 dark:text-neutral-400">
            {{ authStore.user?.email || 'Authenticated' }}
          </p>
        </div>
        <div class="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 px-4 py-2 text-xs text-emerald-600 font-medium dark:bg-emerald-500/20 dark:text-emerald-400">
          <div class="i-solar:shield-check-bold-duotone h-4 w-4" />
          Successfully Connected
        </div>

        <button
          class="mt-2 text-xs text-neutral-400 transition-colors hover:text-neutral-500"
          @click="handleDisconnect"
        >
          Disconnect Account
        </button>
      </div>
    </div>

    <!-- Footer Action -->
    <Button
      v-motion
      :initial="{ opacity: 0, y: 10 }"
      :enter="{ opacity: 1, y: 0 }"
      :duration="400"
      :delay="300"
      :disabled="authState !== 'success'"
      label="Continue to Search Backups"
      @click="props.onNext"
    />
  </div>
</template>
