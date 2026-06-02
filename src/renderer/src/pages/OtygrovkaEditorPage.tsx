import { useEffect, useMemo, useState } from 'react'
import { nanoid } from 'nanoid'
import type { Otygrovka } from '@shared/types'
import { useStore } from '../store'
import { useT } from '../i18n'
import { Breadcrumbs } from '../components/Chrome'

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
  // Один бинд = один текст: храним ровно одно сообщение.
  const setText = (text: string): void =>
    patch({ messages: [{ id: draft.messages[0]?.id ?? nanoid(), text, delayMs: 0 }] })

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

        <div className="field">
          <div className="field-label">{t('otygrovka.scriptText')}</div>
          <textarea
            className="input"
            style={{ minHeight: 90 }}
            value={draft.messages[0]?.text ?? ''}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <div className="muted" style={{ fontSize: 13, margin: '4px 0 14px' }}>
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
