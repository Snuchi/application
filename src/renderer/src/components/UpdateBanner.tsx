import { useStore } from '../store'

/** Полоса уведомления об обновлении сверху окна. */
export function UpdateBanner(): JSX.Element | null {
  const { update, installUpdate } = useStore()

  if (update.state === 'available') {
    return (
      <div className="update-bar">
        Доступно обновление {update.version}. Загружается…
      </div>
    )
  }
  if (update.state === 'downloading') {
    return (
      <div className="update-bar">
        Загрузка обновления… {update.percent ?? 0}%
      </div>
    )
  }
  if (update.state === 'downloaded') {
    return (
      <div className="update-bar ready">
        <span>Обновление {update.version} готово к установке.</span>
        <button className="btn green sm" onClick={installUpdate}>
          Перезапустить и обновить
        </button>
      </div>
    )
  }
  return null
}
