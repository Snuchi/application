import { useEffect } from 'react'
import { useStore } from './store'
import { Nav, Rail, TitleBar } from './components/Chrome'
import { UpdateBanner } from './components/UpdateBanner'
import { ProfilesPage } from './pages/ProfilesPage'
import { ProfileEditorPage } from './pages/ProfileEditorPage'
import { OtygrovkaEditorPage } from './pages/OtygrovkaEditorPage'
import { CatalogPage } from './pages/CatalogPage'
import { HelpPage } from './pages/HelpPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App(): JSX.Element {
  const { nav, init, settings } = useStore()

  useEffect(() => {
    void init()
  }, [init])

  // Применяем выбранную тему к корню документа.
  useEffect(() => {
    document.documentElement.dataset.theme = settings?.theme ?? 'dark'
  }, [settings?.theme])

  return (
    <div className="app">
      <TitleBar />
      <div className="body">
        <Rail />
        <Nav />
        <main className="content">
          <UpdateBanner />
          {nav.view === 'profiles' && <ProfilesPage />}
          {nav.view === 'profile' && <ProfileEditorPage />}
          {nav.view === 'otygrovka' && <OtygrovkaEditorPage />}
          {nav.view === 'catalog' && <CatalogPage />}
          {nav.view === 'help' && <HelpPage />}
          {nav.view === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  )
}
