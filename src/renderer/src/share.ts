import type { Otygrovka, Profile, RPMessage } from '@shared/types'

/** Полезная нагрузка профиля для обмена между пользователями. */
interface SharePayload {
  name: string
  chatKey: string
  pasteDelayMs: number
  otygrovki: Profile['otygrovki']
}

const PREFIX = 'AVNB1:'

// Лимиты при импорте — защита от вредоносных/огромных кодов профиля.
const MAX_BINDS = 100
const MAX_MESSAGES = 20
const MAX_NAME = 80
const MAX_TEXT = 2000
const HOTKEY_RE = /^[A-Za-z0-9+]{0,40}$/

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

function clampStr(v: unknown, max: number): string {
  return typeof v === 'string' ? v.slice(0, max) : ''
}

/** Приводит сырой объект сообщения к безопасному виду. */
function sanitizeMessage(m: unknown): RPMessage {
  const o = (m && typeof m === 'object' ? m : {}) as Record<string, unknown>
  const delay = Number(o.delayMs)
  return {
    id: clampStr(o.id, 40) || Math.random().toString(36).slice(2),
    text: clampStr(o.text, MAX_TEXT),
    delayMs: Number.isFinite(delay) ? Math.min(Math.max(0, delay), 60000) : 0
  }
}

/** Приводит сырой объект бинда к безопасному виду. */
function sanitizeOtygrovka(o: unknown): Otygrovka {
  const r = (o && typeof o === 'object' ? o : {}) as Record<string, unknown>
  const hotkeyRaw = clampStr(r.hotkey, 40)
  const messages = Array.isArray(r.messages) ? r.messages.slice(0, MAX_MESSAGES) : []
  return {
    id: clampStr(r.id, 40) || Math.random().toString(36).slice(2),
    name: clampStr(r.name, MAX_NAME) || 'Бинд',
    hotkey: HOTKEY_RE.test(hotkeyRaw) ? hotkeyRaw : '',
    disableAutoSend: false,
    recordVideo: false,
    messages: messages.length ? messages.map(sanitizeMessage) : [sanitizeMessage({})]
  }
}

/** Декодирует строку обмена обратно в безопасные данные профиля. */
export function decodeProfile(code: string): Partial<Profile> {
  const trimmed = code.trim()
  const b64 = trimmed.startsWith(PREFIX) ? trimmed.slice(PREFIX.length) : trimmed
  const json = decodeURIComponent(escape(atob(b64)))
  const payload = JSON.parse(json) as Record<string, unknown>
  if (!payload || typeof payload.name !== 'string' || !Array.isArray(payload.otygrovki)) {
    throw new Error('Неверный формат кода профиля')
  }
  const delay = Number(payload.pasteDelayMs)
  return {
    name: clampStr(payload.name, MAX_NAME) || 'Импортированный профиль',
    chatKey: clampStr(payload.chatKey, 12) || 'T',
    pasteDelayMs: Number.isFinite(delay) ? Math.min(Math.max(0, delay), 10000) : 100,
    otygrovki: payload.otygrovki.slice(0, MAX_BINDS).map(sanitizeOtygrovka)
  }
}
