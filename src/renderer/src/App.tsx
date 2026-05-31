import { useEffect } from 'react'
import { useStore } from './store'
import { Nav, Rail, TitleBar } from './components/Chrome'
import { ProfilesPage } from './pages/ProfilesPage'
import { ProfileEditorPage } from './pages/ProfileEditorPage'
import { OtygrovkaEditorPage } from './pages/OtygrovkaEditorPage'
import { CatalogPage } from './pages/CatalogPage'
import { HelpPage } from './pages/HelpPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App(): JSX.Element {
  const { nav, init } = useStore()

  useEffect(() => {
    void init()
  }, [init])

  return (
    <div className="app">
      <TitleBar />
      <div className="body">
        <Rail />
        <Nav />
        <main className="content">
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
