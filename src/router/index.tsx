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

// Lazy load public pages
const NotFoundPage = lazy(() =>
  import('@/pages/public/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
)

// Lazy load admin pages
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

// Critical path - eagerly loaded (participant entry is the landing page)
import { CodeEntryPage } from '@/pages/participant/CodeEntryPage'

// Lazy load participant pages
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
const ParticipantSubmissionsPage = lazy(() =>
  import('@/pages/participant/ParticipantSubmissionsPage').then((m) => ({
    default: m.ParticipantSubmissionsPage,
  }))
)
const CategoryDetailPage = lazy(() =>
  import('@/pages/participant/CategoryDetailPage').then((m) => ({
    default: m.CategoryDetailPage,
  }))
)

/**
 * F3 fix: Two fallback variants for different route contexts.
 *
 * AdminLazyFallback: Renders in the AdminLayout <Outlet /> content area.
 * Uses flex-1 to fill remaining space inside the already-visible layout.
 */
function AdminLazyFallback() {
  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        <div className="h-32 w-full bg-muted animate-pulse rounded mt-4" />
      </div>
    </div>
  )
}

/**
 * PageLazyFallback: For standalone full-page routes (auth, participant, public, judge).
 * Provides its own min-h-screen centering since there's no parent layout.
 */
function PageLazyFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="space-y-4 w-full max-w-md p-4">
        <div className="h-8 w-48 mx-auto bg-muted animate-pulse rounded" />
        <div className="h-4 w-64 mx-auto bg-muted animate-pulse rounded" />
        <div className="h-32 w-full bg-muted animate-pulse rounded mt-4" />
      </div>
    </div>
  )
}

/** Suspense wrapper for routes inside AdminLayout */
function AdminLazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<AdminLazyFallback />}>{children}</Suspense>
}

/** Suspense wrapper for standalone full-page routes */
function PageLazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLazyFallback />}>{children}</Suspense>
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
      <PageLazyRoute>
        <ForgotPasswordPage />
      </PageLazyRoute>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <PageLazyRoute>
        <ResetPasswordPage />
      </PageLazyRoute>
    ),
  },
  {
    path: '/set-password',
    element: (
      <PageLazyRoute>
        <SetPasswordPage />
      </PageLazyRoute>
    ),
  },

  // Admin routes (protected - admin only) with layout
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <PageLazyRoute>
          <AdminLayout />
        </PageLazyRoute>
      </AdminRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <AdminLazyRoute>
            <AdminDashboardPage />
          </AdminLazyRoute>
        ),
      },
      {
        path: 'contests',
        element: (
          <AdminLazyRoute>
            <ContestsPage />
          </AdminLazyRoute>
        ),
      },
      {
        path: 'contests/:contestId',
        element: (
          <AdminLazyRoute>
            <ContestDetailPage />
          </AdminLazyRoute>
        ),
      },
      {
        path: 'contests/:contestId/submissions',
        element: (
          <AdminLazyRoute>
            <AdminSubmissionsPage />
          </AdminLazyRoute>
        ),
      },
      {
        path: 'contests/:contestId/categories/:categoryId/rankings',
        element: (
          <AdminLazyRoute>
            <AdminCategoryRankingsPage />
          </AdminLazyRoute>
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
        <PageLazyRoute>
          <JudgeDashboardPage />
        </PageLazyRoute>
      </JudgeRoute>
    ),
  },
  // Story 5-1: Category review page
  {
    path: '/judge/categories/:categoryId',
    element: (
      <JudgeRoute>
        <PageLazyRoute>
          <CategoryReviewPage />
        </PageLazyRoute>
      </JudgeRoute>
    ),
  },
  // Story 5-5: Ranking page (top 3 drag & drop)
  {
    path: '/judge/categories/:categoryId/ranking',
    element: (
      <JudgeRoute>
        <PageLazyRoute>
          <RankingPage />
        </PageLazyRoute>
      </JudgeRoute>
    ),
  },
  // Story 5-2: Submission review page (anonymous judging)
  {
    path: '/judge/categories/:categoryId/review/:submissionId',
    element: (
      <JudgeRoute>
        <PageLazyRoute>
          <SubmissionReviewPage />
        </PageLazyRoute>
      </JudgeRoute>
    ),
  },

  // Story 6-6: Public winners page (no auth required)
  {
    path: '/winners/:contestCode',
    element: (
      <PageLazyRoute>
        <PublicWinnersPage />
      </PageLazyRoute>
    ),
  },

  // Participant routes (public entry, protected dashboard)
  {
    path: '/participant',
    element: <Navigate to="/participant/categories" replace />,
  },
  {
    // Backward compat: redirect old info page bookmarks to categories
    path: '/participant/info',
    element: <Navigate to="/participant/categories" replace />,
  },
  {
    path: '/participant/categories',
    element: (
      <ParticipantRoute>
        <PageLazyRoute>
          <ParticipantCategoriesPage />
        </PageLazyRoute>
      </ParticipantRoute>
    ),
  },
  {
    path: '/participant/submissions',
    element: (
      <ParticipantRoute>
        <PageLazyRoute>
          <ParticipantSubmissionsPage />
        </PageLazyRoute>
      </ParticipantRoute>
    ),
  },
  {
    path: '/participant/category/:categoryId',
    element: (
      <ParticipantRoute>
        <PageLazyRoute>
          <CategoryDetailPage />
        </PageLazyRoute>
      </ParticipantRoute>
    ),
  },
  {
    path: '/participant/submit/:categoryId',
    element: (
      <ParticipantRoute>
        <PageLazyRoute>
          <SubmitPage />
        </PageLazyRoute>
      </ParticipantRoute>
    ),
  },
  {
    // Story 4.6: Submission preview and confirm page
    path: '/participant/preview/:submissionId',
    element: (
      <ParticipantRoute>
        <PageLazyRoute>
          <SubmissionPreviewPage />
        </PageLazyRoute>
      </ParticipantRoute>
    ),
  },

  // Participant entry - primary landing page
  {
    path: '/',
    element: <CodeEntryPage />,
  },

  // 404 catch-all - lazy loaded
  {
    path: '*',
    element: (
      <PageLazyRoute>
        <NotFoundPage />
      </PageLazyRoute>
    ),
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
