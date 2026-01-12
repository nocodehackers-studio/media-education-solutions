import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { NotFoundPage } from '@/pages/public/NotFoundPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { DashboardPage as AdminDashboardPage } from '@/pages/admin/DashboardPage'
import { JudgeDashboardPage } from '@/pages/judge/DashboardPage'
import { AdminRoute } from './AdminRoute'
import { JudgeRoute } from './JudgeRoute'

const router = createBrowserRouter([
  // Public routes
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },

  // Admin routes (protected - admin only)
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <Navigate to="/admin/dashboard" replace />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/dashboard',
    element: (
      <AdminRoute>
        <AdminDashboardPage />
      </AdminRoute>
    ),
  },
  // More admin routes will be added in Story 2.2+

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
        <JudgeDashboardPage />
      </JudgeRoute>
    ),
  },
  // More judge routes will be added in Epic 3

  // Default redirect - send to login
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },

  // 404 catch-all
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
