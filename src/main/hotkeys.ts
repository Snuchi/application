/**
 * Глобальные горячие клавиши через uiohook-napi (опциональная нативная зависимость).
 *
 * В отличие от Electron globalShortcut, низкоуровневый хук перехватывает нажатия
 * даже когда активно полноэкранное окно игры. Если модуль недоступен — менеджер
 * работает вхолостую (хоткеи не срабатывают), но приложение не падает.
 */

type UiohookModule = typeof import('uiohook-napi')

interface KeyEvent {
  keycode: number
  ctrlKey: boolean
  altKey: boolean
  shiftKey: boolean
  metaKey: boolean
}

let mod: UiohookModule | null = null
let started = false
let keycodeToName: Record<number, string> = {}

/** Имена модификаторов из UiohookKey, которые не должны попадать в "основную" клавишу. */
const MODIFIER_NAMES = new Set([
  'Ctrl',
  'CtrlRight',
  'Alt',
  'AltRight',
  'Shift',
  'ShiftRight',
  'Meta',
  'MetaRight'
])

async function load(): Promise<UiohookModule | null> {
  if (mod || started) return mod
  try {
    mod = (await import('uiohook-napi')) as UiohookModule
    // Построить обратную карту keycode -> человекочитаемое имя.
    keycodeToName = {}
    for (const [name, code] of Object.entries(mod.UiohookKey)) {
      if (typeof code === 'number' && keycodeToName[code] === undefined) {
        keycodeToName[code] = name
      }
    }
    return mod
  } catch (err) {
    console.warn('[hotkeys] нативный хук недоступен:', (err as Error).message)
    mod = null
    return null
  }
}

/** Строит строку комбинации вида "Ctrl+Shift+F5". */
function comboFromEvent(e: KeyEvent): string | null {
  const base = keycodeToName[e.keycode]
  if (!base || MODIFIER_NAMES.has(base)) return null
  const parts: string[] = []
  if (e.ctrlKey) parts.push('Ctrl')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')
  if (e.metaKey) parts.push('Meta')
  parts.push(base)
  return parts.join('+')
}

type Handler = () => void
type CaptureHandler = (combo: string) => void

const handlers = new Map<string, Handler>()
let captureHandler: CaptureHandler | null = null

export const hotkeys = {
  async start(): Promise<void> {
    const m = await load()
    if (!m || started) return
    m.uIOhook.on('keydown', (e: KeyEvent) => {
      const combo = comboFromEvent(e)
      if (!combo) return
      // Режим захвата: перехватываем комбинацию для назначения.
      if (captureHandler) {
        const cb = captureHandler
        captureHandler = null
        cb(combo)
        return
      }
      const handler = handlers.get(combo)
      if (handler) handler()
    })
    m.uIOhook.start()
    started = true
  },

  stop(): void {
    if (mod && started) {
      try {
        mod.uIOhook.stop()
      } catch {
        /* noop */
      }
    }
    started = false
    handlers.clear()
    captureHandler = null
  },

  /** Перерегистрирует весь набор хоткеев (combo -> callback). */
  setBindings(bindings: { combo: string; handler: Handler }[]): void {
    handlers.clear()
    for (const b of bindings) {
      if (b.combo) handlers.set(b.combo, b.handler)
    }
  },

  /** Начать захват одной комбинации; combo будет передан в onCaptured. */
  beginCapture(onCaptured: CaptureHandler): void {
    captureHandler = onCaptured
  },

  cancelCapture(): void {
    captureHandler = null
  },

  get isNativeAvailable(): boolean {
    return mod != null
  }
}
