import { useEffect, useState } from 'react'

interface Props {
  value: string
  onChange: (combo: string) => void
}

/** Поле-кнопка для назначения горячей клавиши (как в настройках оверлея). */
export function HotkeyField({ value, onChange }: Props): JSX.Element {
  const [capturing, setCapturing] = useState(false)

  useEffect(() => {
    if (!capturing) return
    const off = window.api.onHotkeyCaptured((combo) => {
      onChange(combo)
      setCapturing(false)
    })
    return off
  }, [capturing, onChange])

  const start = async (): Promise<void> => {
    setCapturing(true)
    const native = await window.api.hotkeyCaptureStart()
    if (!native) setCapturing(false)
  }

  return (
    <button className={`key-box ${capturing ? 'capturing' : ''}`} onClick={start}>
      {capturing ? '…' : value || '—'}
    </button>
  )
}
