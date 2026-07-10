import type { SharedSidebarItem } from '../../../../../docs/shared-sidebar'

import { SHARED_SIDEBAR } from '../../../../../docs/shared-sidebar'

export type { SharedSidebarItem as SidebarItem }

export const DOCS_SECTIONS = SHARED_SIDEBAR.map(section => ({
  id: section.id,
  titleKey: section.titleKey,
  icon: section.icon.startsWith('i-') ? section.icon : `i-${section.icon}`,
  defaultPath: section.defaultPath,
}))

export const DOCS_SIDEBAR: Record<string, SharedSidebarItem[]> = Object.fromEntries(
  SHARED_SIDEBAR.map(section => [section.id, section.items]),
)
