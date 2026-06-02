import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { applyAutoLaunch, registerIpc } from './ipc'
import { hotkeys } from './hotkeys'
import { overlay } from './overlay'
import { db } from './store'
import { initUpdater } from './updater'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 640,
    minWidth: 820,
    minHeight: 560,
    show: false,
    frame: false,
    backgroundColor: '#15161b',
    title: 'AVN Binder',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  // Внешние ссылки открываем в браузере — только http/https (без опасных схем).
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })

  // Запрещаем навигацию окна на внешние адреса.
  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://') && url !== process.env['ELECTRON_RENDERER_URL']) e.preventDefault()
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Один экземпляр приложения.
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    registerIpc()
    createWindow()
    initUpdater()
    applyAutoLaunch(db.getSettings().autoLaunch)

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
}

app.on('before-quit', () => {
  hotkeys.stop()
  overlay.destroy()
})

// Закрытие окна полностью закрывает приложение (без сворачивания в трей).
app.on('window-all-closed', () => {
  app.quit()
})
