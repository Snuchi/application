import { useStore } from '../store'
import { Breadcrumbs } from '../components/Chrome'
import { Toggle } from '../components/Toggle'

const UPDATE_LABEL: Record<string, string> = {
  idle: '',
  checking: 'Проверяем обновления…',
  available: 'Найдено обновление, загружается…',
  'not-available': 'У вас актуальная версия',
  downloading: 'Загрузка обновления…',
  downloaded: 'Обновление готово — перезапустите приложение',
  error: 'Ошибка проверки обновлений',
  disabled: 'Доступно только в установленной версии'
}

export function SettingsPage(): JSX.Element {
  const { settings, updateSettings, appVersion, update, checkUpdate } = useStore()

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
            <div className="d">Запускать Binder автоматически при входе в Windows.</div>
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

        <div className="divider" />

        <div className="toggle-row" style={{ borderTop: 'none' }}>
          <div className="text">
            <div className="t">Обновления</div>
            <div className="d">
              Версия {appVersion || '—'}
              {update.state !== 'idle' && UPDATE_LABEL[update.state]
                ? ` · ${UPDATE_LABEL[update.state]}`
                : ''}
              {update.state === 'downloading' && update.percent != null
                ? ` ${update.percent}%`
                : ''}
            </div>
          </div>
          <button
            className="btn sm"
            disabled={update.state === 'checking' || update.state === 'downloading'}
            onClick={checkUpdate}
          >
            Проверить обновления
          </button>
        </div>

        <div className="empty" style={{ paddingTop: 24 }}>
          Binder v{appVersion || '0.1.1'}
        </div>
      </div>
    </>
  )
}
