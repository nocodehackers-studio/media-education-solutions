/**
 * ContestDetailPage Unit Tests
 * Tests contest detail page with category listing, navigation, and edge cases
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}))

// Mock useAuth
vi.mock('@/contexts', () => ({
  useAuth: vi.fn(),
}))

// Mock navigate and useParams
const mockNavigate = vi.fn()
let mockParams: Record<string, string> = { contestId: 'contest-1' }
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  }
})

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

// Mock useCategoriesByJudge
const mockUseCategoriesByJudge = vi.fn()
vi.mock('@/features/categories', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/categories')>()
  return {
    ...actual,
    useCategoriesByJudge: () => mockUseCategoriesByJudge(),
  }
})

// Mock dateUtils
vi.mock('@/lib/dateUtils', () => ({
  formatDateTimeInTimezone: vi.fn(() => 'Feb 1, 2026 12:00 AM'),
}))

import { ContestDetailPage } from './ContestDetailPage'
import type { CategoryWithContext } from '@/features/categories'
import { useAuth } from '@/contexts'

const mockSignOut = vi.fn()
const mockRefetch = vi.fn()

const mockUser = {
  id: 'judge-123',
  email: 'judge@test.com',
  firstName: 'Test',
  lastName: 'Judge',
  role: 'judge' as const,
}

const mockCategories: CategoryWithContext[] = [
  {
    id: 'cat-1',
    divisionId: 'div-1',
    name: 'Best Video',
    type: 'video',
    rules: null,
    description: null,
    deadline: '2026-02-01T00:00:00Z',
    status: 'closed',
    createdAt: '2026-01-01T00:00:00Z',
    assignedJudgeId: 'judge-123',
    invitedAt: '2026-01-15T00:00:00Z',
    judgingCompletedAt: null,
    contestName: 'Summer Contest',
    contestId: 'contest-1',
    contestTimezone: 'America/New_York',
    divisionName: 'Youth Division',
    submissionCount: 15,
  },
  {
    id: 'cat-2',
    divisionId: 'div-2',
    name: 'Best Photo',
    type: 'photo',
    rules: null,
    description: null,
    deadline: '2026-03-01T00:00:00Z',
    status: 'published',
    createdAt: '2026-01-02T00:00:00Z',
    assignedJudgeId: 'judge-123',
    invitedAt: null,
    judgingCompletedAt: null,
    contestName: 'Summer Contest',
    contestId: 'contest-1',
    contestTimezone: 'America/New_York',
    divisionName: 'Adult Division',
    submissionCount: 8,
  },
  {
    id: 'cat-other',
    divisionId: 'div-other',
    name: 'Other Category',
    type: 'video',
    rules: null,
    description: null,
    deadline: '2026-03-01T00:00:00Z',
    status: 'published',
    createdAt: '2026-01-03T00:00:00Z',
    assignedJudgeId: 'judge-123',
    invitedAt: null,
    judgingCompletedAt: null,
    contestName: 'Winter Contest',
    contestId: 'contest-2',
    contestTimezone: 'America/New_York',
    divisionName: 'Open Division',
    submissionCount: 5,
  },
]

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
}

function createWrapper() {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    )
  }
}

describe('ContestDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSignOut.mockResolvedValue(undefined)
    mockParams = { contestId: 'contest-1' }

    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      signOut: mockSignOut,
      isLoading: false,
      profile: null,
      signIn: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>)
  })

  describe('Category Filtering', () => {
    it('shows only categories for the given contestId', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<ContestDetailPage />, { wrapper: createWrapper() })

      // contest-1 has Best Video and Best Photo
      expect(screen.getByText('Best Video')).toBeInTheDocument()
      expect(screen.getByText('Best Photo')).toBeInTheDocument()
      // contest-2 category should NOT appear
      expect(screen.queryByText('Other Category')).not.toBeInTheDocument()
    })

    it('shows contest name in header', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<ContestDetailPage />, { wrapper: createWrapper() })

      expect(screen.getByText('Summer Contest')).toBeInTheDocument()
    })
  })

  describe('Category Actions', () => {
    it('shows enabled "Start Reviewing" button for closed categories (AC8)', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<ContestDetailPage />, { wrapper: createWrapper() })

      const startButton = screen.getByRole('button', { name: /Start Reviewing/i })
      expect(startButton).not.toBeDisabled()
    })

    it('shows disabled "Not Ready" button for published categories', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<ContestDetailPage />, { wrapper: createWrapper() })

      const notReadyButton = screen.getByRole('button', { name: /Not Ready/i })
      expect(notReadyButton).toBeDisabled()
    })

    it('navigates to category review page when clicking Start Reviewing', async () => {
      const user = userEvent.setup()
      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<ContestDetailPage />, { wrapper: createWrapper() })

      const startButton = screen.getByRole('button', { name: /Start Reviewing/i })
      await user.click(startButton)

      expect(mockNavigate).toHaveBeenCalledWith('/judge/categories/cat-1')
    })
  })

  describe('Contest Not Found (AC12)', () => {
    it('shows "Contest not found" when contestId has no matching categories', () => {
      mockParams = { contestId: 'nonexistent' }
      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<ContestDetailPage />, { wrapper: createWrapper() })

      expect(screen.getByText('Contest not found')).toBeInTheDocument()
    })

    it('shows "Back to Dashboard" button on not found state', async () => {
      const user = userEvent.setup()
      mockParams = { contestId: 'nonexistent' }
      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<ContestDetailPage />, { wrapper: createWrapper() })

      const backButton = screen.getByRole('button', { name: /Back to Dashboard/i })
      await user.click(backButton)

      expect(mockNavigate).toHaveBeenCalledWith('/judge/dashboard')
    })
  })

  describe('Back Navigation (AC9)', () => {
    it('back button navigates to /judge/dashboard', async () => {
      const user = userEvent.setup()
      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<ContestDetailPage />, { wrapper: createWrapper() })

      // The back arrow button (ghost icon button)
      const buttons = screen.getAllByRole('button')
      // First button should be the back arrow
      await user.click(buttons[0])

      expect(mockNavigate).toHaveBeenCalledWith('/judge/dashboard')
    })
  })

  describe('Loading State', () => {
    it('shows skeleton when loading', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      })

      render(<ContestDetailPage />, { wrapper: createWrapper() })

      const skeletons = document.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('Error State', () => {
    it('shows error with retry button', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
        refetch: mockRefetch,
      })

      render(<ContestDetailPage />, { wrapper: createWrapper() })

      expect(screen.getByText('Failed to load contest')).toBeInTheDocument()
      expect(screen.getByText('Network error')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
    })

    it('calls refetch on retry', async () => {
      const user = userEvent.setup()
      mockUseCategoriesByJudge.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
        refetch: mockRefetch,
      })

      render(<ContestDetailPage />, { wrapper: createWrapper() })

      await user.click(screen.getByRole('button', { name: 'Try Again' }))

      expect(mockRefetch).toHaveBeenCalled()
    })
  })
})
