import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import Overlay from './Overlay'
import './styles/global.css'

const isOverlay = window.location.hash === '#overlay'
if (isOverlay) {
  // Окно оверлея должно быть прозрачным — убираем фон body.
  document.body.style.background = 'transparent'
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{isOverlay ? <Overlay /> : <App />}</React.StrictMode>
)
