import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts'
import { Skeleton } from '@/components/ui'

interface JudgeRouteProps {
  children: ReactNode
}

/**
 * Loading screen for auth check.
 */
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="space-y-4 w-full max-w-md p-4">
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
        <div className="space-y-2 pt-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
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
