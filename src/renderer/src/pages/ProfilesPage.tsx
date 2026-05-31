import { useStore } from '../store'
import { Breadcrumbs } from '../components/Chrome'
import { ChevronRight } from '../components/Icons'

export function ProfilesPage(): JSX.Element {
  const { profiles, engine, go, createProfile, refreshProfiles } = useStore()

  return (
    <>
      <Breadcrumbs trail={[{ label: 'Мои профили' }]} />
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
                запущен
              </span>
            )}
            <span className="chev">
              <ChevronRight size={18} />
            </span>
          </button>
        ))}

        {profiles.length === 0 && (
          <div className="empty">Пока нет профилей. Создайте первый.</div>
        )}

        <div className="grid-2" style={{ marginTop: 4 }}>
          <button className="btn" onClick={createProfile}>
            Создать профиль
          </button>
          <button className="btn" onClick={refreshProfiles}>
            Обновить список
          </button>
        </div>
      </div>
    </>
  )
}
