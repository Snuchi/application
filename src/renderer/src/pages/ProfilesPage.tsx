import { useStore } from '../store'
import { useT } from '../i18n'
import { decodeProfile } from '../share'
import { Breadcrumbs } from '../components/Chrome'
import { ChevronRight } from '../components/Icons'

export function ProfilesPage(): JSX.Element {
  const { profiles, engine, go, createProfile, importProfile, refreshProfiles } = useStore()
  const t = useT()

  const onImport = (): void => {
    const code = prompt(t('profiles.importPrompt'))
    if (!code) return
    try {
      importProfile(decodeProfile(code))
    } catch {
      alert(t('profiles.importError'))
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
        <button className="btn block" style={{ marginTop: 12 }} onClick={onImport}>
          {t('profiles.import')}
        </button>
      </div>
    </>
  )
}
