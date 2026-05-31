import { app, BrowserWindow, Menu, nativeImage, Tray, shell } from 'electron'
import { join } from 'path'
import { registerIpc } from './ipc'
import { engine } from './engine'
import { hotkeys } from './hotkeys'
import { db } from './store'
import { initUpdater } from './updater'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 640,
    minWidth: 820,
    minHeight: 560,
    show: false,
    frame: false,
    backgroundColor: '#15161b',
    title: 'RPBINDER',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  // Внешние ссылки открываем в браузере, а не в окне приложения.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Сворачивание в трей вместо закрытия.
  mainWindow.on('close', (e) => {
    if (db.getSettings().minimizeToTray && !isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

let isQuitting = false

function createTray(): void {
  // Пустая иконка-заглушка (заменяется ассетом при сборке).
  const image = nativeImage.createEmpty()
  tray = new Tray(image)
  tray.setToolTip('RPBINDER')
  const menu = Menu.buildFromTemplate([
    { label: 'Открыть', click: () => mainWindow?.show() },
    { label: 'Остановить биндер', click: () => engine.stop() },
    { type: 'separator' },
    {
      label: 'Выход',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])
  tray.setContextMenu(menu)
  tray.on('double-click', () => mainWindow?.show())
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
    createTray()
    initUpdater()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
}

app.on('before-quit', () => {
  isQuitting = true
  hotkeys.stop()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
