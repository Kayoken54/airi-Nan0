import type { globalAppConfigSchema } from '../../configs/global'
import type { Config } from '../../libs/electron/persistence'
import type { I18n } from '../../libs/i18n'
import type { ServerChannel } from '../../services/airi/channel-server'

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import clickDragPlugin from 'electron-click-drag-plugin'

import { defineInvokeHandler } from '@moeru/eventa'
import { createContext } from '@moeru/eventa/adapters/electron/main'
import { BrowserWindow, ipcMain } from 'electron'
import { isLinux } from 'std-env'

import icon from '../../../../resources/icon.png?asset'

import { electronStartDraggingWindow } from '../../../shared/eventa'
import { baseUrl, load, withHashRoute } from '../../libs/electron/location'
import { setupBaseWindowElectronInvokes, transparentWindowConfig } from '../shared/window'

let isStageVisible = true

export function setStageVisibleState(visible: boolean) {
  isStageVisible = visible
}

export async function setupActorStageWindow(params: {
  appConfig: Config<typeof globalAppConfigSchema>
  serverChannel: ServerChannel
  i18n: I18n
}) {
  const getConfig = () => params.appConfig.get() ?? { language: 'en', windows: [] }
  const actorConfig = getConfig().windows?.find((w: any) => w.title === 'AIRI' && w.tag === 'actor')

  const window = new BrowserWindow({
    title: 'AIRI - Actor Stage',
    width: actorConfig?.width ?? 450.0,
    height: actorConfig?.height ?? 600.0,
    x: actorConfig?.x,
    y: actorConfig?.y,
    show: false,
    icon,
    webPreferences: {
      preload: resolve(dirname(fileURLToPath(import.meta.url)), '../preload/index.cjs'),
      sandbox: true,
    },
    type: 'panel',
    alwaysOnTop: true,
    ...transparentWindowConfig(),
  })

  window.setMovable(true)
  window.setResizable(true)

  const { context } = createContext(ipcMain, window)
  await setupBaseWindowElectronInvokes({ context, window, serverChannel: params.serverChannel, i18n: params.i18n })

  if (!isLinux) {
    defineInvokeHandler(context, electronStartDraggingWindow, (_payload, handlerOptions: any) => {
      try {
        const sender = handlerOptions?.raw?.ipcMainEvent?.sender
        const win = sender ? (BrowserWindow.fromWebContents(sender) ?? window) : window
        const windowId = win.getNativeWindowHandle()
        clickDragPlugin.startDrag(windowId)
      }
      catch (error) {
        console.error(error)
      }
    })
  }

  window.on('ready-to-show', () => {
    if (isStageVisible) {
      window.show()
    }
  })

  await load(window, withHashRoute(baseUrl(resolve(dirname(fileURLToPath(import.meta.url)), '..', 'renderer')), '/actor'))

  return window
}
