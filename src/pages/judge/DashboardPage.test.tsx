/**
 * JudgeDashboardPage Unit Tests - Story 3-4
 * Tests judge dashboard with assigned categories, status display, and navigation
 *
 * AC1: Login with Valid Credentials (tested via redirect)
 * AC2: Dashboard Shows Assigned Categories
 * AC3: Closed Category Display
 * AC4: Published Category Display
 * AC5: Empty State
 * AC6: Forgot Password Flow (tested separately)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

// Mock supabase first to avoid env var issues
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

// Mock the hooks
vi.mock('@/contexts', () => ({
  useAuth: vi.fn(),
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock useCategoriesByJudge
const mockUseCategoriesByJudge = vi.fn();
vi.mock('@/features/categories', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/categories')>();
  return {
    ...actual,
    useCategoriesByJudge: () => mockUseCategoriesByJudge(),
  };
});

import { JudgeDashboardPage } from './DashboardPage';
import type { CategoryWithContext } from '@/features/categories';
import { useAuth } from '@/contexts';
import { toast } from 'sonner';

const mockSignOut = vi.fn();
const mockRefetch = vi.fn();

const mockUser = {
  id: 'judge-123',
  email: 'judge@test.com',
  firstName: 'Test',
  lastName: 'Judge',
  role: 'judge' as const,
};

// Mock categories with different statuses
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
];

// Create a fresh QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

// Wrapper component with providers
function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    );
  };
}

describe('JudgeDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignOut.mockResolvedValue(undefined);

    // Default auth mock
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      signOut: mockSignOut,
      isLoading: false,
      profile: null,
      signIn: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
  });

  describe('Loading State', () => {
    it('renders loading skeleton when data is loading', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      });

      render(<JudgeDashboardPage />, { wrapper: createWrapper() });

      // Should show loading skeleton (presence of skeleton elements)
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('AC5: Empty State', () => {
    it('shows "No categories assigned yet" when categories array is empty', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<JudgeDashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText('No categories assigned yet')).toBeInTheDocument();
      expect(
        screen.getByText(
          "You'll see your assigned categories here once an admin assigns you"
        )
      ).toBeInTheDocument();
    });

    it('shows zero counts in stat cards when empty', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<JudgeDashboardPage />, { wrapper: createWrapper() });

      // All stat cards should show 0 (4 cards: total, ready, completed, awaiting)
      const zeros = screen.getAllByText('0');
      expect(zeros).toHaveLength(4);
    });
  });

  describe('AC2: Dashboard Shows Assigned Categories', () => {
    it('renders all assigned categories', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<JudgeDashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Best Video')).toBeInTheDocument();
      expect(screen.getByText('Best Photo')).toBeInTheDocument();
    });

    it('shows contest name, category name, and division name', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<JudgeDashboardPage />, { wrapper: createWrapper() });

      // Contest and division names in description
      expect(screen.getByText(/Summer Contest/)).toBeInTheDocument();
      expect(screen.getByText(/Youth Division/)).toBeInTheDocument();
      expect(screen.getByText(/Winter Contest/)).toBeInTheDocument();
      expect(screen.getByText(/Adult Division/)).toBeInTheDocument();
    });

    it('shows submission count for each category', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<JudgeDashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });
  });

  describe('AC3: Closed Category Display', () => {
    it('shows "Start Reviewing" button for closed categories', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<JudgeDashboardPage />, { wrapper: createWrapper() });

      const startButton = screen.getByRole('button', { name: /Start Reviewing/i });
      expect(startButton).toBeInTheDocument();
      expect(startButton).not.toBeDisabled();
    });

    it('shows "Closed" badge for closed categories', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<JudgeDashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Closed')).toBeInTheDocument();
    });

    it('shows "Ready for review" text for closed categories', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<JudgeDashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Ready for review')).toBeInTheDocument();
    });

    it('navigates to category review page when clicking Start Reviewing', async () => {
      const user = userEvent.setup();

      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<JudgeDashboardPage />, { wrapper: createWrapper() });

      const startButton = screen.getByRole('button', { name: /Start Reviewing/i });
      await user.click(startButton);

      expect(mockNavigate).toHaveBeenCalledWith('/judge/categories/cat-1');
    });
  });

  describe('AC4: Published Category Display', () => {
    it('shows disabled "Not Ready" button for published categories', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<JudgeDashboardPage />, { wrapper: createWrapper() });

      const notReadyButton = screen.getByRole('button', { name: /Not Ready/i });
      expect(notReadyButton).toBeInTheDocument();
      expect(notReadyButton).toBeDisabled();
    });

    it('shows "Published" badge for published categories', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<JudgeDashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Published')).toBeInTheDocument();
    });

    it('shows deadline text for published categories', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<JudgeDashboardPage />, { wrapper: createWrapper() });

      // Now shows "Deadline: {date} ({relative time})" format
      expect(screen.getByText(/Deadline:/i)).toBeInTheDocument();
    });
  });

  describe('Stats Cards', () => {
    it('shows correct counts for total, closed, completed, and awaiting categories', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<JudgeDashboardPage />, { wrapper: createWrapper() });

      // Total: 2, Ready to Review (closed): 1, Completed: 0, Awaiting: 1
      expect(screen.getByText('Assigned Categories')).toBeInTheDocument();
      expect(screen.getByText('Ready to Review')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Awaiting Deadline')).toBeInTheDocument();

      // Check values
      expect(screen.getByText('2')).toBeInTheDocument(); // total
    });
  });

  describe('Logout Functionality', () => {
    it('calls signOut and navigates to login on logout', async () => {
      const user = userEvent.setup();

      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<JudgeDashboardPage />, { wrapper: createWrapper() });

      const logoutButton = screen.getByRole('button', { name: /Log out/i });
      await user.click(logoutButton);

      expect(mockSignOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('shows error toast when signOut fails', async () => {
      const user = userEvent.setup();
      mockSignOut.mockRejectedValue(new Error('Network error'));

      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<JudgeDashboardPage />, { wrapper: createWrapper() });

      const logoutButton = screen.getByRole('button', { name: /Log out/i });
      await user.click(logoutButton);

      expect(toast.error).toHaveBeenCalledWith('Network error');
    });
  });

  describe('Error State', () => {
    it('shows error message with retry button', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch categories'),
        refetch: mockRefetch,
      });

      render(<JudgeDashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Failed to load dashboard')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch categories')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });

    it('calls refetch when clicking Try Again', async () => {
      const user = userEvent.setup();

      mockUseCategoriesByJudge.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch categories'),
        refetch: mockRefetch,
      });

      render(<JudgeDashboardPage />, { wrapper: createWrapper() });

      const retryButton = screen.getByRole('button', { name: 'Try Again' });
      await user.click(retryButton);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  // Story 5-6: Completed category tests
  describe('Story 5-6: Completed Category', () => {
    const completedCategories: CategoryWithContext[] = [
      {
        ...mockCategories[0],
        judgingCompletedAt: '2026-01-30T12:00:00Z',
      },
      mockCategories[1],
    ];

    it('shows "Complete" badge for completed categories', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: completedCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<JudgeDashboardPage />, { wrapper: createWrapper() });
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    it('shows "View Reviews" button for completed categories', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: completedCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<JudgeDashboardPage />, { wrapper: createWrapper() });
      expect(screen.getByRole('button', { name: /View Reviews/i })).toBeInTheDocument();
    });

    it('keeps button enabled for completed categories (read-only viewing)', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: completedCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<JudgeDashboardPage />, { wrapper: createWrapper() });
      const viewButton = screen.getByRole('button', { name: /View Reviews/i });
      expect(viewButton).not.toBeDisabled();
    });

    it('navigates to category when clicking "View Reviews"', async () => {
      const user = userEvent.setup();
      mockUseCategoriesByJudge.mockReturnValue({
        data: completedCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<JudgeDashboardPage />, { wrapper: createWrapper() });
      await user.click(screen.getByRole('button', { name: /View Reviews/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/judge/categories/cat-1');
    });
  });

  describe('Header', () => {
    it('displays welcome message with user first name', () => {
      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<JudgeDashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Welcome, Test')).toBeInTheDocument();
      expect(
        screen.getByText('Review submissions for your assigned categories')
      ).toBeInTheDocument();
    });

    it('falls back to email prefix when firstName is not available', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { ...mockUser, firstName: undefined },
        signOut: mockSignOut,
        isLoading: false,
        profile: null,
        signIn: vi.fn(),
      } as unknown as ReturnType<typeof useAuth>);

      mockUseCategoriesByJudge.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      });

      render(<JudgeDashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Welcome, judge')).toBeInTheDocument();
    });
  });
});
