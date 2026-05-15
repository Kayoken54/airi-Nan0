export type ChatActionMenuAction = 'copy' | 'delete' | 'fork' | 'edit' | 'retry'

export interface ChatActionMenuItem {
  action: ChatActionMenuAction
  label: string
  icon: string
  danger?: boolean
}

export function createChatActionMenuItems(options: {
  canCopy: boolean
  canDelete: boolean
  canFork?: boolean
  canEdit?: boolean
  canRetry?: boolean
}): ChatActionMenuItem[] {
  return [
    options.canCopy
      ? {
          action: 'copy',
          label: 'Copy',
          icon: 'i-solar:copy-bold',
        }
      : null,
    options.canEdit !== false
      ? {
          action: 'edit',
          label: 'Edit',
          icon: 'i-solar:pen-bold',
        }
      : null,
    options.canRetry !== false
      ? {
          action: 'retry',
          label: 'Retry',
          icon: 'i-solar:restart-bold',
        }
      : null,
    options.canFork !== false
      ? {
          action: 'fork',
          label: 'Fork',
          icon: 'i-solar:layers-bold-duotone',
        }
      : null,
    options.canDelete
      ? {
          action: 'delete',
          label: 'Delete',
          icon: 'i-solar:trash-bin-minimalistic-bold',
          danger: true,
        }
      : null,
  ].filter(Boolean) as ChatActionMenuItem[]
}

export { default as ChatActionMenu } from './index.vue'
