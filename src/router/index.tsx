import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AdminRoute } from './AdminRoute'
import { JudgeRoute } from './JudgeRoute'
import { ParticipantRoute } from './ParticipantRoute'

// Critical path - eagerly loaded (login must be fast)
import { LoginPage } from '@/pages/auth/LoginPage'

// Lazy load auth pages (not as critical as login)
const ForgotPasswordPage = lazy(() =>
  import('@/pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
)
const ResetPasswordPage = lazy(() =>
  import('@/pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage }))
)
const SetPasswordPage = lazy(() =>
  import('@/pages/auth/SetPasswordPage').then((m) => ({ default: m.SetPasswordPage }))
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
const AdminSubmissionsPage = lazy(() =>
  import('@/pages/admin/AdminSubmissionsPage').then((m) => ({ default: m.AdminSubmissionsPage }))
)
const AdminCategoryRankingsPage = lazy(() =>
  import('@/pages/admin/AdminCategoryRankingsPage').then((m) => ({ default: m.AdminCategoryRankingsPage }))
)

// Lazy load judge pages
const JudgeDashboardPage = lazy(() =>
  import('@/pages/judge/DashboardPage').then((m) => ({ default: m.JudgeDashboardPage }))
)
const CategoryReviewPage = lazy(() =>
  import('@/pages/judge/CategoryReviewPage').then((m) => ({ default: m.CategoryReviewPage }))
)
const SubmissionReviewPage = lazy(() =>
  import('@/pages/judge/SubmissionReviewPage').then((m) => ({ default: m.SubmissionReviewPage }))
)
const RankingPage = lazy(() =>
  import('@/pages/judge/RankingPage').then((m) => ({ default: m.RankingPage }))
)

// Lazy load public pages (winners)
const PublicWinnersPage = lazy(() =>
  import('@/pages/public/PublicWinnersPage').then((m) => ({ default: m.PublicWinnersPage }))
)

// Lazy load participant pages
const CodeEntryPage = lazy(() =>
  import('@/pages/participant/CodeEntryPage').then((m) => ({ default: m.CodeEntryPage }))
)
const ParticipantInfoPage = lazy(() =>
  import('@/pages/participant/ParticipantInfoPage').then((m) => ({
    default: m.ParticipantInfoPage,
  }))
)
const ParticipantCategoriesPage = lazy(() =>
  import('@/pages/participant/ParticipantCategoriesPage').then((m) => ({
    default: m.ParticipantCategoriesPage,
  }))
)
const SubmitPage = lazy(() =>
  import('@/pages/participant/SubmitPage').then((m) => ({
    default: m.SubmitPage,
  }))
)
const SubmissionPreviewPage = lazy(() =>
  import('@/pages/participant/SubmissionPreviewPage').then((m) => ({
    default: m.SubmissionPreviewPage,
  }))
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
  {
    path: '/set-password',
    element: (
      <LazyRoute>
        <SetPasswordPage />
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
      {
        path: 'contests/:contestId/submissions',
        element: (
          <LazyRoute>
            <AdminSubmissionsPage />
          </LazyRoute>
        ),
      },
      {
        path: 'contests/:contestId/categories/:categoryId/rankings',
        element: (
          <LazyRoute>
            <AdminCategoryRankingsPage />
          </LazyRoute>
        ),
      },
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
  // Story 5-1: Category review page
  {
    path: '/judge/categories/:categoryId',
    element: (
      <JudgeRoute>
        <LazyRoute>
          <CategoryReviewPage />
        </LazyRoute>
      </JudgeRoute>
    ),
  },
  // Story 5-5: Ranking page (top 3 drag & drop)
  {
    path: '/judge/categories/:categoryId/ranking',
    element: (
      <JudgeRoute>
        <LazyRoute>
          <RankingPage />
        </LazyRoute>
      </JudgeRoute>
    ),
  },
  // Story 5-2: Submission review page (anonymous judging)
  {
    path: '/judge/categories/:categoryId/review/:submissionId',
    element: (
      <JudgeRoute>
        <LazyRoute>
          <SubmissionReviewPage />
        </LazyRoute>
      </JudgeRoute>
    ),
  },

  // Story 6-6: Public winners page (no auth required)
  {
    path: '/winners/:contestCode',
    element: (
      <LazyRoute>
        <PublicWinnersPage />
      </LazyRoute>
    ),
  },

  // Participant routes (public entry, protected dashboard)
  {
    path: '/enter',
    element: (
      <LazyRoute>
        <CodeEntryPage />
      </LazyRoute>
    ),
  },
  {
    path: '/participant',
    element: <Navigate to="/participant/info" replace />,
  },
  {
    path: '/participant/info',
    element: (
      <ParticipantRoute>
        <LazyRoute>
          <ParticipantInfoPage />
        </LazyRoute>
      </ParticipantRoute>
    ),
  },
  {
    path: '/participant/categories',
    element: (
      <ParticipantRoute>
        <LazyRoute>
          <ParticipantCategoriesPage />
        </LazyRoute>
      </ParticipantRoute>
    ),
  },
  {
    path: '/participant/submit/:categoryId',
    element: (
      <ParticipantRoute>
        <LazyRoute>
          <SubmitPage />
        </LazyRoute>
      </ParticipantRoute>
    ),
  },
  {
    // Story 4.6: Submission preview and confirm page
    path: '/participant/preview/:submissionId',
    element: (
      <ParticipantRoute>
        <LazyRoute>
          <SubmissionPreviewPage />
        </LazyRoute>
      </ParticipantRoute>
    ),
  },

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
