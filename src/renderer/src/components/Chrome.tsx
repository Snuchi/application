import { useStore, View } from '../store'
import { useT } from '../i18n'
import { Logo } from './Logo'
import { Chat, ChevronLeft, Close, Help, Maximize, Minimize, Settings } from './Icons'

/** Кастомный титлбар (окно без рамки). */
export function TitleBar(): JSX.Element {
  return (
    <div className="titlebar">
      <span className="title">AVN Binder</span>
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

/** Левый рейл с логотипом и активным разделом биндера. */
export function Rail(): JSX.Element {
  return (
    <div className="rail">
      <div className="logo-badge">
        <Logo size={44} />
      </div>
      <div className="sep" />
      <div className="rail-icon active" title="Binder">
        <Chat size={22} />
      </div>
    </div>
  )
}

/** Колонка навигации с заголовком раздела. */
export function Nav(): JSX.Element {
  const { nav, go, saveBox } = useStore()
  const t = useT()
  const items: { view: View; label: string; icon: JSX.Element }[] = [
    { view: 'profiles', label: t('nav.profiles'), icon: <Chat size={16} /> },
    { view: 'help', label: t('nav.help'), icon: <Help size={16} /> },
    { view: 'settings', label: t('nav.settings'), icon: <Settings size={16} /> }
  ]
  // Профиль/отыгровка относятся к разделу «Мои профили».
  const activeView = nav.view === 'profile' || nav.view === 'otygrovka' ? 'profiles' : nav.view

  return (
    <nav className="nav">
      <div className="section-title">{t('nav.section')}</div>
      {items.map((item) => (
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
          <div className="label">{t('nav.saveChanges')}</div>
          <div className="row">
            <button className="btn ghost sm" style={{ flex: 1 }} onClick={saveBox.onReset}>
              {t('common.reset')}
            </button>
            <button className="btn green sm" style={{ flex: 1 }} onClick={saveBox.onSave}>
              {t('common.save')}
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
