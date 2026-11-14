import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/app.css'
import { App } from './ui/App.tsx'

const stored = localStorage.getItem('theme')
const system = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
document.documentElement.dataset.theme = stored ?? system

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
