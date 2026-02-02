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
 * Skeleton that mirrors AdminLayout structure: sidebar + breadcrumbs + content.
 * CSS-only (no UI component imports) to keep initial bundle lean.
 */
function AdminLoadingSkeleton() {
  return (
    <div className="flex min-h-screen bg-background" data-testid="admin-loading-skeleton">
      {/* Desktop sidebar skeleton */}
      <aside className="hidden md:flex w-64 flex-col bg-card border-r">
        <div className="p-4 border-b">
          <div className="h-6 w-28 bg-muted animate-pulse rounded" />
        </div>
        <div className="p-4 space-y-2">
          <div className="h-8 w-full bg-muted animate-pulse rounded" />
          <div className="h-8 w-full bg-muted animate-pulse rounded" />
        </div>
      </aside>
      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="border-b px-4 py-2">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        </div>
        <main className="flex-1 p-4 md:p-6">
          <div className="space-y-4">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
            <div className="grid gap-4 md:grid-cols-3 pt-4">
              <div className="h-24 bg-muted animate-pulse rounded" />
              <div className="h-24 bg-muted animate-pulse rounded" />
              <div className="h-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

/**
 * Protected route that requires admin role.
 * Redirects:
 * - Unauthenticated users -> /login
 * - Judges -> /judge/dashboard
 *
 * With cached profile, isLoading is usually false on mount.
 * Skeleton only shows when there's no cached profile (first-ever visit or cache cleared).
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
    return <AdminLoadingSkeleton />
  }

  // No session (or safety-net timed out) - redirect to login
  if (!isAuthenticated || (waitingForProfile && profileTimedOut)) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Session exists but profile still loading in background
  if (!user) {
    return <AdminLoadingSkeleton />
  }

  // Profile loaded, check role
  if (user.role !== 'admin') {
    return <Navigate to="/judge/dashboard" replace />
  }

  return <>{children}</>
}
