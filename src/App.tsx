import { AppRouter } from '@/router'
import { Toaster } from '@/components/ui'
import { ErrorBoundary } from '@/components'

export function App() {
  return (
    <ErrorBoundary>
      <AppRouter />
      <Toaster position="bottom-right" duration={10000} closeButton />
    </ErrorBoundary>
  )
}
