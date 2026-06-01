import type { ReactNode } from 'react'
import { Breadcrumbs } from '../components/Chrome'
import { useT } from '../i18n'

/* ---- Схематичные иллюстрации к шагам (адаптируются к теме через CSS-переменные) ---- */

const panel = { fill: 'var(--panel-2)', stroke: 'var(--border)', strokeWidth: 1 }
const card = { fill: 'var(--card)' }
const dim = { fill: 'var(--text-mute)' }

function Frame({ children }: { children: ReactNode }): JSX.Element {
  return (
    <svg viewBox="0 0 300 140" className="help-img">
      <rect x="1" y="1" width="298" height="138" rx="10" {...panel} />
      {children}
    </svg>
  )
}

function CreateImg(): JSX.Element {
  return (
    <Frame>
      <rect x="20" y="22" width="260" height="20" rx="5" {...card} />
      <rect x="20" y="50" width="260" height="20" rx="5" {...card} />
      <rect x="20" y="86" width="125" height="30" rx="6" style={{ fill: 'var(--green)' }} />
      <rect x="155" y="86" width="125" height="30" rx="6" {...card} />
      <path d="M70 101h35M87.5 83.5v35" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </Frame>
  )
}

function BindImg(): JSX.Element {
  return (
    <Frame>
      <rect x="20" y="34" width="180" height="22" rx="5" {...card} />
      <rect x="210" y="30" width="70" height="30" rx="6" {...panel} style={{ fill: 'var(--card)' }} />
      <text x="245" y="50" textAnchor="middle" fontSize="14" fontWeight="700" style={{ fill: 'var(--text)' }}>
        F4
      </text>
      <rect x="20" y="74" width="260" height="44" rx="6" {...card} />
      <rect x="30" y="84" width="150" height="8" rx="4" {...dim} />
      <rect x="30" y="100" width="110" height="8" rx="4" {...dim} />
    </Frame>
  )
}

function StartImg(): JSX.Element {
  return (
    <Frame>
      <rect x="20" y="30" width="180" height="34" rx="7" {...card} />
      <rect x="210" y="30" width="70" height="34" rx="7" style={{ fill: 'var(--green)' }} />
      <path d="M238 40l12 7-12 7z" fill="#fff" />
      <rect x="20" y="86" width="260" height="30" rx="6" style={{ fill: 'var(--warn-bg)', stroke: 'var(--warn-border)' }} />
    </Frame>
  )
}

function GameImg(): JSX.Element {
  return (
    <Frame>
      <rect x="20" y="26" width="200" height="56" rx="6" {...card} />
      <rect x="30" y="38" width="150" height="8" rx="4" style={{ fill: 'var(--accent)' }} />
      <rect x="30" y="56" width="120" height="8" rx="4" {...dim} />
      <rect x="180" y="98" width="100" height="30" rx="6" {...panel} style={{ fill: 'var(--card)' }} />
      <text x="230" y="118" textAnchor="middle" fontSize="13" fontWeight="700" style={{ fill: 'var(--text)' }}>
        Enter
      </text>
    </Frame>
  )
}

function ShareImg(): JSX.Element {
  return (
    <Frame>
      <rect x="20" y="34" width="180" height="26" rx="6" {...card} />
      <text x="32" y="51" fontSize="12" fontFamily="monospace" style={{ fill: 'var(--text-dim)' }}>
        AVNB1:eyJ…
      </text>
      <rect x="210" y="34" width="70" height="26" rx="6" style={{ fill: 'var(--accent)' }} />
      <path d="M150 88h60M198 80l14 8-14 8" stroke="var(--text-mute)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="20" y="100" width="120" height="26" rx="6" {...card} />
    </Frame>
  )
}

export function HelpPage(): JSX.Element {
  const t = useT()
  const steps = [
    { img: <CreateImg />, t: t('help.s1.t'), d: t('help.s1.d') },
    { img: <BindImg />, t: t('help.s2.t'), d: t('help.s2.d') },
    { img: <StartImg />, t: t('help.s3.t'), d: t('help.s3.d') },
    { img: <GameImg />, t: t('help.s4.t'), d: t('help.s4.d') },
    { img: <ShareImg />, t: t('help.s5.t'), d: t('help.s5.d') }
  ]

  return (
    <>
      <Breadcrumbs trail={[{ label: t('nav.help') }]} />
      <div className="content-scroll">
        <div className="muted" style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 18 }}>
          {t('help.intro')}
        </div>
        {steps.map((s, i) => (
          <div className="help-step" key={i}>
            {s.img}
            <div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{s.t}</div>
              <div className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
                {s.d}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
