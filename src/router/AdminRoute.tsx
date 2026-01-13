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
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user?.role !== 'admin') {
    // Judge trying to access admin routes
    return <Navigate to="/judge/dashboard" replace />
  }

  return <>{children}</>
}
