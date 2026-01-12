import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { NotFoundPage } from '@/pages/public/NotFoundPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { DashboardPage as AdminDashboardPage } from '@/pages/admin/DashboardPage'
import { ContestsPage } from '@/pages/admin/ContestsPage'
import { JudgeDashboardPage } from '@/pages/judge/DashboardPage'
import { AdminRoute } from './AdminRoute'
import { JudgeRoute } from './JudgeRoute'
import { AdminLayout } from '@/features/admin/components/AdminLayout'

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

  // Admin routes (protected - admin only) with layout
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboardPage /> },
      { path: 'contests', element: <ContestsPage /> },
      // Future routes: contests/:id, contests/:id/categories, etc.
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
