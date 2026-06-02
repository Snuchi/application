/**
 * Эмуляция клавиатурного ввода в активное поле ввода.
 *
 * Использует @nut-tree-fork/nut-js (опциональная нативная зависимость).
 * Если модуль не установлен/не собрался — работает в режиме "dry-run".
 *
 * Текст вставляется через буфер обмена (Ctrl+V) — мгновенно и без зависимости
 * от раскладки. Перед вставкой отпускаются модификаторы (Alt/Ctrl/Shift),
 * которые ещё могут быть зажаты после горячей комбинации.
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
    // Минимальная задержка между действиями — для максимальной скорости.
    nut.keyboard.config.autoDelayMs = 0
    return nut
  } catch (err) {
    console.warn('[typer] нативный модуль ввода недоступен, режим dry-run:', (err as Error).message)
    nut = null
    return null
  }
}

export type LogFn = (line: string) => void

/** Готов ли нативный ввод. Для диагностики в журнале. */
export async function inputReady(): Promise<boolean> {
  return (await loadNut()) != null
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, Math.max(0, ms)))
}

/** Отпускает модификаторы (Alt/Ctrl/Shift/Super) одним вызовом — быстро. */
async function releaseModifiers(mod: NutModule): Promise<void> {
  const K = mod.Key
  try {
    await mod.keyboard.releaseKey(
      K.LeftAlt,
      K.RightAlt,
      K.LeftControl,
      K.RightControl,
      K.LeftShift,
      K.RightShift,
      K.LeftSuper,
      K.RightSuper
    )
  } catch {
    /* клавиши не были зажаты — ок */
  }
}

export interface PlayOptions {
  messages: { text: string; delayMs: number }[]
  /** Если true — не нажимать Enter автоматически (пользователь жмёт сам). */
  manual?: boolean
  log?: LogFn
  shouldAbort?: () => boolean
}

/** Вставляет текст через буфер обмена (Ctrl+V). Не зависит от раскладки. */
async function pasteText(mod: NutModule, text: string): Promise<void> {
  clipboard.writeText(text)
  await delay(8)
  await mod.keyboard.pressKey(mod.Key.LeftControl, mod.Key.V)
  await delay(5)
  await mod.keyboard.releaseKey(mod.Key.V, mod.Key.LeftControl)
}

/**
 * Вставляет заготовленный текст в активное поле ввода (туда, где стоит курсор).
 */
export async function playOtygrovka(opts: PlayOptions): Promise<void> {
  const log = opts.log ?? (() => {})
  const mod = await loadNut()

  if (!mod) {
    for (const msg of opts.messages) {
      if (msg.text.trim()) log(`[dry-run] вставка: "${msg.text}"`)
    }
    log('⚠ Нативный модуль ввода не загружен — реальная вставка невозможна')
    return
  }

  // Снять зажатые модификаторы (после горячей комбинации) — минимальная пауза.
  await releaseModifiers(mod)
  await delay(12)

  for (let i = 0; i < opts.messages.length; i++) {
    if (opts.shouldAbort?.()) {
      log('⏹ Воспроизведение прервано')
      return
    }
    const msg = opts.messages[i]
    if (!msg.text.trim()) continue
    if (msg.delayMs > 0) await delay(msg.delayMs)

    try {
      await pasteText(mod, msg.text)
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
