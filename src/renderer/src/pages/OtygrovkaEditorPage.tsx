import { useEffect, useMemo, useState } from 'react'
import { nanoid } from 'nanoid'
import type { Otygrovka, RPMessage } from '@shared/types'
import { useStore } from '../store'
import { useT } from '../i18n'
import { Breadcrumbs } from '../components/Chrome'
import { Plus, Trash } from '../components/Icons'

function newLine(): RPMessage {
  return { id: nanoid(), text: '', delayMs: 0 }
}

export function OtygrovkaEditorPage(): JSX.Element {
  const { nav, profiles, go, updateOtygrovka, deleteOtygrovka, setSaveBox } = useStore()
  const t = useT()

  const profile = profiles.find((p) => p.id === nav.profileId)
  const original = profile?.otygrovki.find((o) => o.id === nav.otygrovkaId)

  const [draft, setDraft] = useState<Otygrovka | null>(original ?? null)
  const [capturing, setCapturing] = useState(false)

  useEffect(() => {
    setDraft(original ? structuredClone(original) : null)
  }, [original?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = useMemo(
    () => !!draft && !!original && JSON.stringify(draft) !== JSON.stringify(original),
    [draft, original]
  )

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
        <Breadcrumbs trail={[{ label: t('nav.profiles'), onClick: () => go('profiles') }]} onBack={() => go('profiles')} />
        <div className="content-scroll">
          <div className="empty">{t('otygrovka.notFound')}</div>
        </div>
      </>
    )
  }

  const patch = (p: Partial<Otygrovka>): void => setDraft({ ...draft, ...p })
  const patchMsg = (id: string, text: string): void =>
    patch({ messages: draft.messages.map((m) => (m.id === id ? { ...m, text } : m)) })

  const startCapture = async (): Promise<void> => {
    setCapturing(true)
    const native = await window.api.hotkeyCaptureStart()
    if (!native) {
      setCapturing(false)
      alert(t('otygrovka.captureUnavailable'))
    }
  }

  return (
    <>
      <Breadcrumbs
        trail={[
          { label: t('nav.profiles'), onClick: () => go('profiles') },
          { label: profile.name, onClick: () => go('profile', profile.id) },
          { label: original?.name ?? t('otygrovka.default') }
        ]}
        onBack={() => go('profile', profile.id)}
      />
      <div className="content-scroll">
        <div className="grid-2">
          <div className="field">
            <div className="field-label">{t('otygrovka.name')}</div>
            <input className="input" value={draft.name} onChange={(e) => patch({ name: e.target.value })} />
          </div>
          <div className="field">
            <div className="field-label">{t('otygrovka.hotkey')}</div>
            <input
              className="input"
              readOnly
              value={capturing ? t('otygrovka.pressKeys') : draft.hotkey || t('profile.notAssigned')}
              onClick={startCapture}
              style={{ cursor: 'pointer', borderColor: capturing ? 'var(--accent)' : undefined }}
            />
          </div>
        </div>

        {draft.messages.map((m, i) => (
          <div className="msg-card" key={m.id}>
            <div className="head">
              <span className="field-label" style={{ margin: 0 }}>
                {t('otygrovka.scriptText')} {draft.messages.length > 1 ? i + 1 : ''}
              </span>
              {draft.messages.length > 1 && (
                <button
                  className="del"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => patch({ messages: draft.messages.filter((x) => x.id !== m.id) })}
                >
                  <Trash size={15} />
                </button>
              )}
            </div>
            <textarea className="input" value={m.text} onChange={(e) => patchMsg(m.id, e.target.value)} />
          </div>
        ))}

        <button className="btn block" onClick={() => patch({ messages: [...draft.messages, newLine()] })}>
          <span className="row" style={{ justifyContent: 'center', gap: 8 }}>
            <Plus size={15} /> {t('otygrovka.addLine')}
          </span>
        </button>

        <div className="muted" style={{ fontSize: 13, margin: '14px 0' }}>
          {t('otygrovka.hint')}
        </div>

        <button
          className="btn red"
          onClick={() => {
            if (confirm(t('otygrovka.confirmDelete', { name: original?.name ?? '' }))) {
              deleteOtygrovka(profile.id, draft.id)
              go('profile', profile.id)
            }
          }}
        >
          {t('otygrovka.delete')}
        </button>
      </div>
    </>
  )
}
