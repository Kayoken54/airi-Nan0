/**
 * Canonical sidebar definition for Project AIRI documentation.
 * Both the VitePress standalone site and the in-app docs viewer consume this file.
 *
 * Each consumer transforms items for its own format:
 * - VitePress: wraps links with withBase('/en/docs/{link}')
 * - In-app docs: uses relative links as-is
 */

export interface SharedSidebarItem {
  text: string
  link?: string
  items?: SharedSidebarItem[]
}

export interface SharedSidebarSection {
  id: string
  text: string
  titleKey: string
  icon: string
  defaultPath: string
  items: SharedSidebarItem[]
}

export const SHARED_SIDEBAR: SharedSidebarSection[] = [
  {
    id: 'overview',
    text: 'Overview',
    titleKey: 'settings.pages.docs.sections.overview',
    icon: 'lucide:rocket',
    defaultPath: 'overview/',
    items: [
      {
        text: 'Overview',
        items: [
          { text: 'Introduction', link: 'overview/' },
          { text: 'Versions & Downloads', link: 'overview/versions' },
          { text: 'About AI VTuber', link: 'overview/about-ai-vtuber' },
          { text: 'About Neuro-sama', link: 'overview/about-neuro-sama' },
          { text: 'Other Similar Projects', link: 'overview/other-similar-projects' },
        ],
      },
    ],
  },
  {
    id: 'showcase',
    text: 'Showcase',
    titleKey: 'settings.pages.docs.sections.showcase',
    icon: 'lucide:images',
    defaultPath: 'showcase/',
    items: [
      {
        text: 'Feature Showcase',
        items: [
          { text: 'Gallery', link: 'showcase/' },
          {
            text: 'Character System',
            items: [
              { text: 'AIRI Card System', link: 'showcase/01-card-system' },
              { text: 'AnimaDex Wizard', link: 'showcase/02-animadex-wizard' },
            ],
          },
          {
            text: 'Stage & Models',
            items: [
              { text: 'Model Selector', link: 'showcase/03-model-selector' },
              { text: 'Live2D System', link: 'showcase/04-live2d-system' },
            ],
          },
          {
            text: 'Chat & Desktop',
            items: [
              { text: 'Chatbox Redesign', link: 'showcase/05-chatbox-redesign' },
              { text: 'Desktop Control Strip', link: 'showcase/06-control-strip' },
            ],
          },
          {
            text: 'AI & Cognition',
            items: [
              { text: 'AI Producer', link: 'showcase/07-producer-subsystem' },
              { text: 'Situational Awareness', link: 'showcase/08-situational-awareness' },
            ],
          },
          {
            text: 'Creative & Platforms',
            items: [
              { text: 'Artistry', link: 'showcase/09-artistry' },
              { text: 'Discord Integration', link: 'showcase/10-discord-integration' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'manual',
    text: 'Manual',
    titleKey: 'settings.pages.docs.sections.manual',
    icon: 'lucide:book-open',
    defaultPath: 'manual/tamagotchi/',
    items: [
      {
        text: 'User Guides',
        items: [
          {
            text: 'Quick Start',
            items: [
              { text: 'Desktop Version', link: 'manual/tamagotchi/' },
              { text: 'Web Version', link: 'manual/web/' },
            ],
          },
          {
            text: 'Configuration',
            items: [
              { text: 'Settings Overview', link: 'manual/config/settings-overview' },
              { text: 'Character & Card', link: 'manual/config/character-card' },
              { text: 'Intelligence & Modules', link: 'manual/config/modules' },
              { text: 'System & Data', link: 'manual/config/system-data' },
              { text: 'Studio', link: 'manual/config/studio' },
              { text: 'Discord Commands', link: 'manual/config/discord-commands' },
            ],
          },
        ],
      },
      {
        text: 'Deep Architecture',
        items: [
          { text: 'Architecture Overview', link: 'advanced/' },
          {
            text: 'Pipelines & Workflows',
            items: [
              { text: 'Interaction Pipelines', link: 'advanced/architecture/arch-chat-stt-proactivity-pipelines' },
              { text: 'ComfyUI Native Engine', link: 'advanced/architecture/arch-comfyui-native-api-engine' },
              { text: 'Gateway Security', link: 'advanced/architecture/arch-gateway-security-hardening' },
              { text: 'Memory System', link: 'advanced/architecture/arch-memory-system-overview' },
              { text: 'Live2D Optimization', link: 'advanced/architecture/arch-live2d-wasm-optimization' },
              { text: 'Long-term Memory Journal', link: 'advanced/architecture/arch-long-term-memory-journal' },
              { text: 'MCP Integration', link: 'advanced/architecture/arch-mcp-integration' },
              { text: 'Provider Store Structure', link: 'advanced/architecture/arch-provider-store-current-structure' },
              { text: 'Short-term Memory Summaries', link: 'advanced/architecture/arch-short-term-memory-summaries' },
            ],
          },
          {
            text: 'System Components',
            items: [
              { text: 'Minecraft Integration', link: 'advanced/architecture/design-minecraft' },
              { text: 'Discord Bot Integration', link: 'advanced/architecture/design-discord-bot-integration' },
              { text: 'Satori Protocol', link: 'advanced/architecture/design-satori' },
              { text: 'Telegram Bot', link: 'advanced/architecture/design-telegram' },
            ],
          },
        ],
      },
      {
        text: 'Development',
        items: [
          { text: 'Environment Setup', link: 'contributing/' },
          { text: 'Desktop Development', link: 'contributing/tamagotchi' },
          { text: 'Web Development', link: 'contributing/webui' },
          { text: 'Docs Development', link: 'contributing/docs' },
        ],
      },
    ],
  },
  {
    id: 'chronicles',
    text: 'Chronicles',
    titleKey: 'settings.pages.docs.sections.chronicles',
    icon: 'lucide:calendar-days',
    defaultPath: 'chronicles/integration-checklist',
    items: [
      {
        text: 'Maintainer Status',
        items: [
          { text: 'Integration Checklist', link: 'chronicles/integration-checklist' },
        ],
      },
      {
        text: 'Project Evolution',
        items: [
          { text: 'Project Roadmap', link: 'chronicles/roadmap' },
          { text: 'Feature Report', link: 'chronicles/feature-report' },
        ],
      },
      {
        text: 'Version History',
        items: [
          { text: 'Initial Publish v0.1.0', link: 'chronicles/version-v0.1.0/' },
          { text: 'Before Story v0.0.1', link: 'chronicles/version-v0.0.1/' },
        ],
      },
    ],
  },
]
