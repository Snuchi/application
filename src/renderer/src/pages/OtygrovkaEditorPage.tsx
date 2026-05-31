import { useEffect, useMemo, useState } from 'react'
import { nanoid } from 'nanoid'
import type { Otygrovka, RPMessage } from '@shared/types'
import { useStore } from '../store'
import { Breadcrumbs } from '../components/Chrome'
import { Toggle } from '../components/Toggle'
import { Plus, Trash } from '../components/Icons'

function newMessage(): RPMessage {
  return { id: nanoid(), text: 'Тестовое сообщение', delayMs: 1000 }
}

export function OtygrovkaEditorPage(): JSX.Element {
  const { nav, profiles, go, updateOtygrovka, deleteOtygrovka, setSaveBox } = useStore()

  const profile = profiles.find((p) => p.id === nav.profileId)
  const original = profile?.otygrovki.find((o) => o.id === nav.otygrovkaId)

  const [draft, setDraft] = useState<Otygrovka | null>(original ?? null)
  const [capturing, setCapturing] = useState(false)

  // Сброс черновика при смене отыгровки.
  useEffect(() => {
    setDraft(original ? structuredClone(original) : null)
  }, [original?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = useMemo(
    () => !!draft && !!original && JSON.stringify(draft) !== JSON.stringify(original),
    [draft, original]
  )

  // Управление блоком «Сохранить изменения?» в навигации.
  useEffect(() => {
    if (dirty && draft && profile) {
      setSaveBox({
        onSave: () => void updateOtygrovka(profile.id, draft),
        onReset: () => setDraft(structuredClone(original!))
      })
    } else {
      setSaveBox(null)
    }
    return () => setSaveBox(null)
  }, [dirty, draft, profile, original, setSaveBox, updateOtygrovka])

  // Захват горячей клавиши.
  useEffect(() => {
    const off = window.api.onHotkeyCaptured((combo) => {
      setDraft((d) => (d ? { ...d, hotkey: combo } : d))
      setCapturing(false)
    })
    return off
  }, [])

  if (!profile || !draft) {
    return (
      <>
        <Breadcrumbs trail={[{ label: 'Мои профили', onClick: () => go('profiles') }]} onBack={() => go('profiles')} />
        <div className="content-scroll">
          <div className="empty">Отыгровка не найдена.</div>
        </div>
      </>
    )
  }

  const patch = (p: Partial<Otygrovka>): void => setDraft({ ...draft, ...p })
  const patchMsg = (id: string, p: Partial<RPMessage>): void =>
    patch({ messages: draft.messages.map((m) => (m.id === id ? { ...m, ...p } : m)) })

  const startCapture = async (): Promise<void> => {
    setCapturing(true)
    const native = await window.api.hotkeyCaptureStart()
    if (!native) {
      // Нативный хук недоступен (например, не Windows) — отменяем захват.
      setCapturing(false)
      alert('Захват клавиш недоступен: нативный модуль не загружен (нужен запуск на Windows).')
    }
  }

  const importMessages = (): void => {
    const raw = prompt('Вставьте сообщения, по одному на строку:')
    if (!raw) return
    const imported = raw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((text) => ({ id: nanoid(), text, delayMs: 1000 }))
    if (imported.length) patch({ messages: [...draft.messages, ...imported] })
  }

  return (
    <>
      <Breadcrumbs
        trail={[
          { label: 'Мои профили', onClick: () => go('profiles') },
          { label: profile.name, onClick: () => go('profile', profile.id) },
          { label: original?.name ?? 'Отыгровка' }
        ]}
        onBack={() => go('profile', profile.id)}
      />
      <div className="content-scroll">
        <div className="grid-2">
          <div className="field">
            <div className="field-label">Название отыгровки</div>
            <input
              className="input"
              value={draft.name}
              onChange={(e) => patch({ name: e.target.value })}
            />
          </div>
          <div className="field">
            <div className="field-label">Горячие клавиши</div>
            <input
              className="input"
              readOnly
              value={capturing ? 'Нажмите клавиши…' : draft.hotkey || 'Не назначено'}
              onClick={startCapture}
              style={{ cursor: 'pointer', borderColor: capturing ? 'var(--accent)' : undefined }}
            />
          </div>
        </div>

        {/* Сообщения */}
        {draft.messages.map((m, i) => (
          <div className="msg-card" key={m.id}>
            <div className="head">
              <span className="field-label" style={{ margin: 0 }}>
                Сообщение {i + 1}
              </span>
              <input
                className="ms-badge"
                style={{ width: 70, textAlign: 'right', border: 'none', outline: 'none' }}
                type="number"
                min={0}
                value={m.delayMs}
                onChange={(e) => patchMsg(m.id, { delayMs: Math.max(0, Number(e.target.value) || 0) })}
                title="Задержка перед сообщением, мс"
              />
              <span className="muted" style={{ fontSize: 11 }}>
                ms
              </span>
              {draft.messages.length > 1 && (
                <button className="del" onClick={() => patch({ messages: draft.messages.filter((x) => x.id !== m.id) })}>
                  <Trash size={15} />
                </button>
              )}
            </div>
            <textarea
              className="input"
              value={m.text}
              onChange={(e) => patchMsg(m.id, { text: e.target.value })}
            />
          </div>
        ))}

        <div className="grid-2">
          <button className="btn" onClick={() => patch({ messages: [...draft.messages, newMessage()] })}>
            <span className="row" style={{ justifyContent: 'center', gap: 8 }}>
              <Plus size={15} /> Добавить сообщение
            </span>
          </button>
          <button className="btn" onClick={importMessages}>
            Импорт сообщений
          </button>
        </div>

        <div className="divider" />

        <div className="toggle-row" style={{ borderTop: 'none' }}>
          <div className="text">
            <div className="t">Отключить автоматическую отправку</div>
            <div className="d">Каждое сообщение будет вставляться лишь после нажатия клавиши Insert.</div>
          </div>
          <Toggle on={draft.disableAutoSend} onChange={(v) => patch({ disableAutoSend: v })} />
        </div>

        <div className="toggle-row">
          <div className="text">
            <div className="t">Запись отыгровки</div>
            <div className="d">Записывает видео с экрана во время отыгровки.</div>
          </div>
          <Toggle on={draft.recordVideo} onChange={(v) => patch({ recordVideo: v })} />
        </div>

        <button
          className="btn red"
          style={{ marginTop: 12 }}
          onClick={() => {
            if (confirm(`Удалить отыгровку «${original?.name}»?`)) {
              deleteOtygrovka(profile.id, draft.id)
              go('profile', profile.id)
            }
          }}
        >
          Удалить отыгровку
        </button>
      </div>
    </>
  )
}
