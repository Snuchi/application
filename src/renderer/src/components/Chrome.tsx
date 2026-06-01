import { useStore, View } from '../store'
import {
  Catalog,
  Chat,
  ChevronLeft,
  Close,
  Gavel,
  Help,
  Maximize,
  Minimize,
  Notes,
  Settings,
  Translate
} from './Icons'

/** Кастомный титлбар (окно без рамки). */
export function TitleBar(): JSX.Element {
  return (
    <div className="titlebar">
      <span className="title">Binder</span>
      <div className="win-controls">
        <button className="win-btn" onClick={() => window.api.windowMinimize()}>
          <Minimize size={14} />
        </button>
        <button className="win-btn" onClick={() => window.api.windowMaximize()}>
          <Maximize size={13} />
        </button>
        <button className="win-btn close" onClick={() => window.api.windowClose()}>
          <Close size={14} />
        </button>
      </div>
    </div>
  )
}

/** Левый рейл «приложений» (декоративный переключатель разделов). */
export function Rail(): JSX.Element {
  return (
    <div className="rail">
      <div className="avatar" />
      <div className="sep" />
      <div className="rail-icon active" title="Биндер">
        <Chat size={22} />
      </div>
      <div className="rail-icon" title="Аукцион">
        <Gavel size={22} />
      </div>
      <div className="rail-icon" title="Заметки">
        <Notes size={22} />
      </div>
      <div className="rail-icon" title="Переводчик">
        <Translate size={22} />
      </div>
    </div>
  )
}

const NAV: { view: View; label: string; icon: JSX.Element }[] = [
  { view: 'profiles', label: 'Мои профили', icon: <Chat size={16} /> },
  { view: 'catalog', label: 'Каталог', icon: <Catalog size={16} /> },
  { view: 'help', label: 'Справка', icon: <Help size={16} /> },
  { view: 'settings', label: 'Настройки', icon: <Settings size={16} /> }
]

/** Колонка навигации с заголовком раздела. */
export function Nav(): JSX.Element {
  const { nav, go, saveBox } = useStore()
  // Профиль/отыгровка относятся к разделу «Мои профили».
  const activeView = nav.view === 'profile' || nav.view === 'otygrovka' ? 'profiles' : nav.view
  return (
    <nav className="nav">
      <div className="section-title">Отыгровки</div>
      {NAV.map((item) => (
        <button
          key={item.view}
          className={`nav-item ${activeView === item.view ? 'active' : ''}`}
          onClick={() => go(item.view)}
        >
          {item.label}
          <span className="ico">{item.icon}</span>
        </button>
      ))}

      {saveBox && (
        <div className="save-box">
          <div className="label">Сохранить изменения?</div>
          <div className="row">
            <button className="btn ghost sm" style={{ flex: 1 }} onClick={saveBox.onReset}>
              Сброс
            </button>
            <button className="btn green sm" style={{ flex: 1 }} onClick={saveBox.onSave}>
              Сохранить
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

/** Хлебные крошки + кнопка «назад» в шапке контента. */
export function Breadcrumbs(props: {
  trail: { label: string; onClick?: () => void }[]
  onBack?: () => void
}): JSX.Element {
  return (
    <div className="content-header">
      {props.trail.map((c, i) => (
        <span key={i} style={{ display: 'contents' }}>
          {i > 0 && <span className="crumb-sep">›</span>}
          {c.onClick ? (
            <span className="crumb" onClick={c.onClick}>
              {c.label}
            </span>
          ) : (
            <span>{c.label}</span>
          )}
        </span>
      ))}
      {props.onBack && (
        <button className="back" onClick={props.onBack}>
          <ChevronLeft size={20} />
        </button>
      )}
    </div>
  )
}
