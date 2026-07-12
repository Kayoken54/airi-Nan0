const { app, BrowserWindow } = require('electron')

app.whenReady().then(() => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  win.loadURL('http://localhost:5173')

  win.webContents.on('did-finish-load', async () => {
    try {
      const result = await win.webContents.executeJavaScript(`
        (async () => {
          const keys = await localforage.keys();
          const models = [];
          for (const key of keys) {
            if (key.startsWith('display-model-')) {
              const val = await localforage.getItem(key);
              models.push({ 
                key, 
                name: val?.name, 
                emotionMappings: val?.emotionMappings, 
                motionMappings: val?.motionMappings 
              });
            }
          }
          return { keys, models };
        })()
      `)
      console.log('TOTAL KEYS:', result.keys.length)
      console.log('MODELS:', JSON.stringify(result.models, null, 2))
    }
    catch (e) {
      console.error('JS EXECUTION ERROR:', e)
    }
    finally {
      app.quit()
    }
  })
})
