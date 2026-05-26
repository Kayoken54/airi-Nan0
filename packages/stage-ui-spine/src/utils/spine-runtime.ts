import type { SpineVersion } from './spine-version'

/**
 * Lazily loads the spine-webgl runtime for the given Spine version.
 *
 * Use when:
 * - The skeleton version has been detected and we need the matching runtime
 *   to parse and render the model correctly.
 *
 * Expects:
 * - A valid SpineVersion ('4.0', '4.1', or '4.2').
 *
 * Returns:
 * - The full spine-webgl module namespace for that version.
 */
export async function loadSpineRuntime(version: SpineVersion): Promise<typeof import('@esotericsoftware/spine-webgl')> {
  let runtime: typeof import('@esotericsoftware/spine-webgl')
  switch (version) {
    case '4.0':
      runtime = await import('@esotericsoftware/spine-webgl-4-0') as unknown as typeof import('@esotericsoftware/spine-webgl')
      break
    case '4.1':
      runtime = await import('@esotericsoftware/spine-webgl-4-1') as unknown as typeof import('@esotericsoftware/spine-webgl')
      break
    case '4.2':
      runtime = await import('@esotericsoftware/spine-webgl')
      break
    default:
      throw new Error(`Spine version ${version} is not supported yet.`)
  }

  if (runtime.GLTexture) {
    (runtime.GLTexture as any).DISABLE_UNPACK_PREMULTIPLIED_ALPHA_WEBGL = true
  }

  return runtime
}
