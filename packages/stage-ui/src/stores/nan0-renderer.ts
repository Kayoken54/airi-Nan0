export interface Nan0RendererIdentity {
  instanceId: string
  hash: string
  isOwner: boolean
}

export function isNan0OwnerRenderer(hash: string): boolean {
  return hash.startsWith('#/chat')
}

export function createNan0RendererIdentity(
  hash: string,
  createId: () => string = () => crypto.randomUUID(),
): Nan0RendererIdentity {
  return {
    instanceId: createId(),
    hash,
    isOwner: isNan0OwnerRenderer(hash),
  }
}
