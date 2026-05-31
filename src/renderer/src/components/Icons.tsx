interface P {
  size?: number
}

const s = (n = 18): { width: number; height: number; viewBox: string; fill: string } => ({
  width: n,
  height: n,
  viewBox: '0 0 24 24',
  fill: 'none'
})

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
}

export const ChevronRight = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M9 6l6 6-6 6" {...stroke} />
  </svg>
)
export const ChevronLeft = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M15 6l-6 6 6 6" {...stroke} />
  </svg>
)
export const Chat = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M4 5h16v11H9l-4 4V5z" {...stroke} />
  </svg>
)
export const Catalog = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <rect x="3" y="4" width="18" height="13" rx="2" {...stroke} />
    <path d="M3 20h18" {...stroke} />
  </svg>
)
export const Help = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <circle cx="12" cy="12" r="9" {...stroke} />
    <path d="M9.5 9a2.5 2.5 0 1 1 3 2.5c-.8.3-1.5.8-1.5 1.8M12 17h.01" {...stroke} />
  </svg>
)
export const Settings = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <circle cx="12" cy="12" r="3" {...stroke} />
    <path
      d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1l-.3-2.5H10.4l-.3 2.5a7 7 0 0 0-1.7 1l-2.3-1-2 3.4L6 11a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.3 2.5h3.2l.3-2.5a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5c.1-.3.1-.7.1-1z"
      {...stroke}
    />
  </svg>
)
export const Gavel = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M14 4l6 6-3 3-6-6 3-3zM11 7l-7 7 3 3 7-7M4 21h8" {...stroke} />
  </svg>
)
export const Notes = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <rect x="5" y="3" width="14" height="18" rx="2" {...stroke} />
    <path d="M9 8h6M9 12h6M9 16h4" {...stroke} />
  </svg>
)
export const Translate = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M4 6h10M9 4v2c0 4-2 7-5 8M7 9c0 3 2 5 6 6" {...stroke} />
    <path d="M13 19l3-7 3 7M14.5 16h4" {...stroke} />
  </svg>
)
export const Copy = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <rect x="9" y="9" width="11" height="11" rx="2" {...stroke} />
    <path d="M5 15V5a2 2 0 0 1 2-2h8" {...stroke} />
  </svg>
)
export const Trash = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13" {...stroke} />
  </svg>
)
export const Plus = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M12 5v14M5 12h14" {...stroke} />
  </svg>
)
export const Minimize = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M5 12h14" {...stroke} />
  </svg>
)
export const Maximize = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <rect x="5" y="5" width="14" height="14" rx="1" {...stroke} />
  </svg>
)
export const Close = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M6 6l12 12M18 6L6 18" {...stroke} />
  </svg>
)
export const Search = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <circle cx="11" cy="11" r="7" {...stroke} />
    <path d="M21 21l-4-4" {...stroke} />
  </svg>
)
export const Play = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M7 5l12 7-12 7V5z" {...stroke} />
  </svg>
)
