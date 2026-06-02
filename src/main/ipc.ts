import { app, BrowserWindow, clipboard, ipcMain } from 'electron'
import { IPC } from '../shared/ipc'
import { AppSettings, Profile } from '../shared/types'
import { db, newOtygrovka } from './store'
import { engine } from './engine'
import { hotkeys } from './hotkeys'
import { checkForUpdates, getUpdateStatus, installUpdate } from './updater'

/** Применяет настройку автозапуска приложения вместе с системой. */
export function applyAutoLaunch(enabled: boolean): void {
  if (!app.isPackaged) return
  app.setLoginItemSettings({ openAtLogin: enabled })
}

/** Регистрирует все IPC-обработчики. Вызывается один раз при старте. */
export function registerIpc(): void {
  // ---- Профили ----
  ipcMain.handle(IPC.ProfilesList, () => db.listProfiles())
  ipcMain.handle(IPC.ProfileGet, (_e, id: string) => db.getProfile(id))
  ipcMain.handle(IPC.ProfileCreate, (_e, partial?: Partial<Profile>) => db.createProfile(partial))
  ipcMain.handle(IPC.ProfileUpdate, (_e, id: string, patch: Partial<Profile>) => {
    const updated = db.updateProfile(id, patch)
    // Если редактируется активный профиль — перепривязать хоткеи.
    if (updated && engine.getState().activeProfileId === id) {
      void engine.start(id)
    }
    return updated
  })
  ipcMain.handle(IPC.ProfileDelete, (_e, id: string) => {
    if (engine.getState().activeProfileId === id) engine.stop()
    db.deleteProfile(id)
  })

  // ---- Настройки ----
  ipcMain.handle(IPC.SettingsGet, () => db.getSettings())
  ipcMain.handle(IPC.SettingsUpdate, (_e, patch: Partial<AppSettings>) => {
    const next = db.updateSettings(patch)
    if (patch.autoLaunch !== undefined) applyAutoLaunch(next.autoLaunch)
    return next
  })

  // ---- Движок ----
  ipcMain.handle(IPC.EngineStart, (_e, profileId: string) => engine.start(profileId))
  ipcMain.handle(IPC.EngineStop, () => engine.stop())
  ipcMain.handle(IPC.EngineState, () => engine.getState())
  ipcMain.handle(IPC.EnginePlay, (_e, profileId: string, otygrovkaId: string) =>
    engine.playById(profileId, otygrovkaId)
  )

  // ---- Захват хоткея ----
  ipcMain.handle(IPC.HotkeyCaptureStart, async () => {
    await hotkeys.start()
    hotkeys.beginCapture((combo) => {
      for (const win of BrowserWindow.getAllWindows()) {
        if (win.isDestroyed() || win.webContents.isDestroyed()) continue
        try {
          win.webContents.send(IPC.EvtHotkeyCaptured, combo)
        } catch {
          /* окно закрылось — игнорируем */
        }
      }
    })
    return hotkeys.isNativeAvailable
  })
  ipcMain.handle(IPC.HotkeyCaptureStop, () => hotkeys.cancelCapture())

  // Вспомогательный фабричный метод для UI: создать пустую отыгровку.
  ipcMain.handle('otygrovka:new', () => newOtygrovka())

  // ---- Буфер обмена ----
  ipcMain.handle(IPC.ClipboardWrite, (_e, text: string) => clipboard.writeText(text))

  // ---- Обновления / версия ----
  ipcMain.handle(IPC.AppVersion, () => app.getVersion())
  ipcMain.handle(IPC.UpdateCheck, () => checkForUpdates())
  ipcMain.handle(IPC.UpdateInstall, () => installUpdate())
  ipcMain.handle('update:status', () => getUpdateStatus())

  // ---- Управление окном ----
  ipcMain.handle(IPC.WindowMinimize, (e) => BrowserWindow.fromWebContents(e.sender)?.minimize())
  ipcMain.handle(IPC.WindowMaximize, (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win) return
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })
  ipcMain.handle(IPC.WindowClose, (e) => BrowserWindow.fromWebContents(e.sender)?.close())
}
