import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import WebApp from '@twa-dev/sdk'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { SavedJobsProvider } from './contexts/SavedJobsContext.jsx'

WebApp.ready()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <SavedJobsProvider>
        <App />
      </SavedJobsProvider>
    </ErrorBoundary>
  </StrictMode>,
)
