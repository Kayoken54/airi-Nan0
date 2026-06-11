export function getTrustedOrigin(origin: string): string {
  // 1. Allow Dev (Localhost with any port)
  if (!origin || origin.startsWith('http://localhost:')) {
    return origin
  }

  // 2. Block all other production domains by default (can be extended by settings/env)
  return ''
}
