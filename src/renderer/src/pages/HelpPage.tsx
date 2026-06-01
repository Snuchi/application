import { Breadcrumbs } from '../components/Chrome'
import { useT } from '../i18n'

export function HelpPage(): JSX.Element {
  const t = useT()
  return (
    <>
      <Breadcrumbs trail={[{ label: t('nav.help') }]} />
      <div className="content-scroll">
        <div className="empty">{t('help.placeholder')}</div>
      </div>
    </>
  )
}
