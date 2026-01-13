import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AdminRoute } from './AdminRoute'
import { JudgeRoute } from './JudgeRoute'

// Critical path - eagerly loaded (login must be fast)
import { LoginPage } from '@/pages/auth/LoginPage'

// Lazy load auth pages (not as critical as login)
const ForgotPasswordPage = lazy(() =>
  import('@/pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
)
const ResetPasswordPage = lazy(() =>
  import('@/pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage }))
)

// Lazy load public pages (AC3: keep login page minimal)
const NotFoundPage = lazy(() =>
  import('@/pages/public/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
)

// Lazy load admin pages (AC2/AC3: split routes into chunks)
const AdminLayout = lazy(() =>
  import('@/features/admin').then((m) => ({ default: m.AdminLayout }))
)
const AdminDashboardPage = lazy(() =>
  import('@/pages/admin/DashboardPage').then((m) => ({ default: m.DashboardPage }))
)
const ContestsPage = lazy(() =>
  import('@/pages/admin/ContestsPage').then((m) => ({ default: m.ContestsPage }))
)
const ContestDetailPage = lazy(() =>
  import('@/pages/admin/ContestDetailPage').then((m) => ({ default: m.ContestDetailPage }))
)

// Lazy load judge pages
const JudgeDashboardPage = lazy(() =>
  import('@/pages/judge/DashboardPage').then((m) => ({ default: m.JudgeDashboardPage }))
)

/**
 * Loading fallback for lazy-loaded routes.
 * AC2/AC3: Suspense boundaries with loading fallbacks.
 */
function LazyFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  )
}

/**
 * Wrapper for lazy-loaded routes with Suspense boundary.
 */
function LazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LazyFallback />}>{children}</Suspense>
}

const router = createBrowserRouter([
  // Public routes - Login is critical path, loaded eagerly
  {
    path: '/login',
    element: <LoginPage />,
  },
  // Other auth pages lazy loaded
  {
    path: '/forgot-password',
    element: (
      <LazyRoute>
        <ForgotPasswordPage />
      </LazyRoute>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <LazyRoute>
        <ResetPasswordPage />
      </LazyRoute>
    ),
  },

  // Admin routes (protected - admin only) with layout
  // AC2/AC3: Admin routes lazy loaded, only fetched after login
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <LazyRoute>
          <AdminLayout />
        </LazyRoute>
      </AdminRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <LazyRoute>
            <AdminDashboardPage />
          </LazyRoute>
        ),
      },
      {
        path: 'contests',
        element: (
          <LazyRoute>
            <ContestsPage />
          </LazyRoute>
        ),
      },
      {
        path: 'contests/:contestId',
        element: (
          <LazyRoute>
            <ContestDetailPage />
          </LazyRoute>
        ),
      },
      // Future routes: contests/:id/categories, etc.
    ],
  },

  // Judge routes (protected - judge or admin)
  {
    path: '/judge',
    element: (
      <JudgeRoute>
        <Navigate to="/judge/dashboard" replace />
      </JudgeRoute>
    ),
  },
  {
    path: '/judge/dashboard',
    element: (
      <JudgeRoute>
        <LazyRoute>
          <JudgeDashboardPage />
        </LazyRoute>
      </JudgeRoute>
    ),
  },
  // More judge routes will be added in Epic 3

  // Default redirect - send to login
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },

  // 404 catch-all - lazy loaded (AC3: not needed for login page)
  {
    path: '*',
    element: (
      <LazyRoute>
        <NotFoundPage />
      </LazyRoute>
    ),
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
