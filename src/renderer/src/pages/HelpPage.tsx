import { Breadcrumbs } from '../components/Chrome'
import { useT } from '../i18n'

export function HelpPage(): JSX.Element {
  const t = useT()
  const faq = [
    { q: t('help.q1'), a: t('help.a1') },
    { q: t('help.q2'), a: t('help.a2') },
    { q: t('help.q3'), a: t('help.a3') },
    { q: t('help.q4'), a: t('help.a4') },
    { q: t('help.q5'), a: t('help.a5') }
  ]

  return (
    <>
      <Breadcrumbs trail={[{ label: t('nav.help') }]} />
      <div className="content-scroll">
        {faq.map((item, i) => (
          <div className="msg-card" key={i} style={{ padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{item.q}</div>
            <div className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
              {item.a}
            </div>
          </div>
        ))}
        <div className="empty" style={{ paddingTop: 24 }}>
          {t('footer')}
        </div>
      </div>
    </>
  )
}
