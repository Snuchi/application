import Store from 'electron-store'
import { nanoid } from 'nanoid'
import { AppSettings, DEFAULT_SETTINGS, Otygrovka, Profile, RPMessage } from '../shared/types'

interface Schema {
  profiles: Profile[]
  settings: AppSettings
}

const store = new Store<Schema>({
  name: 'rpbinder',
  defaults: {
    profiles: [],
    settings: DEFAULT_SETTINGS
  }
})

/** Генерирует короткую публичную ссылку профиля. */
function makeLink(): string {
  return `https://rpbinder.com/i/${nanoid(8)}`
}

export function newMessage(partial: Partial<RPMessage> = {}): RPMessage {
  return { id: nanoid(), text: 'Текст скрипта', delayMs: 0, ...partial }
}

export function newOtygrovka(partial: Partial<Otygrovka> = {}): Otygrovka {
  return {
    id: nanoid(),
    name: 'Новый бинд',
    hotkey: '',
    messages: [newMessage()],
    disableAutoSend: false,
    recordVideo: false,
    ...partial
  }
}

export function newProfile(partial: Partial<Profile> = {}): Profile {
  const now = Date.now()
  return {
    id: nanoid(),
    name: 'Новый профиль',
    link: makeLink(),
    isPublic: false,
    chatKey: 'T',
    pasteDelayMs: 100,
    otygrovki: [],
    views: 0,
    createdAt: now,
    updatedAt: now,
    ...partial
  }
}

export const db = {
  listProfiles(): Profile[] {
    return store.get('profiles')
  },

  getProfile(id: string): Profile | undefined {
    return store.get('profiles').find((p) => p.id === id)
  },

  createProfile(partial: Partial<Profile> = {}): Profile {
    const profile = newProfile(partial)
    store.set('profiles', [...store.get('profiles'), profile])
    return profile
  },

  updateProfile(id: string, patch: Partial<Profile>): Profile | undefined {
    const profiles = store.get('profiles')
    const idx = profiles.findIndex((p) => p.id === id)
    if (idx === -1) return undefined
    const updated: Profile = { ...profiles[idx], ...patch, id, updatedAt: Date.now() }
    profiles[idx] = updated
    store.set('profiles', profiles)
    return updated
  },

  deleteProfile(id: string): void {
    store.set(
      'profiles',
      store.get('profiles').filter((p) => p.id !== id)
    )
  },

  getSettings(): AppSettings {
    return { ...DEFAULT_SETTINGS, ...store.get('settings') }
  },

  updateSettings(patch: Partial<AppSettings>): AppSettings {
    const next = { ...this.getSettings(), ...patch }
    store.set('settings', next)
    return next
  }
}
