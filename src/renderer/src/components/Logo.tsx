/** Логотип AVN — тёмный скруглённый квадрат с золотой надписью «AVN». */
export function Logo({ size = 44 }: { size?: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label="AVN">
      <rect x="2" y="2" width="96" height="96" rx="26" fill="#1b1b1d" />
      <rect
        x="2"
        y="2"
        width="96"
        height="96"
        rx="26"
        fill="none"
        stroke="#2a2a2d"
        strokeWidth="2"
      />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Arial, sans-serif"
        fontSize="30"
        fontWeight="800"
        letterSpacing="1"
        fill="#e8b923"
      >
        AVN
      </text>
    </svg>
  )
}
