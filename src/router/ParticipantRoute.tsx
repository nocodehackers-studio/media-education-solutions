import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useParticipantSession } from '@/contexts'

interface ParticipantRouteProps {
  children: ReactNode
}

/**
 * Protected route that requires participant session.
 * Redirects unauthenticated participants to /.
 * Uses code-based session (NOT Supabase Auth).
 */
export function ParticipantRoute({ children }: ParticipantRouteProps) {
  const { isLoading, isAuthenticated, sessionExpired, clearExpired } =
    useParticipantSession()
  const location = useLocation()

  // Still loading session state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // No session - redirect to entry page
  if (!isAuthenticated) {
    // If session timed out, pass expired flag so CodeEntryPage can show message
    if (sessionExpired) {
      clearExpired()
      return <Navigate to="/" state={{ from: location, expired: true }} replace />
    }
    return <Navigate to="/" state={{ from: location }} replace />
  }

  return <>{children}</>
}
