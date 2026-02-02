import { type ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts'

interface AdminRouteProps {
  children: ReactNode
}

// Safety net: if profile never arrives after this many ms, redirect to login
const PROFILE_WAIT_TIMEOUT = 5000

/**
 * Minimal loading screen for auth check.
 * AC3: Uses CSS-only animation to avoid pulling in UI components to initial bundle.
 */
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  )
}

/**
 * Protected route that requires admin role.
 * Redirects:
 * - Unauthenticated users → /login
 * - Judges → /judge/dashboard
 *
 * AC1: Handles case where session exists but profile still loading.
 * In this case, isAuthenticated=true but user=null - show loading, not redirect.
 * Safety net: times out after 5s to prevent infinite loading.
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading, isAuthenticated, signOut } = useAuth()
  const location = useLocation()
  const [profileTimedOut, setProfileTimedOut] = useState(false)

  // Safety net: if we're stuck waiting for a profile that never arrives,
  // sign out and redirect to login instead of spinning forever.
  const waitingForProfile = !isLoading && isAuthenticated && !user
  useEffect(() => {
    if (!waitingForProfile) {
      setProfileTimedOut(false)
      return
    }

    const timer = setTimeout(() => {
      console.error('AdminRoute: profile never loaded after 5s — signing out')
      setProfileTimedOut(true)
      signOut().catch(() => {})
    }, PROFILE_WAIT_TIMEOUT)

    return () => clearTimeout(timer)
  }, [waitingForProfile, signOut])

  // Still loading auth state
  if (isLoading) {
    return <LoadingScreen />
  }

  // No session (or safety-net timed out) - redirect to login
  if (!isAuthenticated || profileTimedOut) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // AC1: Session exists but profile still loading in background
  // Show loading screen briefly, safety-net timeout prevents infinite spin
  if (!user) {
    return <LoadingScreen />
  }

  // Profile loaded, check role
  if (user.role !== 'admin') {
    // Judge trying to access admin routes
    return <Navigate to="/judge/dashboard" replace />
  }

  return <>{children}</>
}
