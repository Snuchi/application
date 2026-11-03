import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { Profile } from '../shared/types'
import { IPC } from '../shared/ipc'

/**
 * Полупрозрачный оверлей со списком биндов и их горячими клавишами.
 * Окно без рамки, поверх всех, клико-прозрачное и не забирает фокус.
 * Прячется/показывается клавишей из настроек (F6).
 */

export interface OverlayData {
  title: string
  binds: { id: string; name: string; hotkey: string }[]
}

let win: BrowserWindow | null = null
let running = false
let visible = true // F6 — скрыть/показать
let lastData: OverlayData = { title: '', binds: [] }
let lastToggle = 0

function buildData(profile: Profile): OverlayData {
  return {
    title: profile.name,
    binds: profile.otygrovki
      .filter((o) => o.hotkey)
      .map((o) => ({ id: o.id, name: o.name, hotkey: o.hotkey }))
  }
}

/** Высота по числу биндов, но не выше рабочей области экрана (дальше — прокрутка). */
function contentHeight(): number {
  const rows = Math.max(lastData.binds.length, 1)
  const maxHeight = screen.getPrimaryDisplay().workArea.height - 32
  return Math.min(40 + rows * 38 + 14, maxHeight)
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
  // Клики проходят насквозь, но движение мыши пересылается в оверлей —
  // так он узнаёт о наведении и включает прокрутку колёсиком (см. setInteractive).
  win.setIgnoreMouseEvents(true, { forward: true })

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
  if (running && visible) {
    win.showInactive()
  } else {
    // Скрывая оверлей, возвращаем сквозные клики — mouseleave может не прийти.
    win.setIgnoreMouseEvents(true, { forward: true })
    win.hide()
  }
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
  /** F6 — скрыть/показать оверлей (с анти-дребезгом). */
  toggleVisible(): void {
    const now = Date.now()
    if (now - lastToggle < 300) return
    lastToggle = now
    visible = !visible
    applyVisibility()
  },
  /** Подсветить сработавший бинд в оверлее. */
  flash(otygrovkaId: string): void {
    if (!win || win.isDestroyed()) return
    win.webContents.send(IPC.EvtOverlayFlash, otygrovkaId)
  },
  isShown(): boolean {
    return running && visible
  },
  /**
   * Курсор над оверлеем — принимаем мышь (колёсико прокручивает список);
   * курсор ушёл — снова пропускаем клики насквозь. Окно не фокусируемое,
   * поэтому фокус остаётся в приложении пользователя.
   */
  setInteractive(interactive: boolean): void {
    if (!win || win.isDestroyed()) return
    win.setIgnoreMouseEvents(!interactive, { forward: true })
  },
  destroy(): void {
    if (win && !win.isDestroyed()) win.destroy()
    win = null
  }
}
