import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts'

interface AdminRouteProps {
  children: ReactNode
}

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
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  // Still loading auth state
  if (isLoading) {
    return <LoadingScreen />
  }

  // No session - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // AC1: Session exists but profile still loading in background
  // Show loading screen, don't redirect to judge dashboard
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
