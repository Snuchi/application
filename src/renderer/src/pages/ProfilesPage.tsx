import { useState } from 'react'
import { useStore } from '../store'
import { useT } from '../i18n'
import { decodeProfile } from '../share'
import { Breadcrumbs } from '../components/Chrome'
import { Modal } from '../components/Modal'
import { ChevronRight } from '../components/Icons'

export function ProfilesPage(): JSX.Element {
  const { profiles, engine, go, createProfile, importProfile, refreshProfiles } = useStore()
  const t = useT()
  const [importing, setImporting] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const [resolving, setResolving] = useState(false)

  const doImport = async (): Promise<void> => {
    setResolving(true)
    try {
      // Принимаем и короткую ссылку, и сырой код.
      const raw = await window.api.shareResolve(code)
      const data = decodeProfile(raw)
      importProfile(data)
      setImporting(false)
      setCode('')
      setError('')
    } catch {
      setError(t('profiles.importError'))
    } finally {
      setResolving(false)
    }
  }

  return (
    <>
      <Breadcrumbs trail={[{ label: t('nav.profiles') }]} />
      <div className="content-scroll">
        {profiles.map((p) => (
          <button
            key={p.id}
            className={`list-row ${engine.activeProfileId === p.id ? 'running' : ''}`}
            onClick={() => go('profile', p.id)}
          >
            {p.name}
            {engine.activeProfileId === p.id && (
              <span className="tag" style={{ marginLeft: 12, marginBottom: 0 }}>
                {t('profiles.running')}
              </span>
            )}
            <span className="chev">
              <ChevronRight size={18} />
            </span>
          </button>
        ))}

        {profiles.length === 0 && <div className="empty">{t('profiles.empty')}</div>}

        <div className="grid-2" style={{ marginTop: 4 }}>
          <button className="btn" onClick={createProfile}>
            {t('profiles.create')}
          </button>
          <button className="btn" onClick={refreshProfiles}>
            {t('profiles.refresh')}
          </button>
        </div>
        <button
          className="btn block"
          style={{ marginTop: 12 }}
          onClick={() => {
            setCode('')
            setError('')
            setImporting(true)
          }}
        >
          {t('profiles.import')}
        </button>
      </div>

      {importing && (
        <Modal title={t('profiles.import')} onClose={() => setImporting(false)}>
          <div className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
            {t('profiles.importPrompt')}
          </div>
          <textarea
            className="input"
            style={{ minHeight: 80, fontFamily: 'monospace', fontSize: 12 }}
            placeholder="https://paste.rs/...  или  AVNB1:..."
            value={code}
            onChange={(e) => {
              setCode(e.target.value)
              setError('')
            }}
            autoFocus
          />
          {error && (
            <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 8 }}>{error}</div>
          )}
          <div className="row" style={{ marginTop: 14, gap: 10 }}>
            <button className="btn ghost" style={{ flex: 1 }} onClick={() => setImporting(false)}>
              {t('common.cancel')}
            </button>
            <button
              className="btn green"
              style={{ flex: 1 }}
              disabled={!code.trim() || resolving}
              onClick={doImport}
            >
              {resolving ? t('profiles.importDo') + '…' : t('profiles.importDo')}
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
