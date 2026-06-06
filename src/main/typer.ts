/**
 * Ввод текста в активное поле через собственный нативный модуль avn-input
 * (Windows SendInput). Текст вставляется через буфер обмена (Ctrl+V) — мгновенно
 * и без зависимости от раскладки. Если модуль недоступен (не Windows / dev) —
 * режим dry-run (только лог).
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

function loadNative(): AvnInput | null {
  const candidates = [
    join(process.resourcesPath, 'avn_input.node'),
    join(process.resourcesPath, 'app.asar.unpacked', 'native', 'build', 'Release', 'avn_input.node'),
    join(app.getAppPath(), 'native', 'build', 'Release', 'avn_input.node')
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
const nativeAvailable = !!(nativeInput && nativeInput.available && nativeInput.available())

// Виртуальные коды клавиш Windows.
const VK = { CTRL: 17, ALT: 18, V: 86, ENTER: 13, F13: 0x7c }

export type LogFn = (line: string) => void

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, Math.max(0, ms)))
}

/** Готов ли реальный ввод. */
export async function inputReady(): Promise<boolean> {
  return nativeAvailable
}

/** Активный бэкенд ввода — для диагностики. */
export async function inputBackend(): Promise<'native' | 'none'> {
  return nativeAvailable ? 'native' : 'none'
}

/** Запущено ли приложение от имени администратора. */
export function isAdmin(): boolean {
  return nativeAvailable && !!nativeInput && nativeInput.isAdmin()
}

let warmed = false

/**
 * «Маска меню»: быстрый тап Ctrl. Вызывать СРАЗУ при срабатывании Alt-бинда,
 * пока Alt ещё физически зажат — тогда приложение считает Alt «использованным
 * в комбинации» и не активирует верхнее меню при отпускании Alt.
 */
export function maskMenu(): void {
  if (nativeAvailable && nativeInput) {
    try {
      nativeInput.keyDown(VK.CTRL)
      nativeInput.keyUp(VK.CTRL)
    } catch {
      /* ничего */
    }
  }
}

/** Прогрев буфера обмена и нативного ввода, чтобы первый бинд не тормозил. */
export async function warmup(): Promise<void> {
  if (warmed) return
  warmed = true
  try {
    const prev = clipboard.readText()
    clipboard.writeText('avn-warmup')
    clipboard.writeText(prev)
  } catch {
    /* ничего */
  }
  if (nativeAvailable && nativeInput) {
    try {
      nativeInput.keyDown(VK.CTRL)
      nativeInput.keyUp(VK.CTRL)
      nativeInput.keyDown(VK.F13) // не-модификатор, в приложениях ничего не делает
      nativeInput.keyUp(VK.F13)
    } catch {
      /* ничего */
    }
  }
}

export interface PlayOptions {
  messages: { text: string; delayMs: number }[]
  /** Если true — не нажимать Enter автоматически (пользователь жмёт сам). */
  manual?: boolean
  log?: LogFn
  shouldAbort?: () => boolean
}

/** Вставка через нативный SendInput: clipboard + Ctrl+V. */
async function pasteNative(a: AvnInput, text: string): Promise<void> {
  clipboard.writeText(text)
  await delay(80)
  a.keyDown(VK.CTRL)
  a.keyDown(VK.V)
  await delay(25)
  a.keyUp(VK.V)
  a.keyUp(VK.CTRL)
  await delay(15)
}

/**
 * Вставляет заготовленный текст в активное поле ввода (туда, где стоит курсор).
 */
export async function playOtygrovka(opts: PlayOptions): Promise<void> {
  const log = opts.log ?? (() => {})

  if (!nativeAvailable || !nativeInput) {
    for (const msg of opts.messages) {
      if (msg.text.trim()) log(`[dry-run] вставка: "${msg.text}"`)
    }
    log('⚠ Нативный модуль ввода не загружен — реальная вставка невозможна')
    return
  }
  const a = nativeInput
  const t0 = Date.now()

  // Сбросить возможный зажатый Ctrl.
  a.keyUp(VK.CTRL)

  for (let i = 0; i < opts.messages.length; i++) {
    if (opts.shouldAbort?.()) {
      log('⏹ Воспроизведение прервано')
      return
    }
    const msg = opts.messages[i]
    if (!msg.text.trim()) continue
    if (msg.delayMs > 0) await delay(msg.delayMs)

    try {
      await pasteNative(a, msg.text)
      if (!opts.manual) {
        a.keyDown(VK.ENTER)
        a.keyUp(VK.ENTER)
      }
      log(`✓ Вставлено за ${Date.now() - t0} мс: "${msg.text}"`)
    } catch (err) {
      log(`✗ Ошибка ввода: ${(err as Error).message}`)
    }
  }
}
