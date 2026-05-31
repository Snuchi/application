interface Props {
  on: boolean
  onChange: (value: boolean) => void
}

/** Переключатель в стиле RPBINDER (с галочкой/крестиком на ручке). */
export function Toggle({ on, onChange }: Props): JSX.Element {
  return (
    <button
      type="button"
      className={`toggle ${on ? 'on' : ''}`}
      onClick={() => onChange(!on)}
      aria-pressed={on}
    >
      <span className="knob">{on ? '✓' : '✕'}</span>
    </button>
  )
}
