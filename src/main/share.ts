/**
 * Шаринг профиля через публичный paste-сервис, чтобы пользователь делился
 * КОРОТКОЙ ссылкой, а не огромным кодом. При недоступности сервиса вызывающая
 * сторона откатывается на сырой код.
 */

const PASTE_POST = 'https://paste.rs/'

/** Загружает код профиля на paste-сервис, возвращает короткую ссылку или null. */
export async function uploadShare(code: string): Promise<string | null> {
  try {
    const res = await fetch(PASTE_POST, {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: code
    })
    if (!res.ok) return null
    const url = (await res.text()).trim()
    return /^https?:\/\//.test(url) ? url : null
  } catch {
    return null
  }
}

/** Превращает ввод (ссылка или сырой код) в код профиля. */
export async function resolveShare(input: string): Promise<string> {
  const trimmed = input.trim()
  if (/^https?:\/\/\S+$/.test(trimmed)) {
    try {
      const res = await fetch(trimmed)
      if (res.ok) return (await res.text()).trim()
    } catch {
      /* вернём как есть ниже */
    }
  }
  return trimmed
}
