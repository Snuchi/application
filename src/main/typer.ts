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

// Кэшируем сам ПРОМИС загрузки — иначе при одновременных вызовах второй
// получал ещё не загруженный модуль (null) и уходил в dry-run.
let nutPromise: Promise<NutModule | null> | null = null
let warmed = false

function loadNut(): Promise<NutModule | null> {
  if (!nutPromise) {
    nutPromise = (async () => {
      try {
        const mod = (await import('@nut-tree-fork/nut-js')) as NutModule
        mod.keyboard.config.autoDelayMs = 0
        return mod
      } catch (err) {
        console.warn('[typer] нативный модуль ввода недоступен:', (err as Error).message)
        return null
      }
    })()
  }
  return nutPromise
}

export type LogFn = (line: string) => void

/** Готов ли нативный ввод. Для диагностики в журнале. */
export async function inputReady(): Promise<boolean> {
  return (await loadNut()) != null
}

/** Прогрев нативного провайдера ввода, чтобы первое срабатывание не тормозило. */
export async function warmup(): Promise<void> {
  if (warmed) return
  const mod = await loadNut()
  if (!mod) return
  try {
    // Реальное действие, чтобы инициализировать нативный провайдер заранее.
    await mod.keyboard.pressKey(mod.Key.LeftControl)
    await mod.keyboard.releaseKey(mod.Key.LeftControl)
    warmed = true
  } catch {
    /* ничего */
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, Math.max(0, ms)))
}

/** Отпускает все модификаторы (на всякий случай — обычно они уже отпущены). */
async function releaseAllModifiers(mod: NutModule): Promise<void> {
  const K = mod.Key
  try {
    await mod.keyboard.releaseKey(
      K.LeftAlt,
      K.RightAlt,
      K.LeftShift,
      K.RightShift,
      K.LeftSuper,
      K.RightSuper,
      K.LeftControl,
      K.RightControl
    )
  } catch {
    /* уже отпущены — ок */
  }
}

export interface PlayOptions {
  messages: { text: string; delayMs: number }[]
  /** Если true — не нажимать Enter автоматически (пользователь жмёт сам). */
  manual?: boolean
  /** Если true — снять фокус с меню приложения (для Alt-комбинаций в Word/Блокноте). */
  releaseMenuFocus?: boolean
  log?: LogFn
  shouldAbort?: () => boolean
}

/** Вставляет текст через буфер обмена (Ctrl+V). Не зависит от раскладки. */
async function pasteText(mod: NutModule, text: string): Promise<void> {
  clipboard.writeText(text)
  await delay(10)
  await mod.keyboard.pressKey(mod.Key.LeftControl, mod.Key.V)
  await delay(8)
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

  const t0 = Date.now()
  // Модификаторы к этому моменту уже отпущены (движок ждёт этого). На всякий случай.
  await releaseAllModifiers(mod)

  // Если бинд на Alt — снимаем возможный фокус со строки меню (Word/Блокнот):
  // одиночное нажатие Alt возвращает фокус из меню в документ.
  if (opts.releaseMenuFocus) {
    try {
      await mod.keyboard.pressKey(mod.Key.LeftAlt)
      await mod.keyboard.releaseKey(mod.Key.LeftAlt)
      await delay(25)
    } catch {
      /* ок */
    }
  }

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
      log(`✓ Вставлено за ${Date.now() - t0} мс: "${msg.text}"`)
    } catch (err) {
      log(`✗ Ошибка ввода: ${(err as Error).message}`)
    }
  }
}
