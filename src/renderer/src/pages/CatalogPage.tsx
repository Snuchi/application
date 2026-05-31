import { useEffect, useState } from 'react'
import type { CatalogItem } from '@shared/types'
import { useStore } from '../store'
import { Breadcrumbs } from '../components/Chrome'
import { Search } from '../components/Icons'

export function CatalogPage(): JSX.Element {
  const { refreshProfiles, go } = useStore()
  const [items, setItems] = useState<CatalogItem[]>([])
  const [query, setQuery] = useState('')
  const [installing, setInstalling] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    window.api.catalogList(query).then((list) => alive && setItems(list))
    return () => {
      alive = false
    }
  }, [query])

  const install = async (item: CatalogItem): Promise<void> => {
    setInstalling(item.id)
    const profile = await window.api.catalogInstall(item.id)
    await refreshProfiles()
    setInstalling(null)
    if (profile) go('profile', profile.id)
  }

  return (
    <>
      <Breadcrumbs trail={[{ label: 'Каталог' }]} />
      <div className="content-scroll">
        <div className="copy-field" style={{ marginBottom: 18 }}>
          <span style={{ padding: '0 12px', color: 'var(--text-mute)' }}>
            <Search size={16} />
          </span>
          <input
            className="input"
            style={{ border: 'none', background: 'transparent' }}
            placeholder="Поиск профилей в каталоге…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {items.map((item) => (
          <div className="msg-card" key={item.id} style={{ padding: 16 }}>
            <div className="row spread">
              <div style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                {item.views} 👁 · {item.otygrovkiCount} отыгр.
              </div>
            </div>
            <div className="muted" style={{ margin: '8px 0', fontSize: 13 }}>
              {item.description}
            </div>
            <div style={{ marginBottom: 10 }}>
              {item.tags.map((t) => (
                <span className="tag" key={t}>
                  {t}
                </span>
              ))}
            </div>
            <div className="row spread">
              <span className="muted" style={{ fontSize: 12 }}>
                Автор: {item.author}
              </span>
              <button
                className="btn green sm"
                disabled={installing === item.id}
                onClick={() => install(item)}
              >
                {installing === item.id ? 'Установка…' : 'Добавить профиль'}
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 && <div className="empty">Ничего не найдено.</div>}
      </div>
    </>
  )
}
