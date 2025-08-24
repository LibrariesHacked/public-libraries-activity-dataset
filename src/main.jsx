import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'

import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'

import App from './App.jsx'

import { ApplicationStateProvider } from './providers/applicationStateProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ApplicationStateProvider>
      <App />
    </ApplicationStateProvider>
  </StrictMode>
)
