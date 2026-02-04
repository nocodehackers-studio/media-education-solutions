import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClient, sessionPersister, initSentry } from '@/lib'
import { AuthProvider, ParticipantSessionProvider } from '@/contexts'
import { App } from './App'
import './index.css'

// Initialize Sentry before React renders
initSentry()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: sessionPersister }}>
      <AuthProvider>
        <ParticipantSessionProvider>
          <App />
        </ParticipantSessionProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  </StrictMode>,
)
