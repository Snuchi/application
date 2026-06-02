import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc'
import { AppSettings, EngineState, Otygrovka, Profile, UpdateStatus } from '../shared/types'

const api = {
  // Профили
  listProfiles: (): Promise<Profile[]> => ipcRenderer.invoke(IPC.ProfilesList),
  getProfile: (id: string): Promise<Profile | undefined> => ipcRenderer.invoke(IPC.ProfileGet, id),
  createProfile: (partial?: Partial<Profile>): Promise<Profile> =>
    ipcRenderer.invoke(IPC.ProfileCreate, partial),
  updateProfile: (id: string, patch: Partial<Profile>): Promise<Profile | undefined> =>
    ipcRenderer.invoke(IPC.ProfileUpdate, id, patch),
  deleteProfile: (id: string): Promise<void> => ipcRenderer.invoke(IPC.ProfileDelete, id),
  newOtygrovka: (): Promise<Otygrovka> => ipcRenderer.invoke('otygrovka:new'),

  // Настройки
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke(IPC.SettingsGet),
  updateSettings: (patch: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC.SettingsUpdate, patch),

  // Движок
  engineStart: (profileId: string): Promise<EngineState> =>
    ipcRenderer.invoke(IPC.EngineStart, profileId),
  engineStop: (): Promise<EngineState> => ipcRenderer.invoke(IPC.EngineStop),
  engineState: (): Promise<EngineState> => ipcRenderer.invoke(IPC.EngineState),
  enginePlay: (profileId: string, otygrovkaId: string): Promise<void> =>
    ipcRenderer.invoke(IPC.EnginePlay, profileId, otygrovkaId),

  // Захват хоткея
  hotkeyCaptureStart: (): Promise<boolean> => ipcRenderer.invoke(IPC.HotkeyCaptureStart),
  hotkeyCaptureStop: (): Promise<void> => ipcRenderer.invoke(IPC.HotkeyCaptureStop),

  // Окно
  windowMinimize: (): Promise<void> => ipcRenderer.invoke(IPC.WindowMinimize),
  windowMaximize: (): Promise<void> => ipcRenderer.invoke(IPC.WindowMaximize),
  windowClose: (): Promise<void> => ipcRenderer.invoke(IPC.WindowClose),

  // Буфер обмена
  clipboardWrite: (text: string): Promise<void> => ipcRenderer.invoke(IPC.ClipboardWrite, text),

  // Шаринг профиля
  shareUpload: (code: string): Promise<string | null> => ipcRenderer.invoke(IPC.ShareUpload, code),
  shareResolve: (input: string): Promise<string> => ipcRenderer.invoke(IPC.ShareResolve, input),

  // Обновления / версия
  appVersion: (): Promise<string> => ipcRenderer.invoke(IPC.AppVersion),
  updateCheck: (): Promise<UpdateStatus> => ipcRenderer.invoke(IPC.UpdateCheck),
  updateStatus: (): Promise<UpdateStatus> => ipcRenderer.invoke('update:status'),
  updateInstall: (): Promise<void> => ipcRenderer.invoke(IPC.UpdateInstall),
  onUpdate: (cb: (s: UpdateStatus) => void): (() => void) => {
    const h = (_e: unknown, s: UpdateStatus): void => cb(s)
    ipcRenderer.on(IPC.EvtUpdate, h)
    return () => ipcRenderer.removeListener(IPC.EvtUpdate, h)
  },

  // Подписки на события main -> renderer
  onEngineState: (cb: (s: EngineState) => void): (() => void) => {
    const h = (_e: unknown, s: EngineState): void => cb(s)
    ipcRenderer.on(IPC.EvtEngineState, h)
    return () => ipcRenderer.removeListener(IPC.EvtEngineState, h)
  },
  onHotkeyCaptured: (cb: (combo: string) => void): (() => void) => {
    const h = (_e: unknown, combo: string): void => cb(combo)
    ipcRenderer.on(IPC.EvtHotkeyCaptured, h)
    return () => ipcRenderer.removeListener(IPC.EvtHotkeyCaptured, h)
  },
  onPlaybackLog: (cb: (entry: { time: number; line: string }) => void): (() => void) => {
    const h = (_e: unknown, entry: { time: number; line: string }): void => cb(entry)
    ipcRenderer.on(IPC.EvtPlaybackLog, h)
    return () => ipcRenderer.removeListener(IPC.EvtPlaybackLog, h)
  },
  onOverlayData: (
    cb: (data: { title: string; binds: { id: string; name: string; hotkey: string }[] }) => void
  ): (() => void) => {
    const h = (
      _e: unknown,
      data: { title: string; binds: { id: string; name: string; hotkey: string }[] }
    ): void => cb(data)
    ipcRenderer.on(IPC.EvtOverlayData, h)
    return () => ipcRenderer.removeListener(IPC.EvtOverlayData, h)
  },
  onOverlayFlash: (cb: (id: string) => void): (() => void) => {
    const h = (_e: unknown, id: string): void => cb(id)
    ipcRenderer.on(IPC.EvtOverlayFlash, h)
    return () => ipcRenderer.removeListener(IPC.EvtOverlayFlash, h)
  }
}

export type RPBinderApi = typeof api

contextBridge.exposeInMainWorld('api', api)
