import type { Profile } from '@shared/types'

/** Полезная нагрузка профиля для обмена между пользователями. */
interface SharePayload {
  name: string
  chatKey: string
  pasteDelayMs: number
  otygrovki: Profile['otygrovki']
}

const PREFIX = 'AVNB1:'

/** Кодирует профиль в строку для обмена (копируется и вставляется). */
export function encodeProfile(profile: Profile): string {
  const payload: SharePayload = {
    name: profile.name,
    chatKey: profile.chatKey,
    pasteDelayMs: profile.pasteDelayMs,
    otygrovki: profile.otygrovki
  }
  const json = JSON.stringify(payload)
  const b64 = btoa(unescape(encodeURIComponent(json)))
  return PREFIX + b64
}

/** Декодирует строку обмена обратно в данные профиля. Бросает при неверном формате. */
export function decodeProfile(code: string): Partial<Profile> {
  const trimmed = code.trim()
  const b64 = trimmed.startsWith(PREFIX) ? trimmed.slice(PREFIX.length) : trimmed
  const json = decodeURIComponent(escape(atob(b64)))
  const payload = JSON.parse(json) as SharePayload
  if (!payload || typeof payload.name !== 'string' || !Array.isArray(payload.otygrovki)) {
    throw new Error('Неверный формат кода профиля')
  }
  return {
    name: payload.name,
    chatKey: payload.chatKey ?? 'T',
    pasteDelayMs: payload.pasteDelayMs ?? 100,
    otygrovki: payload.otygrovki
  }
}
