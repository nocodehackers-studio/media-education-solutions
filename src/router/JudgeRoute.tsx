import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts'

interface JudgeRouteProps {
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
 * Protected route that requires judge role.
 * Redirects:
 * - Unauthenticated users → /login
 * - Admins can also access judge routes (admin is superset of judge)
 */
export function JudgeRoute({ children }: JudgeRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Both admin and judge can access judge routes
  if (user?.role !== 'admin' && user?.role !== 'judge') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
