/**
 * Ввод текста в активное поле.
 *
 * Основной способ — собственный нативный модуль avn-input (Windows SendInput),
 * как в проверенных биндерах: надёжно и быстро. Если он недоступен (например,
 * при разработке на Linux) — пробуем nut-js, иначе режим dry-run (только лог).
 *
 * Текст вставляется через буфер обмена (Ctrl+V) — мгновенно и без зависимости
 * от раскладки.
 */
import { app, clipboard } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'

interface AvnInput {
  keyDown(vk: number): void
  keyUp(vk: number): void
  isAdmin(): boolean
  available(): boolean
}

// require доступен в CJS-бандле main (electron-vite). Объявляем для типов.
declare const require: NodeRequire

/** Диагностика загрузки нативного модуля — выводится в журнал. */
export let nativeDiag = ''

/** Загружает нативный модуль ввода по абсолютному пути. */
function loadNative(): AvnInput | null {
  const candidates = [
    join(process.resourcesPath, 'avn_input.node'),
    join(app.getAppPath(), 'native', 'build', 'Release', 'avn_input.node'),
    join(process.resourcesPath, 'app.asar.unpacked', 'native', 'build', 'Release', 'avn_input.node')
  ]
  for (const file of candidates) {
    if (!existsSync(file)) continue
    try {
      const mod = require(file) as AvnInput
      nativeDiag = `загружен: ${file}`
      return mod
    } catch (err) {
      nativeDiag = `ошибка загрузки ${file}: ${(err as Error).message}`
      return null
    }
  }
  nativeDiag = `файл не найден. resourcesPath=${process.resourcesPath}`
  return null
}

const nativeInput: AvnInput | null = loadNative()

// Виртуальные коды клавиш Windows.
const VK = { CTRL: 17, ALT: 18, V: 86, ENTER: 13 }

export type LogFn = (line: string) => void

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, Math.max(0, ms)))
}

// ---- Запасной бэкенд nut-js (для не-Windows разработки) ----
type NutModule = typeof import('@nut-tree-fork/nut-js')
let nutPromise: Promise<NutModule | null> | null = null
function loadNut(): Promise<NutModule | null> {
  if (!nutPromise) {
    nutPromise = (async () => {
      try {
        const mod = (await import('@nut-tree-fork/nut-js')) as NutModule
        mod.keyboard.config.autoDelayMs = 0
        return mod
      } catch {
        return null
      }
    })()
  }
  return nutPromise
}

const nativeAvailable = !!(nativeInput && nativeInput.available && nativeInput.available())

/** Готов ли реальный ввод (нативный модуль). */
export async function inputReady(): Promise<boolean> {
  if (nativeAvailable) return true
  return (await loadNut()) != null
}

/** Какой бэкенд ввода активен — для диагностики. */
export async function inputBackend(): Promise<'native' | 'nut' | 'none'> {
  if (nativeAvailable) return 'native'
  return (await loadNut()) ? 'nut' : 'none'
}

/** Запущено ли приложение от имени администратора. */
export function isAdmin(): boolean {
  return nativeAvailable && !!nativeInput && nativeInput.isAdmin()
}

export async function warmup(): Promise<void> {
  if (!nativeAvailable) await loadNut()
}

export interface PlayOptions {
  messages: { text: string; delayMs: number }[]
  /** Если true — не нажимать Enter автоматически (пользователь жмёт сам). */
  manual?: boolean
  /** Снять фокус со строки меню приложения (для Alt-комбинаций в Word/Блокноте). */
  releaseMenuFocus?: boolean
  log?: LogFn
  shouldAbort?: () => boolean
}

/** Вставка через нативный SendInput: clipboard + Ctrl+V. */
async function pasteNative(text: string): Promise<void> {
  const a = nativeInput!
  clipboard.writeText(text)
  await delay(90) // дать буферу обмена «осесть» (как в проверенных биндерах)
  a.keyDown(VK.CTRL)
  a.keyDown(VK.V)
  await delay(30)
  a.keyUp(VK.V)
  a.keyUp(VK.CTRL)
  await delay(15)
}

/** Вставка через nut-js (запасной путь). */
async function pasteNut(mod: NutModule, text: string): Promise<void> {
  clipboard.writeText(text)
  await delay(90)
  await mod.keyboard.pressKey(mod.Key.LeftControl, mod.Key.V)
  await delay(30)
  await mod.keyboard.releaseKey(mod.Key.V, mod.Key.LeftControl)
}

/**
 * Вставляет заготовленный текст в активное поле ввода (туда, где стоит курсор).
 */
export async function playOtygrovka(opts: PlayOptions): Promise<void> {
  const log = opts.log ?? (() => {})
  const mod = nativeAvailable ? null : await loadNut()

  if (!nativeAvailable && !mod) {
    for (const msg of opts.messages) {
      if (msg.text.trim()) log(`[dry-run] вставка: "${msg.text}"`)
    }
    log('⚠ Нативный модуль ввода не загружен — реальная вставка невозможна')
    return
  }

  const t0 = Date.now()

  // Сбросить возможный зажатый Ctrl (после Ctrl-комбинаций).
  if (nativeAvailable && nativeInput) {
    nativeInput.keyUp(VK.CTRL)
  }

  // Для Alt-биндов вернуть фокус из строки меню в документ (Word/Блокнот):
  // одиночное нажатие Alt закрывает активированное меню.
  if (opts.releaseMenuFocus && nativeAvailable && nativeInput) {
    nativeInput.keyDown(VK.ALT)
    nativeInput.keyUp(VK.ALT)
    await delay(25)
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
      if (nativeAvailable) {
        await pasteNative(msg.text)
        if (!opts.manual) {
          nativeInput!.keyDown(VK.ENTER)
          nativeInput!.keyUp(VK.ENTER)
        }
      } else if (mod) {
        await pasteNut(mod, msg.text)
        if (!opts.manual) {
          await mod.keyboard.pressKey(mod.Key.Enter)
          await mod.keyboard.releaseKey(mod.Key.Enter)
        }
      }
      log(`✓ Вставлено за ${Date.now() - t0} мс: "${msg.text}"`)
    } catch (err) {
      log(`✗ Ошибка ввода: ${(err as Error).message}`)
    }
  }
}
