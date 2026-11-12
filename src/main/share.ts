/**
 * Шаринг профиля через публичные paste-сервисы, чтобы пользователь делился
 * КОРОТКОЙ ссылкой, а не огромным кодом. Сервисы пробуются по очереди; если не
 * сработал ни один, вызывающая сторона откатывается на полный код.
 */

const TIMEOUT_MS = 8000
const HEADERS = { 'content-type': 'text/plain; charset=utf-8', 'user-agent': 'AVN-Binder' }

interface Provider {
  name: string
  /** Загружает код и возвращает ссылку на «сырой» текст (её же открывает импорт). */
  upload(code: string): Promise<string | null>
}

const providers: Provider[] = [
  {
    // pastes.dev (bytebin): POST → 201 {"key":"…"}, текст по https://api.pastes.dev/<key>
    name: 'pastes.dev',
    async upload(code) {
      const res = await fetch('https://api.pastes.dev/post', {
        method: 'POST',
        headers: HEADERS,
        body: code,
        signal: AbortSignal.timeout(TIMEOUT_MS)
      })
      if (res.status !== 201) return null
      const { key } = (await res.json()) as { key?: string }
      return key && /^[A-Za-z0-9]+$/.test(key) ? `https://api.pastes.dev/${key}` : null
    }
  },
  {
    // paste.rs: POST → 201 и ссылка в теле. 206 = профиль обрезан, такую ссылку не берём.
    name: 'paste.rs',
    async upload(code) {
      const res = await fetch('https://paste.rs/', {
        method: 'POST',
        headers: HEADERS,
        body: code,
        signal: AbortSignal.timeout(TIMEOUT_MS)
      })
      if (res.status !== 201) return null
      const url = (await res.text()).trim()
      return /^https:\/\/paste\.rs\/\w+$/.test(url) ? url : null
    }
  }
]

/** Загружает код профиля, возвращает короткую ссылку или null, если все сервисы недоступны. */
export async function uploadShare(code: string): Promise<string | null> {
  for (const p of providers) {
    try {
      const link = await p.upload(code)
      if (link) return link
    } catch (err) {
      console.warn(`[share] ${p.name} недоступен:`, (err as Error).message)
    }
  }
  return null
}

/** Ссылку на страницу просмотра pastes.dev превращает в ссылку на «сырой» текст. */
function toRawUrl(url: string): string {
  const m = /^https?:\/\/(?:www\.)?pastes\.dev\/([A-Za-z0-9]+)\/?$/.exec(url)
  return m ? `https://api.pastes.dev/${m[1]}` : url
}

/** Превращает ввод (ссылка или сырой код) в код профиля. */
export async function resolveShare(input: string): Promise<string> {
  const trimmed = input.trim()
  if (/^https?:\/\/\S+$/.test(trimmed)) {
    try {
      const res = await fetch(toRawUrl(trimmed), {
        headers: { 'user-agent': 'AVN-Binder' },
        signal: AbortSignal.timeout(TIMEOUT_MS)
      })
      if (res.ok) return (await res.text()).trim()
    } catch {
      /* вернём как есть ниже */
    }
  }
  return trimmed
}
