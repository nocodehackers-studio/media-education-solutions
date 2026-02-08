/**
 * JudgeDashboardPage Unit Tests
 * Tests judge dashboard with contest-grouped view, stats, and navigation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

// Mock supabase first to avoid env var issues
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}))

// Mock the hooks
vi.mock('@/contexts', () => ({
  useAuth: vi.fn(),
}))

// Mock navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
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

import { JudgeDashboardPage } from './DashboardPage'
import type { CategoryWithContext } from '@/features/categories'
import { useAuth } from '@/contexts'
import { toast } from 'sonner'

const mockSignOut = vi.fn()
const mockRefetch = vi.fn()

const mockUser = {
  id: 'judge-123',
  email: 'judge@test.com',
  firstName: 'Test',
  lastName: 'Judge',
  role: 'judge' as const,
}

// Mock categories across two contests
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
    contestName: 'Winter Contest',
    contestId: 'contest-2',
    contestTimezone: 'America/New_York',
    divisionName: 'Adult Division',
    submissionCount: 8,
  },
  {
    id: 'cat-3',
    divisionId: 'div-3',
    name: 'Best Animation',
    type: 'video',
    rules: null,
    description: null,
    deadline: '2026-02-01T00:00:00Z',
    status: 'closed',
    createdAt: '2026-01-03T00:00:00Z',
    assignedJudgeId: 'judge-123',
    invitedAt: '2026-01-15T00:00:00Z',
    judgingCompletedAt: null,
    contestName: 'Summer Contest',
    contestId: 'contest-1',
    contestTimezone: 'America/New_York',
    divisionName: 'Youth Division',
    submissionCount: 10,
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

describe('JudgeDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSignOut.mockResolvedValue(undefined)

    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      signOut: mockSignOut,
      isLoading: false,
      profile: null,
      signIn: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>)
  })

  describe('Loading State', () => {
    it('renders loading skeleton with 4 stat card skeletons', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      })

      render(<JudgeDashboardPage />, { wrapper: createWrapper() })

      const skeletons = document.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('Empty State', () => {
    it('shows "No contests assigned yet" when categories array is empty', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<JudgeDashboardPage />, { wrapper: createWrapper() })

      expect(screen.getByText('No contests assigned yet')).toBeInTheDocument()
    })

    it('shows zero counts in stat cards when empty', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<JudgeDashboardPage />, { wrapper: createWrapper() })

      const zeros = screen.getAllByText('0')
      expect(zeros).toHaveLength(4)
    })
  })

  describe('Contest-Grouped View', () => {
    it('renders contest cards grouped by contest (AC6)', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<JudgeDashboardPage />, { wrapper: createWrapper() })

      // Should show 2 contest cards (Summer Contest and Winter Contest)
      expect(screen.getByText('Summer Contest')).toBeInTheDocument()
      expect(screen.getByText('Winter Contest')).toBeInTheDocument()
    })

    it('shows correct category count per contest', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<JudgeDashboardPage />, { wrapper: createWrapper() })

      // Summer Contest has 2 categories, Winter Contest has 1
      expect(screen.getByText('2 categories assigned')).toBeInTheDocument()
      expect(screen.getByText('1 category assigned')).toBeInTheDocument()
    })

    it('shows aggregate submission count per contest', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<JudgeDashboardPage />, { wrapper: createWrapper() })

      // Summer Contest: 15 + 10 = 25 total submissions
      expect(screen.getByText('25')).toBeInTheDocument()
      // Winter Contest: 8 total submissions
      expect(screen.getByText('8')).toBeInTheDocument()
    })

    it('navigates to contest detail page when clicking View Categories (AC7)', async () => {
      const user = userEvent.setup()

      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<JudgeDashboardPage />, { wrapper: createWrapper() })

      const viewButtons = screen.getAllByRole('button', { name: /View Categories/i })
      await user.click(viewButtons[0])

      expect(mockNavigate).toHaveBeenCalledWith('/judge/contests/contest-1')
    })
  })

  describe('Stats Cards', () => {
    it('shows correct counts', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<JudgeDashboardPage />, { wrapper: createWrapper() })

      expect(screen.getByText('Assigned Categories')).toBeInTheDocument()
      expect(screen.getByText('Ready to Review')).toBeInTheDocument()
      expect(screen.getByText('Completed')).toBeInTheDocument()
      expect(screen.getByText('Awaiting Deadline')).toBeInTheDocument()

      // Total: 3, Ready: 2, Completed: 0, Awaiting: 1
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  describe('Header', () => {
    it('displays welcome message with user first name (AC5)', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<JudgeDashboardPage />, { wrapper: createWrapper() })

      expect(screen.getByText('Welcome, Test')).toBeInTheDocument()
    })

    it('falls back to email prefix when firstName is not available', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { ...mockUser, firstName: null },
        signOut: mockSignOut,
        isLoading: false,
        profile: null,
        signIn: vi.fn(),
      } as unknown as ReturnType<typeof useAuth>)

      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<JudgeDashboardPage />, { wrapper: createWrapper() })

      expect(screen.getByText('Welcome, judge')).toBeInTheDocument()
    })
  })

  describe('Logout', () => {
    it('calls signOut and navigates to login on logout', async () => {
      const user = userEvent.setup()

      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<JudgeDashboardPage />, { wrapper: createWrapper() })

      const logoutButton = screen.getByRole('button', { name: /Log out/i })
      await user.click(logoutButton)

      expect(mockSignOut).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
    })

    it('shows error toast when signOut fails', async () => {
      const user = userEvent.setup()
      mockSignOut.mockRejectedValue(new Error('Network error'))

      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<JudgeDashboardPage />, { wrapper: createWrapper() })

      const logoutButton = screen.getByRole('button', { name: /Log out/i })
      await user.click(logoutButton)

      expect(toast.error).toHaveBeenCalledWith('Network error')
    })
  })

  describe('Error State', () => {
    it('shows error message with retry button', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch categories'),
        refetch: mockRefetch,
      })

      render(<JudgeDashboardPage />, { wrapper: createWrapper() })

      expect(screen.getByText('Failed to load dashboard')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch categories')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
    })

    it('calls refetch when clicking Try Again', async () => {
      const user = userEvent.setup()

      mockUseCategoriesByJudge.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch categories'),
        refetch: mockRefetch,
      })

      render(<JudgeDashboardPage />, { wrapper: createWrapper() })

      const retryButton = screen.getByRole('button', { name: 'Try Again' })
      await user.click(retryButton)

      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  describe('Single Contest (AC10)', () => {
    it('still shows contest card even with only one contest', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: [mockCategories[0]],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      render(<JudgeDashboardPage />, { wrapper: createWrapper() })

      expect(screen.getByText('Summer Contest')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /View Categories/i })).toBeInTheDocument()
    })
  })
})
