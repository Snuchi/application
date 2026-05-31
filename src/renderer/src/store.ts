import { create } from 'zustand'
import type { AppSettings, EngineState, Otygrovka, Profile, UpdateStatus } from '@shared/types'

export type View = 'profiles' | 'profile' | 'otygrovka' | 'catalog' | 'help' | 'settings'

interface Nav {
  view: View
  profileId: string | null
  otygrovkaId: string | null
}

interface LogEntry {
  time: number
  line: string
}

/** Блок «Сохранить изменения?» в колонке навигации (управляется страницей-редактором). */
interface SaveBox {
  onSave: () => void
  onReset: () => void
}

interface State {
  nav: Nav
  profiles: Profile[]
  settings: AppSettings | null
  engine: EngineState
  logs: LogEntry[]
  saveBox: SaveBox | null
  appVersion: string
  update: UpdateStatus

  // навигация
  go: (view: View, profileId?: string | null, otygrovkaId?: string | null) => void
  setSaveBox: (box: SaveBox | null) => void

  // обновления
  checkUpdate: () => Promise<void>
  installUpdate: () => Promise<void>

  // данные
  refreshProfiles: () => Promise<void>
  refreshSettings: () => Promise<void>
  createProfile: () => Promise<void>
  updateProfile: (id: string, patch: Partial<Profile>) => Promise<void>
  deleteProfile: (id: string) => Promise<void>
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>

  // отыгровки (живут внутри профиля)
  addOtygrovka: (profileId: string) => Promise<string | null>
  updateOtygrovka: (profileId: string, otygrovka: Otygrovka) => Promise<void>
  deleteOtygrovka: (profileId: string, otygrovkaId: string) => Promise<void>

  // движок
  startEngine: (profileId: string) => Promise<void>
  stopEngine: () => Promise<void>

  // служебное
  init: () => Promise<void>
}

export const useStore = create<State>((set, get) => ({
  nav: { view: 'profiles', profileId: null, otygrovkaId: null },
  profiles: [],
  settings: null,
  engine: { running: false, activeProfileId: null, playingOtygrovkaId: null },
  logs: [],
  saveBox: null,
  appVersion: '',
  update: { state: 'idle' },

  go: (view, profileId = null, otygrovkaId = null) =>
    set({ nav: { view, profileId, otygrovkaId }, saveBox: null }),
  setSaveBox: (box) => set({ saveBox: box }),

  checkUpdate: async () => set({ update: await window.api.updateCheck() }),
  installUpdate: async () => window.api.updateInstall(),

  refreshProfiles: async () => set({ profiles: await window.api.listProfiles() }),
  refreshSettings: async () => set({ settings: await window.api.getSettings() }),

  createProfile: async () => {
    const profile = await window.api.createProfile()
    await get().refreshProfiles()
    get().go('profile', profile.id)
  },

  updateProfile: async (id, patch) => {
    await window.api.updateProfile(id, patch)
    await get().refreshProfiles()
  },

  deleteProfile: async (id) => {
    await window.api.deleteProfile(id)
    await get().refreshProfiles()
    get().go('profiles')
  },

  updateSettings: async (patch) => {
    const next = await window.api.updateSettings(patch)
    set({ settings: next })
  },

  addOtygrovka: async (profileId) => {
    const profile = await window.api.getProfile(profileId)
    if (!profile) return null
    const fresh = await window.api.newOtygrovka()
    await window.api.updateProfile(profileId, { otygrovki: [...profile.otygrovki, fresh] })
    await get().refreshProfiles()
    return fresh.id
  },

  updateOtygrovka: async (profileId, otygrovka) => {
    const profile = await window.api.getProfile(profileId)
    if (!profile) return
    const otygrovki = profile.otygrovki.map((o) => (o.id === otygrovka.id ? otygrovka : o))
    await window.api.updateProfile(profileId, { otygrovki })
    await get().refreshProfiles()
  },

  deleteOtygrovka: async (profileId, otygrovkaId) => {
    const profile = await window.api.getProfile(profileId)
    if (!profile) return
    const otygrovki = profile.otygrovki.filter((o) => o.id !== otygrovkaId)
    await window.api.updateProfile(profileId, { otygrovki })
    await get().refreshProfiles()
  },

  startEngine: async (profileId) => {
    const state = await window.api.engineStart(profileId)
    set({ engine: state })
  },

  stopEngine: async () => {
    const state = await window.api.engineStop()
    set({ engine: state })
  },

  init: async () => {
    await Promise.all([get().refreshProfiles(), get().refreshSettings()])
    set({
      engine: await window.api.engineState(),
      appVersion: await window.api.appVersion(),
      update: await window.api.updateStatus()
    })

    window.api.onEngineState((s) => set({ engine: s }))
    window.api.onPlaybackLog((entry) =>
      set((st) => ({ logs: [...st.logs.slice(-200), entry] }))
    )
    window.api.onUpdate((u) => set({ update: u }))
  }
}))
