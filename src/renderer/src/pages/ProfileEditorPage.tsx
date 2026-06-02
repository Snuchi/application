import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { useT } from '../i18n'
import { encodeProfile } from '../share'
import { Breadcrumbs } from '../components/Chrome'
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
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)

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
  const shareCode = encodeProfile(profile)
  const copyShare = async (): Promise<void> => {
    setSharing(true)
    // Пытаемся получить короткую ссылку; если сервис недоступен — копируем код.
    const link = await window.api.shareUpload(shareCode)
    await window.api.clipboardWrite(link ?? shareCode)
    setSharing(false)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

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
            <Plus size={16} /> {t('profile.addBind')}
          </span>
        </button>

        <div className="divider" />

        {/* Поделиться профилем — короткая ссылка */}
        <div className="field">
          <div className="field-label">{t('profile.share')}</div>
          <div className="share-box">
            <div className="share-info">
              {t('profile.shareValue', { name: profile.name, n: profile.otygrovki.length })}
            </div>
            <button
              className={`btn ${copied ? 'green' : 'ghost'}`}
              style={{ minWidth: 150 }}
              disabled={sharing}
              onClick={copyShare}
            >
              <span className="row" style={{ gap: 7, justifyContent: 'center' }}>
                <Copy size={15} />
                {sharing ? t('profile.sharing') : copied ? t('profile.copied') : t('profile.copyLink')}
              </span>
            </button>
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
            {t('profile.shareHint')}
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
