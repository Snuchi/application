import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { Profile } from '../shared/types'
import { IPC } from '../shared/ipc'

/**
 * Полупрозрачный оверлей со списком биндов и их горячими клавишами.
 * Окно без рамки, поверх всех, клико-прозрачное и не забирает фокус,
 * чтобы вставка по хоткеям продолжала работать.
 */

export interface OverlayData {
  title: string
  binds: { name: string; hotkey: string }[]
}

let win: BrowserWindow | null = null
let running = false
let enabled = true // F4 — вкл/выкл оверлей
let visible = true // F6 — скрыть/показать
let lastData: OverlayData = { title: '', binds: [] }

function buildData(profile: Profile): OverlayData {
  return {
    title: profile.name,
    binds: profile.otygrovki
      .filter((o) => o.hotkey)
      .map((o) => ({ name: o.name, hotkey: o.hotkey }))
  }
}

function contentHeight(): number {
  const rows = Math.max(lastData.binds.length, 1)
  return Math.min(40 + rows * 38 + 14, 900)
}

function createWindow(): BrowserWindow {
  if (win && !win.isDestroyed()) return win
  const { workArea } = screen.getPrimaryDisplay()
  win = new BrowserWindow({
    width: 260,
    height: contentHeight(),
    x: workArea.x + 16,
    y: workArea.y + 16,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    focusable: false,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })
  win.setAlwaysOnTop(true, 'screen-saver')
  win.setIgnoreMouseEvents(true)

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#overlay`)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'overlay' })
  }
  win.webContents.on('did-finish-load', () => push())
  return win
}

function push(): void {
  if (!win || win.isDestroyed()) return
  win.setContentSize(260, contentHeight())
  win.webContents.send(IPC.EvtOverlayData, lastData)
}

function applyVisibility(): void {
  if (!win || win.isDestroyed()) return
  if (running && enabled && visible) win.showInactive()
  else win.hide()
}

export const overlay = {
  /** Запустить оверлей для профиля. */
  start(profile: Profile): void {
    running = true
    lastData = buildData(profile)
    createWindow()
    push()
    applyVisibility()
  },
  /** Обновить данные (например, при редактировании активного профиля). */
  update(profile: Profile): void {
    lastData = buildData(profile)
    push()
  },
  stop(): void {
    running = false
    applyVisibility()
  },
  /** F4 — включить/выключить оверлей. */
  toggleEnabled(): void {
    enabled = !enabled
    applyVisibility()
  },
  /** F6 — скрыть/показать оверлей. */
  toggleVisible(): void {
    visible = !visible
    applyVisibility()
  },
  /** Показан ли оверлей сейчас. */
  isShown(): boolean {
    return running && enabled && visible
  },
  destroy(): void {
    if (win && !win.isDestroyed()) win.destroy()
    win = null
  }
}
