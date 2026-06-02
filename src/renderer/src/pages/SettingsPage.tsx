import { useStore } from '../store'
import { useT } from '../i18n'
import { Breadcrumbs } from '../components/Chrome'
import { Toggle } from '../components/Toggle'
import { HotkeyField } from '../components/HotkeyField'

const UPDATE_KEY: Record<string, string> = {
  checking: 'upd.checking',
  available: 'upd.available',
  'not-available': 'upd.notAvailable',
  downloading: 'upd.downloading',
  downloaded: 'upd.downloaded',
  error: 'upd.error',
  disabled: 'upd.disabled'
}

export function SettingsPage(): JSX.Element {
  const { settings, updateSettings, appVersion, update, checkUpdate } = useStore()
  const t = useT()

  if (!settings) {
    return (
      <>
        <Breadcrumbs trail={[{ label: t('nav.settings') }]} />
        <div className="content-scroll">
          <div className="empty">…</div>
        </div>
      </>
    )
  }

  const updateText = update.state !== 'idle' && UPDATE_KEY[update.state] ? t(UPDATE_KEY[update.state]) : ''

  return (
    <>
      <Breadcrumbs trail={[{ label: t('nav.settings') }]} />
      <div className="content-scroll">
        <div className="grid-2">
          <div className="field">
            <div className="field-label">{t('settings.language')}</div>
            <select
              className="input"
              value={settings.language}
              onChange={(e) => updateSettings({ language: e.target.value as 'ru' | 'uk' })}
            >
              <option value="ru">{t('settings.langRu')}</option>
              <option value="uk">{t('settings.langUk')}</option>
            </select>
          </div>
          <div className="field">
            <div className="field-label">{t('settings.theme')}</div>
            <select
              className="input"
              value={settings.theme}
              onChange={(e) => updateSettings({ theme: e.target.value as 'dark' | 'light' })}
            >
              <option value="dark">{t('settings.themeDark')}</option>
              <option value="light">{t('settings.themeLight')}</option>
            </select>
          </div>
        </div>

        {/* Горячие клавиши оверлея */}
        <div className="toggle-row">
          <div className="text">
            <div className="t">{t('settings.overlayToggle')}</div>
          </div>
          <HotkeyField
            value={settings.overlayToggleKey}
            onChange={(combo) => updateSettings({ overlayToggleKey: combo })}
          />
        </div>
        <div className="toggle-row">
          <div className="text">
            <div className="t">{t('settings.overlayHide')}</div>
          </div>
          <HotkeyField
            value={settings.overlayHideKey}
            onChange={(combo) => updateSettings({ overlayHideKey: combo })}
          />
        </div>

        <div className="toggle-row">
          <div className="text">
            <div className="t">{t('settings.autoLaunch')}</div>
            <div className="d">{t('settings.autoLaunchDesc')}</div>
          </div>
          <Toggle on={settings.autoLaunch} onChange={(v) => updateSettings({ autoLaunch: v })} />
        </div>

        {/* Обновления — кнопка по центру */}
        <div className="divider" />
        <div className="update-block">
          <div className="t">{t('settings.updates')}</div>
          <div className="d">
            {t('settings.version')} {appVersion || '—'}
            {updateText ? ` · ${updateText}` : ''}
            {update.state === 'downloading' && update.percent != null ? ` ${update.percent}%` : ''}
          </div>
          <button
            className="btn"
            disabled={update.state === 'checking' || update.state === 'downloading'}
            onClick={checkUpdate}
          >
            {t('settings.checkUpdates')}
          </button>
        </div>
      </div>
    </>
  )
}
