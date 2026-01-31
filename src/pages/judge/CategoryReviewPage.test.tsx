/**
 * CategoryReviewPage Unit Tests - Story 5.1
 * Tests category review page with submissions grid, progress, and filtering
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

// Mock auth context
vi.mock('@/contexts', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'judge-123', email: 'judge@test.com', role: 'judge' },
    isLoading: false,
  })),
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ categoryId: 'cat-1' }),
  };
});

// Mock hooks
const mockUseSubmissionsForReview = vi.fn();
vi.mock('@/features/reviews', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/reviews')>();
  return {
    ...actual,
    useSubmissionsForReview: () => mockUseSubmissionsForReview(),
  };
});

const mockUseCategoriesByJudge = vi.fn();
vi.mock('@/features/categories', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/categories')>();
  return {
    ...actual,
    useCategoriesByJudge: () => mockUseCategoriesByJudge(),
  };
});

import { CategoryReviewPage } from './CategoryReviewPage';

const mockSubmissions = [
  {
    id: 'sub-1',
    mediaType: 'photo' as const,
    mediaUrl: 'https://cdn.example.com/photo.jpg',
    thumbnailUrl: null,
    bunnyVideoId: null,
    status: 'submitted',
    submittedAt: '2026-01-15T00:00:00Z',
    participantCode: 'ABC123',
    reviewId: null,
    rating: null,
    feedback: null,
  },
  {
    id: 'sub-2',
    mediaType: 'video' as const,
    mediaUrl: null,
    thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
    bunnyVideoId: 'vid-123',
    status: 'submitted',
    submittedAt: '2026-01-16T00:00:00Z',
    participantCode: 'DEF456',
    reviewId: 'rev-1',
    rating: 8,
    feedback: 'Excellent',
  },
];

const mockCategory = {
  id: 'cat-1',
  name: 'Best Video',
  contestName: 'Summer Contest',
  divisionName: 'Youth Division',
  submissionCount: 2,
  status: 'closed',
  divisionId: 'div-1',
  type: 'video',
  rules: null,
  description: null,
  deadline: '2026-02-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  assignedJudgeId: 'judge-123',
  invitedAt: null,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    );
  };
}

describe('CategoryReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseCategoriesByJudge.mockReturnValue({
      data: [mockCategory],
      isLoading: false,
    });
  });

  it('shows loading skeleton while fetching', () => {
    mockUseSubmissionsForReview.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
      progress: { total: 0, reviewed: 0, pending: 0, percentage: 0 },
    });

    render(<CategoryReviewPage />, { wrapper: createWrapper() });
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays category header with name and contest', () => {
    mockUseSubmissionsForReview.mockReturnValue({
      data: mockSubmissions,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      progress: { total: 2, reviewed: 1, pending: 1, percentage: 50 },
    });

    render(<CategoryReviewPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Best Video')).toBeInTheDocument();
    expect(screen.getByText(/Summer Contest/)).toBeInTheDocument();
    expect(screen.getByText(/Youth Division/)).toBeInTheDocument();
  });

  it('shows progress bar with correct counts', () => {
    mockUseSubmissionsForReview.mockReturnValue({
      data: mockSubmissions,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      progress: { total: 2, reviewed: 1, pending: 1, percentage: 50 },
    });

    render(<CategoryReviewPage />, { wrapper: createWrapper() });
    expect(screen.getByText('1 of 2 reviewed')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders submission cards in grid', () => {
    mockUseSubmissionsForReview.mockReturnValue({
      data: mockSubmissions,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      progress: { total: 2, reviewed: 1, pending: 1, percentage: 50 },
    });

    render(<CategoryReviewPage />, { wrapper: createWrapper() });
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByText('DEF456')).toBeInTheDocument();
  });

  it('filters to show only pending submissions', async () => {
    const user = userEvent.setup();

    mockUseSubmissionsForReview.mockReturnValue({
      data: mockSubmissions,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      progress: { total: 2, reviewed: 1, pending: 1, percentage: 50 },
    });

    render(<CategoryReviewPage />, { wrapper: createWrapper() });

    // Open filter and select Pending
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Pending' }));

    // Only the pending submission should show
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.queryByText('DEF456')).not.toBeInTheDocument();
  });

  it('filters to show only reviewed submissions', async () => {
    const user = userEvent.setup();

    mockUseSubmissionsForReview.mockReturnValue({
      data: mockSubmissions,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      progress: { total: 2, reviewed: 1, pending: 1, percentage: 50 },
    });

    render(<CategoryReviewPage />, { wrapper: createWrapper() });

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Reviewed' }));

    expect(screen.queryByText('ABC123')).not.toBeInTheDocument();
    expect(screen.getByText('DEF456')).toBeInTheDocument();
  });

  it('shows empty state when no submissions', () => {
    mockUseSubmissionsForReview.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      progress: { total: 0, reviewed: 0, pending: 0, percentage: 0 },
    });

    render(<CategoryReviewPage />, { wrapper: createWrapper() });
    expect(screen.getByText('No submissions in this category yet')).toBeInTheDocument();
  });

  it('shows error state with retry button', () => {
    const mockRefetch = vi.fn();
    mockUseSubmissionsForReview.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
      refetch: mockRefetch,
      progress: { total: 0, reviewed: 0, pending: 0, percentage: 0 },
    });

    render(<CategoryReviewPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Failed to load submissions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });

  it('navigates back to dashboard on back button click', async () => {
    const user = userEvent.setup();

    mockUseSubmissionsForReview.mockReturnValue({
      data: mockSubmissions,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      progress: { total: 2, reviewed: 1, pending: 1, percentage: 50 },
    });

    render(<CategoryReviewPage />, { wrapper: createWrapper() });

    const backButton = screen.getByRole('button', { name: /Back to Dashboard/i });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/judge/dashboard');
  });

  // Story 5.5: "Proceed to Ranking" button tests
  it('shows disabled "Proceed to Ranking" button when submissions are pending', () => {
    mockUseSubmissionsForReview.mockReturnValue({
      data: mockSubmissions,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      progress: { total: 2, reviewed: 1, pending: 1, percentage: 50 },
    });

    render(<CategoryReviewPage />, { wrapper: createWrapper() });
    const rankingBtn = screen.getByRole('button', { name: /Proceed to Ranking/i });
    expect(rankingBtn).toBeDisabled();
  });

  it('shows enabled "Proceed to Ranking" button when all submissions reviewed', async () => {
    const user = userEvent.setup();
    const allReviewed = mockSubmissions.map((s) => ({
      ...s,
      reviewId: `rev-${s.id}`,
      rating: 7,
    }));

    mockUseSubmissionsForReview.mockReturnValue({
      data: allReviewed,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      progress: { total: 2, reviewed: 2, pending: 0, percentage: 100 },
    });

    render(<CategoryReviewPage />, { wrapper: createWrapper() });
    const rankingBtn = screen.getByRole('button', { name: /Proceed to Ranking/i });
    expect(rankingBtn).not.toBeDisabled();

    await user.click(rankingBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/judge/categories/cat-1/ranking');
  });
});
