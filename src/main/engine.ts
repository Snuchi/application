import { BrowserWindow, globalShortcut } from 'electron'
import { EngineState, Otygrovka, Profile } from '../shared/types'
import { IPC } from '../shared/ipc'
import { inputReady, playOtygrovka, warmup } from './typer'
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
    void inputReady().then((ready) =>
      this.log(`• Движок ввода: ${ready ? 'нативный (готов)' : 'dry-run (модуль не загружен)'}`)
    )
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

    // Клавиши управления оверлеем из настроек (F4 — вкл/выкл, F6 — скрыть/показать).
    const settings = db.getSettings()
    this.safeRegister(settings.overlayToggleKey, () => overlay.toggleEnabled())
    this.safeRegister(settings.overlayHideKey, () => overlay.toggleVisible())

    return { ok, total: withKeys.length }
  }

  private safeRegister(combo: string, handler: () => void): void {
    if (!combo) return
    try {
      globalShortcut.register(this.toAccelerator(combo), handler)
    } catch {
      /* неверная комбинация — пропускаем */
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
    this.state = { ...this.state, playingOtygrovkaId: otygrovka.id }
    this.emitState()
    this.log(`⏵ Бинд «${otygrovka.name}»`)

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
