/**
 * Эмуляция клавиатурного ввода в активное окно игры.
 *
 * Использует @nut-tree-fork/nut-js (опциональная нативная зависимость).
 * Если модуль не установлен/не собрался — работает в режиме "dry-run",
 * только логируя действия, чтобы остальное приложение оставалось рабочим.
 *
 * Текст вставляется через буфер обмена (Ctrl+V) — это надёжнее посимвольного
 * ввода и не ломается на раскладке. Перед вводом принудительно отпускаются
 * клавиши-модификаторы (Alt/Ctrl/Shift), которые ещё могут быть зажаты после
 * нажатия горячей комбинации — иначе вместо текста игра получает Alt+буква.
 */
import { clipboard } from 'electron'

type NutModule = typeof import('@nut-tree-fork/nut-js')

let nut: NutModule | null = null
let nutReady = false

async function loadNut(): Promise<NutModule | null> {
  if (nutReady) return nut
  nutReady = true
  try {
    nut = (await import('@nut-tree-fork/nut-js')) as NutModule
    nut.keyboard.config.autoDelayMs = 3
    return nut
  } catch (err) {
    console.warn('[typer] нативный модуль ввода недоступен, режим dry-run:', (err as Error).message)
    nut = null
    return null
  }
}

export type LogFn = (line: string) => void

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, Math.max(0, ms)))
}

/** Карта строковых имён клавиш открытия чата -> Key из nut-js. */
function resolveKey(mod: NutModule, name: string): number | null {
  const Key = mod.Key as unknown as Record<string, number>
  const n = name.trim()
  if (!n) return null
  if (n.length === 1) {
    const upper = n.toUpperCase()
    if (Key[upper] !== undefined) return Key[upper]
  }
  if (Key[n] !== undefined) return Key[n]
  const cap = n.charAt(0).toUpperCase() + n.slice(1).toLowerCase()
  if (Key[cap] !== undefined) return Key[cap]
  return null
}

/** Отпускает все клавиши-модификаторы, которые могли остаться зажатыми. */
async function releaseModifiers(mod: NutModule): Promise<void> {
  const Key = mod.Key as unknown as Record<string, number>
  const names = [
    'LeftAlt',
    'RightAlt',
    'LeftControl',
    'RightControl',
    'LeftShift',
    'RightShift',
    'LeftSuper',
    'RightSuper'
  ]
  for (const name of names) {
    const code = Key[name]
    if (code === undefined) continue
    try {
      await mod.keyboard.releaseKey(code)
    } catch {
      /* клавиша не была зажата — ок */
    }
  }
}

export interface PlayOptions {
  /** Клавиша открытия чата ("T"). */
  chatKey: string
  /** Глобальная задержка перед вставкой текста, мс. */
  pasteDelayMs: number
  messages: { text: string; delayMs: number }[]
  /** Если true — не нажимать Enter автоматически (пользователь жмёт сам). */
  manual?: boolean
  log?: LogFn
  shouldAbort?: () => boolean
}

/** Вставляет текст в чат через буфер обмена (Ctrl+V). */
async function pasteText(mod: NutModule, text: string): Promise<void> {
  clipboard.writeText(text)
  await delay(20)
  await mod.keyboard.pressKey(mod.Key.LeftControl, mod.Key.V)
  await mod.keyboard.releaseKey(mod.Key.V, mod.Key.LeftControl)
}

/**
 * Проигрывает бинд: открывает чат, вставляет текст. Enter — на усмотрение режима.
 */
export async function playOtygrovka(opts: PlayOptions): Promise<void> {
  const log = opts.log ?? (() => {})
  const mod = await loadNut()

  // Дать пользователю отпустить горячую комбинацию и снять модификаторы,
  // чтобы ввод не превратился в Alt+буква и не дёргал окна.
  if (mod) {
    await releaseModifiers(mod)
    await delay(120)
  }

  for (let i = 0; i < opts.messages.length; i++) {
    if (opts.shouldAbort?.()) {
      log('⏹ Воспроизведение прервано')
      return
    }
    const msg = opts.messages[i]
    if (!msg.text.trim()) continue
    await delay(msg.delayMs)

    if (!mod) {
      log(`[dry-run] ${opts.chatKey} → "${msg.text}"`)
      continue
    }

    const chatKey = resolveKey(mod, opts.chatKey)
    try {
      // 1. Открыть чат.
      if (chatKey != null) {
        await mod.keyboard.pressKey(chatKey)
        await mod.keyboard.releaseKey(chatKey)
      }
      // 2. Дождаться, пока чат откроется.
      await delay(opts.pasteDelayMs)
      // 3. Вставить текст из буфера обмена.
      await pasteText(mod, msg.text)
      // 4. Отправить, только если не ручной режим.
      if (!opts.manual) {
        await mod.keyboard.pressKey(mod.Key.Enter)
        await mod.keyboard.releaseKey(mod.Key.Enter)
      }
      log(`✓ Вставлено: "${msg.text}"`)
    } catch (err) {
      log(`✗ Ошибка ввода: ${(err as Error).message}`)
    }
  }
}
