import { useEffect, useState } from 'react'

interface Data {
  title: string
  binds: { name: string; hotkey: string }[]
}

/** Полупрозрачный оверлей со списком биндов и их горячими клавишами. */
export default function Overlay(): JSX.Element {
  const [data, setData] = useState<Data>({ title: '', binds: [] })

  useEffect(() => window.api.onOverlayData((d) => setData(d)), [])

  return (
    <div className="ov">
      <div className="ov-head">{data.title || 'AVN Binder'}</div>
      {data.binds.map((b, i) => (
        <div className="ov-row" key={i}>
          <span className="ov-name">{b.name}</span>
          <span className="ov-keys">
            {b.hotkey.split('+').map((k, j) => (
              <kbd className="ov-key" key={j}>
                {k}
              </kbd>
            ))}
          </span>
        </div>
      ))}
      {data.binds.length === 0 && <div className="ov-empty">Нет биндов с горячими клавишами</div>}
    </div>
  )
}
