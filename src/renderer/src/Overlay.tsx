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
  const rowRefs = useRef(new Map<string, HTMLDivElement>())

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

  // Сработавший бинд вне видимой части списка — прокручиваем к нему.
  useEffect(() => {
    if (activeId) rowRefs.current.get(activeId)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeId])

  // Пока курсор над оверлеем, он принимает мышь (колёсико прокручивает список),
  // иначе клики проходят насквозь в приложение под ним.
  useEffect(() => () => void window.api.overlaySetInteractive(false), [])

  return (
    <div
      className="ov"
      onMouseEnter={() => void window.api.overlaySetInteractive(true)}
      onMouseLeave={() => void window.api.overlaySetInteractive(false)}
    >
      <div className="ov-head">{data.title || 'AVN Binder'}</div>
      <div className="ov-list">
        {data.binds.map((b) => (
          <div
            className={`ov-row ${activeId === b.id ? 'active' : ''}`}
            key={b.id}
            ref={(el) => {
              if (el) rowRefs.current.set(b.id, el)
              else rowRefs.current.delete(b.id)
            }}
          >
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
    </div>
  )
}
