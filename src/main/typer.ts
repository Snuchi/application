/**
 * Эмуляция клавиатурного ввода в активное окно игры.
 *
 * Использует @nut-tree-fork/nut-js (опциональная нативная зависимость).
 * Если модуль не установлен/не собрался — работает в режиме "dry-run",
 * только логируя действия, чтобы остальное приложение оставалось рабочим.
 */

type NutModule = typeof import('@nut-tree-fork/nut-js')

let nut: NutModule | null = null
let nutReady = false

async function loadNut(): Promise<NutModule | null> {
  if (nutReady) return nut
  nutReady = true
  try {
    // Динамический импорт, чтобы отсутствие нативного модуля не роняло приложение.
    nut = (await import('@nut-tree-fork/nut-js')) as NutModule
    nut.keyboard.config.autoDelayMs = 4
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
  // Одиночная буква/цифра.
  if (n.length === 1) {
    const upper = n.toUpperCase()
    if (Key[upper] !== undefined) return Key[upper]
  }
  // Именованные клавиши (Enter, Space, F1...).
  if (Key[n] !== undefined) return Key[n]
  const cap = n.charAt(0).toUpperCase() + n.slice(1).toLowerCase()
  if (Key[cap] !== undefined) return Key[cap]
  return null
}

export interface PlayOptions {
  /** Клавиша открытия чата ("T"). */
  chatKey: string
  /** Глобальная задержка перед вставкой текста, мс. */
  pasteDelayMs: number
  messages: { text: string; delayMs: number }[]
  /** Если true — не отправлять автоматически (ждать внешнего триггера). */
  manual?: boolean
  log?: LogFn
  /** Функция, возвращающая true, если воспроизведение нужно прервать. */
  shouldAbort?: () => boolean
}

/**
 * Проигрывает отыгровку: для каждого сообщения открывает чат, печатает текст и жмёт Enter.
 */
export async function playOtygrovka(opts: PlayOptions): Promise<void> {
  const log = opts.log ?? (() => {})
  const mod = await loadNut()

  for (let i = 0; i < opts.messages.length; i++) {
    if (opts.shouldAbort?.()) {
      log('⏹ Воспроизведение прервано')
      return
    }
    const msg = opts.messages[i]
    await delay(msg.delayMs)

    if (!mod) {
      log(`[dry-run] ${opts.chatKey} → "${msg.text}" → Enter`)
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
      // 3. Ввести текст.
      await mod.keyboard.type(msg.text)
      // 4. Отправить (если не ручной режим).
      if (!opts.manual) {
        await mod.keyboard.pressKey(mod.Key.Enter)
        await mod.keyboard.releaseKey(mod.Key.Enter)
      }
      log(`✓ Отправлено: "${msg.text}"`)
    } catch (err) {
      log(`✗ Ошибка ввода: ${(err as Error).message}`)
    }
  }
}
