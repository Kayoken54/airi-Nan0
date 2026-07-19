export const NAN0_PROCESSOR_ID = 'local_nan0' as const

export type CognitionProcessorId = 'none' | typeof NAN0_PROCESSOR_ID

export interface AiriCognitionConfig {
  enabled: boolean
  processor: CognitionProcessorId
  provider?: string
  model?: string
  outputGuidance?: string
}

export interface Nan0ReasoningRoute {
  providerId: string
  model: string
}

export function isNan0ProcessorEnabled(config: AiriCognitionConfig | null | undefined): boolean {
  return config?.enabled === true && config.processor === NAN0_PROCESSOR_ID
}

export function resolveNan0ReasoningRoute(
  config: AiriCognitionConfig | null | undefined,
  fallback: Nan0ReasoningRoute,
): Nan0ReasoningRoute {
  if (!config || !isNan0ProcessorEnabled(config))
    return fallback

  return {
    providerId: config.provider?.trim() || fallback.providerId,
    model: config.model?.trim() || fallback.model,
  }
}
