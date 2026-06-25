/**
 * MOSS TTS Web Worker entry point.
 * Speaks the Eventa inference contract for MOSS.
 * Last rebuilt: 2026-06-25T12:50:00Z
 */

import type { InferenceDevice, LoadModelRequest, LoadStreamItem, MossGenerateChunk, MossGenerateRequest } from '../../libs/inference/contract'

import { defineInvokeHandler, defineStreamInvokeHandler, toStreamHandler } from '@moeru/eventa'
import { createContext } from '@moeru/eventa/adapters/webworkers/worker'

import { mossGenerateEvent, mossLoadEvent, mossUnloadEvent } from '../../libs/inference/contract'
import { createBrowserOnnxTtsRuntime } from './browser_onnx_runtime.js'

// Import NanoReaderBrowserModelStore onto globalThis
import './browser_model_store.js'
import './tokenizer_sandbox.js'

const { context } = createContext()

let runtime: any = null

defineStreamInvokeHandler(context, mossLoadEvent, toStreamHandler<LoadModelRequest, LoadStreamItem>(async ({ payload, emit, options }) => {
  const signal = options?.abortController?.signal
  const { hfToken, device } = payload

  const onProgress = (p: any) => {
    emit({
      kind: 'progress',
      payload: {
        phase: p.phase || 'download',
        percent: p.fileCount ? Math.round((p.fileIndex / p.fileCount) * 100) : 0,
        message: p.message || '',
        file: p.fileName || '',
        loaded: p.fileIndex || 0,
        total: p.fileCount || 0,
      },
    })
  }

  // Check if client aborted
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }

  // Ensure MOSS models are downloaded/available in OPFS
  const NanoReaderBrowserModelStore = (globalThis as any).NanoReaderBrowserModelStore
  const modelSpec = await NanoReaderBrowserModelStore.ensureExternalBrowserOnnxModels({
    onProgress,
    accessToken: hfToken || '',
  })

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }

  // Initialize runtime
  if (!runtime) {
    runtime = createBrowserOnnxTtsRuntime({
      logger: (msg: string) => console.log('[MOSS Worker]', msg),
    })
  }

  const executionProviders = device === 'webgpu' ? ['webgpu', 'wasm'] : ['wasm']

  await runtime.configure({
    modelPath: modelSpec.managedPath,
    threadCount: 4, // default
    executionProviders,
  })

  await runtime.ensureManifestLoaded()
  await runtime.ensureSynthesisLoaded()

  emit({
    kind: 'ready',
    info: {
      device: (runtime.executionProviders?.includes('webgpu') ? 'webgpu' : 'wasm') as InferenceDevice,
      metadata: {},
    },
  })
}))

defineStreamInvokeHandler(context, mossGenerateEvent, toStreamHandler<MossGenerateRequest, MossGenerateChunk>(async ({ payload, emit, options }) => {
  if (!runtime) {
    throw new Error('MOSS TTS worker: No model loaded.')
  }

  const signal = options?.abortController?.signal
  const { text, voiceId, cpuThreads, attentionBackend: _attentionBackend, samplingMode, voiceCloneMaxTokens, promptAudioWaveform } = payload
  console.log('[MOSS Worker] generate request:', { voiceId, hasWaveform: !!promptAudioWaveform, waveformLen: promptAudioWaveform?.length })

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }

  // Configure threads dynamically
  if (cpuThreads) {
    const executionProviders = runtime.executionProviders || ['wasm']
    await runtime.configure({
      modelPath: runtime.localPathRoot || '',
      threadCount: cpuThreads,
      executionProviders,
    })
  }

  // Prepare extraVoices if we have a promptAudioWaveform (custom voice clone)
  const extraVoices: any[] = []
  if (promptAudioWaveform && voiceId) {
    // We need to encode the promptAudioWaveform
    await runtime.ensureCodecEncodeLoaded()
    const promptAudioCodes = await runtime.encodeReferenceAudioFromWaveform(promptAudioWaveform)
    extraVoices.push({
      voice: voiceId,
      display_name: voiceId,
      group: 'custom',
      audio_file: `${voiceId}.bin`,
      prompt_audio_codes: promptAudioCodes,
    })
  }

  await runtime.synthesizeVoiceClone({
    text,
    voiceName: voiceId,
    extraVoices,
    sampleMode: samplingMode,
    doSample: samplingMode === 'dynamic',
    streaming: false, // Generate full waveform then stream segments
    enableNormalizeTtsText: false, // done by Audio Studio / pipeline
    enableWeTextProcessing: false,
    voiceCloneMaxTextTokens: voiceCloneMaxTokens,
    onPreparedText: async () => {},
    isCancelled: () => signal?.aborted || false,
    onAudioChunk: async (chunk: any) => {
      if (signal?.aborted)
        return
      if (chunk.chunkData && chunk.chunkData[0]) {
        emit({
          samples: chunk.chunkData[0],
          samplingRate: chunk.sampleRate || 16000,
        })
      }
    },
  })
}))

defineInvokeHandler(context, mossUnloadEvent, async () => {
  runtime = null
})
