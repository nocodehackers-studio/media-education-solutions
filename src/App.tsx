import { AppRouter } from '@/router'
import { Toaster } from '@/components/ui'
import { ErrorBoundary } from '@/components'

export function App() {
  return (
    <ErrorBoundary>
      <AppRouter />
      <Toaster position="top-right" duration={4000} closeButton />
    </ErrorBoundary>
  )
}
