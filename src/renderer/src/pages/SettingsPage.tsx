import { useStore } from '../store'
import { Breadcrumbs } from '../components/Chrome'
import { Toggle } from '../components/Toggle'

export function SettingsPage(): JSX.Element {
  const { settings, updateSettings } = useStore()

  if (!settings) {
    return (
      <>
        <Breadcrumbs trail={[{ label: 'Настройки' }]} />
        <div className="content-scroll">
          <div className="empty">Загрузка…</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Breadcrumbs trail={[{ label: 'Настройки' }]} />
      <div className="content-scroll">
        <div className="grid-2">
          <div className="field">
            <div className="field-label">Язык</div>
            <select
              className="input"
              value={settings.language}
              onChange={(e) => updateSettings({ language: e.target.value as 'ru' | 'en' })}
            >
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="field">
            <div className="field-label">Тема</div>
            <select
              className="input"
              value={settings.theme}
              onChange={(e) => updateSettings({ theme: e.target.value as 'dark' | 'light' })}
            >
              <option value="dark">Тёмная</option>
              <option value="light">Светлая</option>
            </select>
          </div>
        </div>

        <div className="field">
          <div className="field-label">Клавиша подтверждения ручной вставки</div>
          <input
            className="input"
            defaultValue={settings.insertKey}
            onBlur={(e) => updateSettings({ insertKey: e.target.value.trim() || 'Insert' })}
          />
        </div>

        <div className="toggle-row">
          <div className="text">
            <div className="t">Запуск вместе с системой</div>
            <div className="d">Запускать RPBINDER автоматически при входе в Windows.</div>
          </div>
          <Toggle on={settings.autoLaunch} onChange={(v) => updateSettings({ autoLaunch: v })} />
        </div>

        <div className="toggle-row">
          <div className="text">
            <div className="t">Сворачивать в трей</div>
            <div className="d">При закрытии окна приложение продолжит работать в трее.</div>
          </div>
          <Toggle on={settings.minimizeToTray} onChange={(v) => updateSettings({ minimizeToTray: v })} />
        </div>

        <div className="empty" style={{ paddingTop: 24 }}>
          RPBINDER v0.1.0
        </div>
      </div>
    </>
  )
}
