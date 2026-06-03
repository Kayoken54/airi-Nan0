import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type GamePhase = 'idle' | 'conversation' | 'map' | 'action'
export type MoodState = 'low' | 'normal' | 'high' | 'max'

export interface Choice {
  id: string
  text: string
  icon?: string
  action: string
  condition?: string
  cost?: number // Time or tension cost
}

export const useDatingSimStore = defineStore('dating-sim', () => {
  const enabled = ref(false)
  const currentPhase = ref<GamePhase>('idle')

  // Amagami-inspired metrics
  const variables = ref<Record<string, number>>({
    Intimacy: 0,
    Tension: 50, // 0-100, affects how character reacts
    ActionPoints: 5, // For conversation topics
    TimeOfDay: 12, // 24h format
    Timer: 0, // Choice countdown
  })

  const mood = computed<MoodState>(() => {
    const t = variables.value.Tension
    const i = variables.value.Intimacy
    if (i > 80 && t > 80)
      return 'max'
    if (t > 60)
      return 'high'
    if (t < 30)
      return 'low'
    return 'normal'
  })

  const choices = ref<Choice[]>([])
  const currentSubtitle = ref<string>('')

  // Delta Ticking Engine
  let lastTick = 0
  let loopId: number | null = null

  function startGameLoop() {
    if (loopId)
      return
    lastTick = performance.now()
    const tick = (now: number) => {
      if (!enabled.value) {
        loopId = null
        return
      }
      const dt = (now - lastTick) / 1000
      lastTick = now

      // Process Timers (e.g. countdown for choices)
      if (variables.value.Timer > 0) {
        variables.value.Timer = Math.max(0, variables.value.Timer - dt)
        if (variables.value.Timer === 0) {
          handleTimeout()
        }
      }

      loopId = requestAnimationFrame(tick)
    }
    loopId = requestAnimationFrame(tick)
  }

  function handleTimeout() {
    choices.value = []
    currentSubtitle.value = '...'
    // Fallback logic when user doesn't answer in time
  }

  const isGenerating = ref(false)

  async function generateLiveChoices() {
    if (isGenerating.value)
      return
    isGenerating.value = true
    try {
      const { useLLM } = await import('@proj-airi/stage-ui/stores/llm')
      const { useProvidersStore } = await import('@proj-airi/stage-ui/stores/providers')
      const { useConsciousnessStore } = await import('@proj-airi/stage-ui/stores/modules/consciousness')

      const llm = useLLM()
      const providers = useProvidersStore()
      const consciousness = useConsciousnessStore()
      const provider = await providers.getProviderInstance(consciousness.activeProvider)

      if (!provider || !consciousness.activeModel) {
        console.error('[DatingSim] No active model or provider')
        return
      }

      const result = await llm.generate(
        consciousness.activeModel,
        provider as any,
        [
          { role: 'system', content: `You are a Dating Sim engine. Generate 4 conversation topics and 2 gift items based on the current situation. The user and character intimacy is ${variables.value.Intimacy}/100 and tension is ${variables.value.Tension}/100. Keep choices under 4 words. Your output MUST be EXACTLY in this JSON format: {"topics": ["topic1", "topic2", "topic3", "topic4"], "items": ["gift1", "gift2"], "subtitle": "A brief inner thought from the character"}` },
          { role: 'user', content: 'Output raw JSON only. Do not include markdown backticks or any preamble/postamble.' },
        ],
      )

      const rawText = result.text || (result as any).reasoning || ''
      const match = rawText.match(/\{[\s\S]*\}/)
      if (!match)
        throw new Error('No JSON object found in response')
      const object = JSON.parse(match[0])

      const liveChoices = [
        ...object.topics.slice(0, 4).map((t: string, i: number) => ({ id: `t${i}`, text: t, icon: 'i-solar:chat-round-dots-bold-duotone', action: 'llm_topic' })),
        ...object.items.slice(0, 2).map((t: string, i: number) => ({ id: `i${i}`, text: t, icon: 'i-solar:gift-bold-duotone', action: 'llm_item', cost: 1 })),
      ]

      triggerTestSyncCustom(liveChoices, object.subtitle)
    }
    catch (err) {
      console.error('[DatingSim] Live Generation Failed:', err)
    }
    finally {
      isGenerating.value = false
    }
  }

  async function evaluateParameters(userPrompt: string) {
    if (!enabled.value)
      return
    try {
      const { useLLM } = await import('@proj-airi/stage-ui/stores/llm')
      const { useProvidersStore } = await import('@proj-airi/stage-ui/stores/providers')
      const { useConsciousnessStore } = await import('@proj-airi/stage-ui/stores/modules/consciousness')

      const llm = useLLM()
      const providers = useProvidersStore()
      const consciousness = useConsciousnessStore()
      const provider = await providers.getProviderInstance(consciousness.activeProvider)

      if (!provider || !consciousness.activeModel)
        return

      const result = await llm.generate(
        consciousness.activeModel,
        provider as any,
        [
          { role: 'system', content: `You are a Dating Sim engine evaluating a user's prompt. The user said: "${userPrompt}". How does this affect Intimacy and Tension? (Range -20 to +20). Your output MUST be EXACTLY in this JSON format: {"intimacyChange": 2, "tensionChange": -5, "mood": "happy"}` },
          { role: 'user', content: 'Output raw JSON only. Do not include markdown backticks or any preamble/postamble.' },
        ],
      )

      const rawText = result.text || (result as any).reasoning || ''
      const match = rawText.match(/\{[\s\S]*\}/)
      if (!match)
        throw new Error('No JSON object found in response')
      const object = JSON.parse(match[0])

      if (typeof object.intimacyChange === 'number') {
        setVariable('Intimacy', Math.max(0, Math.min(100, getVariable('Intimacy') + object.intimacyChange)))
      }
      if (typeof object.tensionChange === 'number') {
        setVariable('Tension', Math.max(0, Math.min(100, getVariable('Tension') + object.tensionChange)))
      }
      if (object.mood) {
        broadcastMood(object.mood)
      }

      // Regenerate choices after parameters update
      generateLiveChoices()
    }
    catch (err) {
      console.error('[DatingSim] Parameter Evaluation Failed:', err)
      // Fallback: still regenerate choices so UI isn't stuck
      generateLiveChoices()
    }
  }

  function setVariable(name: string, value: number) {
    variables.value[name] = value
  }

  function getVariable(name: string): number {
    return variables.value[name] || 0
  }

  function evaluateCondition(condition?: string): boolean {
    if (!condition)
      return true
    const parts = condition.split(' ')
    if (parts.length < 3)
      return false
    const [varName, op, targetStr] = parts
    const currentValue = getVariable(varName)
    const target = Number.parseFloat(targetStr)

    switch (op) {
      case 'equal': return currentValue === target
      case 'greater': return currentValue > target
      case 'less': return currentValue < target
      case 'greater_eq': return currentValue >= target
      case 'less_eq': return currentValue <= target
      default: return false
    }
  }

  function executeAssignment(code: string) {
    const parts = code.split(' ')
    if (parts.length < 3)
      return
    const [varName, op, ...exprParts] = parts
    const expr = exprParts.join(' ')
    const currentValue = getVariable(varName)

    if (op === 'assign') {
      if (expr.startsWith('rand(')) {
        const match = expr.match(/rand\((\d+),(\d+)\)/)
        if (match) {
          const min = Number.parseInt(match[1], 10)
          const max = Number.parseInt(match[2], 10)
          setVariable(varName, Math.floor(Math.random() * (max - min + 1)) + min)
        }
      }
      else {
        setVariable(varName, Number.parseFloat(expr))
      }
    }
    else if (op === 'add') {
      setVariable(varName, currentValue + Number.parseFloat(expr))
    }
    else if (op === 'subtract') {
      setVariable(varName, currentValue - Number.parseFloat(expr))
    }
  }

  // 3. The Instruction Sequencer (Command Pipeline)
  function executeScript(script: string) {
    const commands = script.split(';')
    for (const rawCmd of commands) {
      const cmd = rawCmd.trim()
      if (!cmd)
        continue

      if (cmd.startsWith('start_mtn')) {
        const target = cmd.replace('start_mtn', '').trim()
        console.info(`[Dating Sim Pipeline] Triggering motion: ${target}`)
        window.dispatchEvent(new CustomEvent('dating-sim:trigger-motion', { detail: target }))
      }
      else if (cmd.startsWith('clear_exp')) {
        console.info(`[Dating Sim Pipeline] Clearing expressions.`)
        window.dispatchEvent(new CustomEvent('dating-sim:clear-exp'))
      }
      else if (cmd.startsWith('motions enable')) {
        console.info(`[Dating Sim Pipeline] Enabling idle motions.`)
        window.dispatchEvent(new CustomEvent('dating-sim:motions-enable', { detail: true }))
      }
      else if (cmd.startsWith('motions disable')) {
        console.info(`[Dating Sim Pipeline] Disabling idle motions.`)
        window.dispatchEvent(new CustomEvent('dating-sim:motions-enable', { detail: false }))
      }
      else if (cmd.startsWith('change_cos')) {
        const modelJson = cmd.replace('change_cos', '').trim()
        console.info(`[Dating Sim Pipeline] Dynamic Model Hot-Swap: ${modelJson}`)
        window.dispatchEvent(new CustomEvent('dating-sim:change-cos', { detail: modelJson }))
      }
    }
  }

  // Lifecycle
  function enable() {
    enabled.value = true
    if (typeof window !== 'undefined' && (window as any).electron) {
      ;(window as any).electron.ipcRenderer.invoke('stage-window-set-bounds', { width: 1200, height: 800, center: true }).catch(console.error)
    }
    startGameLoop()
  }

  function disable() {
    enabled.value = false
    if (typeof window !== 'undefined' && (window as any).electron) {
      ;(window as any).electron.ipcRenderer.invoke('stage-window-set-bounds', { width: 450, height: 600, center: false }).catch(console.error)
    }
    choices.value = []
    currentSubtitle.value = ''
    variables.value = {
      Intimacy: 0,
      Tension: 0,
      ActionPoints: 5,
      Timer: 0,
    }
    if (loopId !== null) {
      cancelAnimationFrame(loopId)
      loopId = null
    }
  }

  // Cross-Window Sync for testing
  const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dating-sim-sync') : null
  if (bc) {
    bc.onmessage = (event) => {
      if (event.data.type === 'test') {
        enable()
        currentPhase.value = 'conversation'
        setVariable('Intimacy', 75)
        setVariable('Tension', 80)
        setVariable('ActionPoints', 3)
        setVariable('Timer', 10)
        choices.value = event.data.choices
        currentSubtitle.value = event.data.subtitle
      }
      if (event.data.type === 'clear') {
        disable()
        choices.value = []
        currentSubtitle.value = ''
      }
      if (event.data.type === 'toggle') {
        if (event.data.enabled)
          enable()
        else disable()
      }
      if (event.data.type === 'mood') {
        applyMood(event.data.mood)
      }
    }
  }

  function syncToggle(isEnabled: boolean) {
    if (isEnabled)
      enable()
    else disable()
    if (bc)
      bc.postMessage({ type: 'toggle', enabled: isEnabled })
  }

  function toggleDatingSim() {
    if (enabled.value) {
      syncToggle(false)
    }
    else {
      syncToggle(true)
      generateLiveChoices()
    }
  }

  function applyMood(newMood: string) {
    import('@proj-airi/stage-ui-live2d/stores/live2d').then(({ useLive2d }) => {
      const live2dStore = useLive2d()
      if (live2dStore.model) {
        const m = newMood.toLowerCase()
        const specialSauceMap: Record<string, { group: string, index: number } | string> = {
          happy: { group: 'Face#2', index: 1 },
          surprised: { group: 'Face#2', index: 2 },
          sad: { group: 'Face#2', index: 3 },
          angry: { group: 'Face#2', index: 5 },
          cool: { group: 'Face#2', index: 6 },
          shy: { group: 'Face#2', index: 7 },
          think: { group: 'Face#2', index: 8 },
          neutral: { group: 'Face#2', index: 0 },
          love: 'exp12',
          blush: 'exp01',
        }
        if (m in specialSauceMap) {
          const mapped = specialSauceMap[m]
          if (typeof mapped === 'string') {
            live2dStore.triggerEmotion(mapped)
          }
          else if (live2dStore.model?.internalModel?.motionManager) {
            live2dStore.model.internalModel.motionManager.startMotion(mapped.group, mapped.index)
          }
          else {
            live2dStore.triggerEmotion(m)
          }
        }
        else {
          live2dStore.triggerEmotion(m)
        }
      }
    })
  }

  function broadcastMood(newMood: string) {
    applyMood(newMood)
    if (bc)
      bc.postMessage({ type: 'mood', mood: newMood })
  }

  function triggerTestSync() {
    const testChoices = [
      { id: '1', text: 'Give a Present', icon: 'i-solar:gift-bold-duotone', action: 'give_gift', cost: 1 },
      { id: '2', text: 'Ask about hobbies', icon: 'i-solar:gamepad-bold-duotone', action: 'chat', cost: 1 },
      { id: '3', text: 'Stare quietly', icon: 'i-solar:eye-bold-duotone', action: 'stare', condition: 'Intimacy greater 50', cost: 2 },
      { id: '4', text: 'Hold Hands', icon: 'i-solar:hand-heart-bold-duotone', action: 'hold_hands', condition: 'Intimacy greater 70', cost: 3 },
    ]
    const testSubtitle = 'They seem to be waiting for your response...'

    // Apply locally
    enable()
    currentPhase.value = 'conversation'
    setVariable('Intimacy', 75)
    setVariable('Tension', 80)
    setVariable('ActionPoints', 3)
    setVariable('Timer', 10)
    choices.value = testChoices
    currentSubtitle.value = testSubtitle

    // Broadcast to Stage window
    if (bc)
      bc.postMessage({ type: 'test', choices: testChoices, subtitle: testSubtitle })
  }

  function triggerTestSyncCustom(customChoices: Choice[], subtitle: string) {
    enable()
    currentPhase.value = 'conversation'
    setVariable('Intimacy', 75)
    setVariable('Tension', 80)
    setVariable('ActionPoints', 3)
    setVariable('Timer', 10)
    choices.value = customChoices
    currentSubtitle.value = subtitle

    if (bc)
      bc.postMessage({ type: 'test', choices: customChoices, subtitle })
  }

  if (typeof window !== 'undefined' && (window as any).electron) {
    const ipcRenderer = (window as any).electron.ipcRenderer
    if (typeof ipcRenderer.removeAllListeners === 'function') {
      try { ipcRenderer.removeAllListeners('dating-sim-toggle') }
      catch (e) {}
    }
    ipcRenderer.on('dating-sim-toggle', () => {
      toggleDatingSim()
    })
  }

  return {
    enabled,
    currentPhase,
    variables,
    mood,
    choices,
    currentSubtitle,
    setVariable,
    getVariable,
    evaluateCondition,
    executeAssignment,
    executeScript,
    enable,
    disable,
    triggerTestSync,
    triggerTestSyncCustom,
    toggleDatingSim,
    syncToggle,
    generateLiveChoices,
    evaluateParameters,
    broadcastMood,
  }
})
