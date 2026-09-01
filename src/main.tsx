import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
<<<<<<< HEAD
=======

// Register the offline shell. Until this existed the app could not start
// without a network, which made "offline-first" true only for an open tab.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('[AmarDokan] Offline shell ready:', reg.scope))
      .catch((err) => console.warn('[AmarDokan] Offline shell registration failed:', err))
  })
}
>>>>>>> c18622f (Bug Fix)
