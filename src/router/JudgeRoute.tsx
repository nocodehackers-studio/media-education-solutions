import { type ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts'

interface JudgeRouteProps {
  children: ReactNode
}

// Safety net: if profile never arrives after this many ms, redirect to login
const PROFILE_WAIT_TIMEOUT = 5000

/**
 * Simple centered skeleton for judge routes (no sidebar layout).
 * CSS-only, no UI component imports.
 */
function JudgeLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6" data-testid="judge-loading-skeleton">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        <div className="space-y-3 pt-4">
          <div className="h-24 w-full bg-muted animate-pulse rounded" />
          <div className="h-24 w-full bg-muted animate-pulse rounded" />
        </div>
      </div>
    </div>
  )
}

/**
 * Protected route that requires judge role.
 * Redirects:
 * - Unauthenticated users -> /login
 * - Admins can also access judge routes (admin is superset of judge)
 *
 * Safety net: times out after 5s to prevent infinite loading.
 */
export function JudgeRoute({ children }: JudgeRouteProps) {
  const { user, isLoading, isAuthenticated, signOut } = useAuth()
  const location = useLocation()
  const [profileTimedOut, setProfileTimedOut] = useState(false)

  // Safety net: if we're stuck waiting for a profile that never arrives,
  // sign out and redirect to login instead of spinning forever.
  const waitingForProfile = !isLoading && isAuthenticated && !user
  useEffect(() => {
    if (!waitingForProfile) {
      return
    }

    const timer = setTimeout(() => {
      console.error('JudgeRoute: profile never loaded after 5s — signing out')
      setProfileTimedOut(true)
      signOut().catch(() => {})
    }, PROFILE_WAIT_TIMEOUT)

    return () => clearTimeout(timer)
  }, [waitingForProfile, signOut])

  // Still loading auth state
  if (isLoading) {
    return <JudgeLoadingSkeleton />
  }

  // No session (or safety-net timed out) - redirect to login
  if (!isAuthenticated || (waitingForProfile && profileTimedOut)) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Session exists but profile still loading in background
  if (!user) {
    return <JudgeLoadingSkeleton />
  }

  // Profile loaded, check role - both admin and judge can access judge routes
  if (user.role !== 'admin' && user.role !== 'judge') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
