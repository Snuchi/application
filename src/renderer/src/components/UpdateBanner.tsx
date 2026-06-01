import { useStore } from '../store'
import { useT } from '../i18n'

/** Полоса уведомления об обновлении сверху окна. */
export function UpdateBanner(): JSX.Element | null {
  const { update, installUpdate } = useStore()
  const t = useT()

  if (update.state === 'available') {
    return <div className="update-bar">{t('banner.available', { v: update.version ?? '' })}</div>
  }
  if (update.state === 'downloading') {
    return <div className="update-bar">{t('banner.downloading', { p: update.percent ?? 0 })}</div>
  }
  if (update.state === 'downloaded') {
    return (
      <div className="update-bar ready">
        <span>{t('banner.ready', { v: update.version ?? '' })}</span>
        <button className="btn green sm" onClick={installUpdate}>
          {t('banner.install')}
        </button>
      </div>
    )
  }
  return null
}
