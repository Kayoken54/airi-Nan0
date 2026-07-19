const { app, BrowserWindow, ipcMain, session } = require('electron')
const { writeFileSync } = require('node:fs')
const { resolve } = require('node:path')

const profilePath = process.argv[2]
const outputPath = process.argv[3]
const evidencePath = process.argv[4]
if (!profilePath || !outputPath || !evidencePath)
  throw new Error('Temporary profile, candidate output, and evidence output paths are required.')

app.setPath('userData', resolve(profilePath))
app.commandLine.appendSwitch('disable-gpu')

app.whenReady().then(async () => {
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
    try {
      const url = new URL(details.url)
      callback({ cancel: !(details.resourceType === 'mainFrame' && url.hostname === 'localhost' && url.port === '5173') })
    }
    catch {
      callback({ cancel: true })
    }
  })

  const timeout = setTimeout(() => {
    console.error(JSON.stringify({ status: 'audit-timeout' }))
    app.exit(2)
  }, 10_000)

  ipcMain.once('nan0-audit-result', (_event, payload) => {
    clearTimeout(timeout)
    const candidates = Array.isArray(payload?.candidates) ? payload.candidates : []
    writeFileSync(outputPath, candidates.map(candidate => JSON.stringify(candidate)).join('\n') + (candidates.length ? '\n' : ''), 'utf8')
    writeFileSync(evidencePath, `${JSON.stringify(payload?.evidence ?? {}, null, 2)}\n`, 'utf8')
    console.log(JSON.stringify(payload?.summary ?? { status: 'missing-summary' }))
    app.exit(0)
  })

  const window = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: resolve(__dirname, '.codex-nan0-browser-audit-preload.cjs'),
      contextIsolation: false,
      nodeIntegration: true,
      sandbox: false,
    },
  })
  await window.loadURL('http://localhost:5173/__nan0_collaboration_audit__')
})
