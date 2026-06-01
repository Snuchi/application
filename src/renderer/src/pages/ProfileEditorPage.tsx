import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { useT } from '../i18n'
import { Breadcrumbs } from '../components/Chrome'
import { Toggle } from '../components/Toggle'
import { ChevronRight, Copy, Plus } from '../components/Icons'

export function ProfileEditorPage(): JSX.Element {
  const {
    nav,
    profiles,
    engine,
    logs,
    go,
    updateProfile,
    deleteProfile,
    addOtygrovka,
    startEngine,
    stopEngine
  } = useStore()
  const t = useT()

  const profile = profiles.find((p) => p.id === nav.profileId)
  const [name, setName] = useState(profile?.name ?? '')

  useEffect(() => {
    setName(profile?.name ?? '')
  }, [profile?.id, profile?.name])

  if (!profile) {
    return (
      <>
        <Breadcrumbs trail={[{ label: t('nav.profiles'), onClick: () => go('profiles') }]} onBack={() => go('profiles')} />
        <div className="content-scroll">
          <div className="empty">{t('profiles.notFound')}</div>
        </div>
      </>
    )
  }

  const isRunning = engine.activeProfileId === profile.id
  const copyLink = (): void => void navigator.clipboard.writeText(profile.link)

  return (
    <>
      <Breadcrumbs
        trail={[{ label: t('nav.profiles'), onClick: () => go('profiles') }, { label: profile.name }]}
        onBack={() => go('profiles')}
      />
      <div className="content-scroll">
        {/* Название + запуск */}
        <div className="field">
          <div className="field-label">{t('profile.name')}</div>
          <div className="row">
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => name !== profile.name && updateProfile(profile.id, { name })}
            />
            {isRunning ? (
              <button className="btn red" style={{ minWidth: 130 }} onClick={stopEngine}>
                {t('profile.stop')}
              </button>
            ) : (
              <button className="btn green" style={{ minWidth: 130 }} onClick={() => startEngine(profile.id)}>
                {t('profile.start')}
              </button>
            )}
          </div>
        </div>

        <div className="warn">{t('profile.warn')}</div>

        {/* Отыгровки */}
        {profile.otygrovki.map((o) => (
          <button key={o.id} className="list-row" onClick={() => go('otygrovka', profile.id, o.id)}>
            {o.name}
            <span className="muted" style={{ marginLeft: 12, fontWeight: 400 }}>
              {o.hotkey || t('profile.notAssigned')}
            </span>
            <span className="chev">
              <ChevronRight size={18} />
            </span>
          </button>
        ))}

        <button
          className="btn block"
          onClick={async () => {
            const id = await addOtygrovka(profile.id)
            if (id) go('otygrovka', profile.id, id)
          }}
        >
          <span className="row" style={{ justifyContent: 'center', gap: 8 }}>
            <Plus size={16} /> {t('profile.addOtygrovka')}
          </span>
        </button>

        <div className="divider" />

        {/* Публичный профиль */}
        <div className="toggle-row" style={{ borderTop: 'none', paddingTop: 0 }}>
          <div className="text">
            <div className="t">{t('profile.public')}</div>
            <div className="d">{t('profile.publicDesc')}</div>
          </div>
          <Toggle on={profile.isPublic} onChange={(v) => updateProfile(profile.id, { isPublic: v })} />
        </div>

        {/* Ссылка профиля */}
        <div className="field" style={{ marginTop: 12 }}>
          <div className="field-label">{t('profile.link')}</div>
          <div className="copy-field">
            <span className="link">{profile.link}</span>
            <span className="count">{profile.views}</span>
            <button className="btn sm" style={{ borderRadius: 0 }} onClick={copyLink}>
              <span className="row" style={{ gap: 6 }}>
                <Copy size={14} /> {t('profile.copy')}
              </span>
            </button>
          </div>
        </div>

        {/* Клавиша чата + задержка */}
        <div className="grid-2">
          <div className="field">
            <div className="field-label">{t('profile.chatKey')}</div>
            <input
              className="input"
              defaultValue={profile.chatKey}
              maxLength={12}
              onBlur={(e) => updateProfile(profile.id, { chatKey: e.target.value.trim() || 'T' })}
            />
          </div>
          <div className="field">
            <div className="field-label">{t('profile.pasteDelay')}</div>
            <input
              className="input"
              type="number"
              min={0}
              defaultValue={profile.pasteDelayMs}
              onBlur={(e) => updateProfile(profile.id, { pasteDelayMs: Math.max(0, Number(e.target.value) || 0) })}
            />
          </div>
        </div>

        <button
          className="btn red"
          onClick={() => {
            if (confirm(t('profile.confirmDelete', { name: profile.name }))) deleteProfile(profile.id)
          }}
        >
          {t('profile.delete')}
        </button>

        {/* Лог проигрывания */}
        {isRunning && logs.length > 0 && (
          <>
            <div className="section-label">{t('profile.log')}</div>
            <div className="log">
              {logs.map((l, i) => (
                <div key={i}>
                  {new Date(l.time).toLocaleTimeString()} {l.line}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
