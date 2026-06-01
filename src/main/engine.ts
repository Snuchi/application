import { BrowserWindow } from 'electron'
import { EngineState, Otygrovka, Profile } from '../shared/types'
import { IPC } from '../shared/ipc'
import { hotkeys } from './hotkeys'
import { inputReady, playOtygrovka } from './typer'
import { db } from './store'

/**
 * Движок отыгровок. Держит активный профиль, регистрирует его хоткеи
 * и проигрывает отыгровки. Шлёт состояние и логи в renderer.
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
      // Окно/контент могли быть уничтожены во время асинхронного проигрывания.
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

  /** Запускает профиль: вешает его хоткеи на проигрывание отыгровок. */
  async start(profileId: string): Promise<EngineState> {
    const profile = db.getProfile(profileId)
    if (!profile) return this.state

    await hotkeys.start()
    this.bindProfile(profile)

    this.state = { running: true, activeProfileId: profileId, playingOtygrovkaId: null }
    this.emitState()
    this.log(`▶ Профиль «${profile.name}» запущен`)

    // Диагностика: доступен ли нативный ввод и сколько хоткеев привязано.
    const bound = profile.otygrovki.filter((o) => o.hotkey).length
    this.log(`• Привязано хоткеев: ${bound}, хук клавиш: ${hotkeys.isNativeAvailable ? 'есть' : 'нет'}`)
    void inputReady().then((ready) =>
      this.log(`• Движок ввода: ${ready ? 'нативный (готов)' : 'dry-run (модуль не загружен)'}`)
    )
    return this.state
  }

  stop(): EngineState {
    hotkeys.setBindings([])
    this.abort = true
    this.state = { running: false, activeProfileId: null, playingOtygrovkaId: null }
    this.emitState()
    this.log('⏹ Биндер остановлен')
    return this.state
  }

  private bindProfile(profile: Profile): void {
    const bindings = profile.otygrovki
      .filter((o) => o.hotkey)
      .map((o) => ({
        combo: o.hotkey,
        handler: () => void this.play(profile, o)
      }))
    hotkeys.setBindings(bindings)
  }

  /** Проигрывает конкретную отыгровку. */
  async play(profile: Profile, otygrovka: Otygrovka): Promise<void> {
    if (this.playing) {
      this.log('⚠ Уже идёт воспроизведение, пропуск')
      return
    }
    this.playing = true
    this.abort = false
    this.state = { ...this.state, playingOtygrovkaId: otygrovka.id }
    this.emitState()
    this.log(`⏵ Отыгровка «${otygrovka.name}»`)

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

  /** Ручной запуск отыгровки по id (из UI, кнопка теста). */
  async playById(profileId: string, otygrovkaId: string): Promise<void> {
    const profile = db.getProfile(profileId)
    const otygrovka = profile?.otygrovki.find((o) => o.id === otygrovkaId)
    if (profile && otygrovka) await this.play(profile, otygrovka)
  }
}

export const engine = new Engine()
