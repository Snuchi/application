import { useEffect, useRef, useState } from 'react'

interface Data {
  title: string
  binds: { id: string; name: string; hotkey: string }[]
}

/** Полупрозрачный оверлей со списком биндов и их горячими клавишами. */
export default function Overlay(): JSX.Element {
  const [data, setData] = useState<Data>({ title: '', binds: [] })
  const [activeId, setActiveId] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => window.api.onOverlayData((d) => setData(d)), [])

  useEffect(
    () =>
      window.api.onOverlayFlash((id) => {
        setActiveId(id)
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => setActiveId(null), 900)
      }),
    []
  )

  return (
    <div className="ov">
      <div className="ov-head">{data.title || 'AVN Binder'}</div>
      {data.binds.map((b) => (
        <div className={`ov-row ${activeId === b.id ? 'active' : ''}`} key={b.id}>
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
