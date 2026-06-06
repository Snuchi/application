import { BrowserWindow, globalShortcut } from 'electron'
import { EngineState, Otygrovka, Profile } from '../shared/types'
import { IPC } from '../shared/ipc'
import { hotkeys } from './hotkeys'
import { inputBackend, maskMenu, nativeDiag, playOtygrovka, warmup } from './typer'
import { overlay } from './overlay'
import { db } from './store'

/**
 * Движок биндов. Регистрирует глобальные горячие клавиши активного профиля
 * через Electron globalShortcut (перехватывает комбинацию у системы, поэтому
 * клавиша-триггер не «протекает» в активное поле ввода) и вставляет текст.
 */
class Engine {
  private state: EngineState = {
    running: false,
    activeProfileId: null,
    playingOtygrovkaId: null
  }
  private playing = false
  private abort = false

  private broadcast(channel: string, payload: unknown): void {
    for (const win of BrowserWindow.getAllWindows()) {
      if (win.isDestroyed() || win.webContents.isDestroyed()) continue
      try {
        win.webContents.send(channel, payload)
      } catch {
        /* окно закрылось между проверкой и отправкой — игнорируем */
      }
    }
  }

  private emitState(): void {
    this.broadcast(IPC.EvtEngineState, this.state)
  }

  private log(line: string): void {
    this.broadcast(IPC.EvtPlaybackLog, { time: Date.now(), line })
  }

  getState(): EngineState {
    return this.state
  }

  /** Преобразует сохранённую комбинацию в формат акселератора Electron. */
  private toAccelerator(combo: string): string {
    return combo
      .split('+')
      .map((p) => (p === 'Meta' ? 'Super' : p))
      .join('+')
  }

  /** Запускает профиль: регистрирует его горячие клавиши. */
  async start(profileId: string): Promise<EngineState> {
    const profile = db.getProfile(profileId)
    if (!profile) return this.state

    const { ok, total } = this.registerShortcuts(profile)
    // Запускаем низкоуровневый хук — для отслеживания отпускания клавиш.
    void hotkeys.start()
    try {
      overlay.start(profile)
    } catch (err) {
      this.log(`⚠ Оверлей не запустился: ${(err as Error).message}`)
    }
    void warmup()

    this.state = { running: true, activeProfileId: profileId, playingOtygrovkaId: null }
    this.emitState()
    this.log(`▶ Профиль «${profile.name}» запущен`)
    this.log(`• Привязано хоткеев: ${ok}/${total}`)
    void inputBackend().then((b) => {
      this.log(`• Движок ввода: ${b === 'native' ? 'нативный SendInput (готов)' : 'НЕ загружен'}`)
      this.log(`• native: ${nativeDiag}`)
    })
    return this.state
  }

  stop(): EngineState {
    globalShortcut.unregisterAll()
    overlay.stop()
    this.abort = true
    this.state = { running: false, activeProfileId: null, playingOtygrovkaId: null }
    this.emitState()
    this.log('⏹ Биндер остановлен')
    return this.state
  }

  /** Регистрирует горячие клавиши профиля + клавиши управления оверлеем. */
  private registerShortcuts(profile: Profile): { ok: number; total: number } {
    globalShortcut.unregisterAll()
    const withKeys = profile.otygrovki.filter((o) => o.hotkey)
    let ok = 0
    for (const o of withKeys) {
      const accel = this.toAccelerator(o.hotkey)
      try {
        const registered = globalShortcut.register(accel, () => void this.play(profile, o))
        if (registered) ok++
        else this.log(`⚠ Не удалось привязать «${o.hotkey}» — возможно, занята другой программой`)
      } catch {
        this.log(`⚠ Неверная комбинация «${o.hotkey}»`)
      }
    }

    // Клавиша скрытия/показа оверлея из настроек (F6).
    const settings = db.getSettings()
    const f6 = this.safeRegister(settings.overlayHideKey, () => {
      overlay.toggleVisible()
      this.log(`• Оверлей: ${overlay.isShown() ? 'показан' : 'скрыт'}`)
    })
    this.log(`• Скрыть/показать оверлей: ${settings.overlayHideKey} ${f6 ? '✓' : '✗'}`)

    return { ok, total: withKeys.length }
  }

  private safeRegister(combo: string, handler: () => void): boolean {
    if (!combo) return false
    try {
      return globalShortcut.register(this.toAccelerator(combo), handler)
    } catch {
      return false
    }
  }

  /** Проигрывает конкретный бинд. */
  async play(profile: Profile, otygrovka: Otygrovka): Promise<void> {
    if (this.playing) {
      this.log('⚠ Уже идёт воспроизведение, пропуск')
      return
    }
    this.playing = true
    this.abort = false

    // СРАЗУ гасим меню Alt (пока Alt ещё зажат) — тап Ctrl помечает Alt
    // «использованным», и при отпускании Alt меню приложения не активируется.
    if (/alt/i.test(otygrovka.hotkey)) maskMenu()

    this.state = { ...this.state, playingOtygrovkaId: otygrovka.id }
    this.emitState()
    overlay.flash(otygrovka.id)
    this.log(`⏵ Бинд «${otygrovka.name}»`)

    // Ждём, пока пользователь отпустит горячую комбинацию: иначе зажатый Alt
    // ломает Ctrl+V (становится Ctrl+Alt+V).
    if (hotkeys.modifiersDown()) {
      await hotkeys.waitForModifiersUp(700)
    }

    try {
      await playOtygrovka({
        messages: otygrovka.messages,
        // Всегда ручной режим: вставляем текст, Enter пользователь жмёт сам.
        manual: true,
        log: (l) => this.log(l),
        shouldAbort: () => this.abort
      })
    } finally {
      this.playing = false
      this.state = { ...this.state, playingOtygrovkaId: null }
      this.emitState()
    }
  }

  /** Ручной запуск бинда по id (из UI). */
  async playById(profileId: string, otygrovkaId: string): Promise<void> {
    const profile = db.getProfile(profileId)
    const otygrovka = profile?.otygrovki.find((o) => o.id === otygrovkaId)
    if (profile && otygrovka) await this.play(profile, otygrovka)
  }
}

export const engine = new Engine()
