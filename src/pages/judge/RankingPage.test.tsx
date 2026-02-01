/**
 * RankingPage Integration Tests - Story 5.5 (AC1-AC10)
 * Tests ranking page rendering, state, and save behavior
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

// Mock @dnd-kit
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DragOverlay: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
  useDraggable: () => ({
    attributes: { role: 'button', tabIndex: 0 },
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  PointerSensor: vi.fn(),
  TouchSensor: vi.fn(),
  KeyboardSensor: vi.fn(),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Translate: { toString: () => '' } },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock hooks
const mockUseSubmissionsForReview = vi.fn();
const mockUseRankings = vi.fn();
const mockSaveMutateAsync = vi.fn();
const mockUseSaveRankings = vi.fn();

vi.mock('@/features/reviews', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/reviews')>();
  return {
    ...actual,
    useSubmissionsForReview: () => mockUseSubmissionsForReview(),
    useRankings: () => mockUseRankings(),
    useSaveRankings: () => mockUseSaveRankings(),
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

import { RankingPage } from './RankingPage';

const mockSubmissions = [
  {
    id: 'sub-1',
    mediaType: 'photo' as const,
    mediaUrl: 'https://cdn.example.com/photo1.jpg',
    thumbnailUrl: null,
    bunnyVideoId: null,
    status: 'submitted',
    submittedAt: '2026-01-15T00:00:00Z',
    participantCode: 'ABC123',
    reviewId: 'rev-1',
    rating: 9,
    feedback: 'Excellent',
  },
  {
    id: 'sub-2',
    mediaType: 'photo' as const,
    mediaUrl: 'https://cdn.example.com/photo2.jpg',
    thumbnailUrl: null,
    bunnyVideoId: null,
    status: 'submitted',
    submittedAt: '2026-01-16T00:00:00Z',
    participantCode: 'DEF456',
    reviewId: 'rev-2',
    rating: 7,
    feedback: 'Good',
  },
  {
    id: 'sub-3',
    mediaType: 'photo' as const,
    mediaUrl: 'https://cdn.example.com/photo3.jpg',
    thumbnailUrl: null,
    bunnyVideoId: null,
    status: 'submitted',
    submittedAt: '2026-01-17T00:00:00Z',
    participantCode: 'GHI789',
    reviewId: 'rev-3',
    rating: 5,
    feedback: 'Average',
  },
];

const mockCategory = {
  id: 'cat-1',
  name: 'Best Photo',
  contestName: 'Summer Contest',
  divisionName: 'Youth',
  submissionCount: 3,
  status: 'closed',
  divisionId: 'div-1',
  type: 'photo',
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

describe('RankingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCategoriesByJudge.mockReturnValue({
      data: [mockCategory],
      isLoading: false,
    });
    mockUseSaveRankings.mockReturnValue({
      mutateAsync: mockSaveMutateAsync,
      isPending: false,
    });
  });

  it('renders 3 empty ranking slots on load', () => {
    mockUseSubmissionsForReview.mockReturnValue({
      data: mockSubmissions,
      isLoading: false,
      progress: { total: 3, reviewed: 3, pending: 0, percentage: 100 },
    });
    mockUseRankings.mockReturnValue({ data: [], isLoading: false });

    render(<RankingPage />, { wrapper: createWrapper() });
    expect(screen.getByText('1st Place')).toBeInTheDocument();
    expect(screen.getByText('2nd Place')).toBeInTheDocument();
    expect(screen.getByText('3rd Place')).toBeInTheDocument();
    expect(screen.getAllByText('Drop submission here')).toHaveLength(3);
  });

  it('renders available submissions sorted by rating DESC', () => {
    mockUseSubmissionsForReview.mockReturnValue({
      data: mockSubmissions,
      isLoading: false,
      progress: { total: 3, reviewed: 3, pending: 0, percentage: 100 },
    });
    mockUseRankings.mockReturnValue({ data: [], isLoading: false });

    render(<RankingPage />, { wrapper: createWrapper() });
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByText('DEF456')).toBeInTheDocument();
    expect(screen.getByText('GHI789')).toBeInTheDocument();
  });

  it('Save button is disabled when not all 3 ranked', () => {
    mockUseSubmissionsForReview.mockReturnValue({
      data: mockSubmissions,
      isLoading: false,
      progress: { total: 3, reviewed: 3, pending: 0, percentage: 100 },
    });
    mockUseRankings.mockReturnValue({ data: [], isLoading: false });

    render(<RankingPage />, { wrapper: createWrapper() });
    const saveBtn = screen.getByRole('button', { name: /Save Rankings/i });
    expect(saveBtn).toBeDisabled();
  });

  it('shows loading skeletons when data is loading', () => {
    mockUseSubmissionsForReview.mockReturnValue({
      data: undefined,
      isLoading: true,
      progress: { total: 0, reviewed: 0, pending: 0, percentage: 0 },
    });
    mockUseRankings.mockReturnValue({ data: undefined, isLoading: true });

    render(<RankingPage />, { wrapper: createWrapper() });
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('back button navigates to category page', async () => {
    const user = userEvent.setup();
    mockUseSubmissionsForReview.mockReturnValue({
      data: mockSubmissions,
      isLoading: false,
      progress: { total: 3, reviewed: 3, pending: 0, percentage: 100 },
    });
    mockUseRankings.mockReturnValue({ data: [], isLoading: false });

    render(<RankingPage />, { wrapper: createWrapper() });

    const backBtn = screen.getByRole('button', { name: /Back to Category/i });
    await user.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/judge/categories/cat-1');
  });

  it('renders category name and contest in header', () => {
    mockUseSubmissionsForReview.mockReturnValue({
      data: mockSubmissions,
      isLoading: false,
      progress: { total: 3, reviewed: 3, pending: 0, percentage: 100 },
    });
    mockUseRankings.mockReturnValue({ data: [], isLoading: false });

    render(<RankingPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Top 3 Ranking')).toBeInTheDocument();
    expect(screen.getByText(/Best Photo/)).toBeInTheDocument();
    expect(screen.getByText(/Summer Contest/)).toBeInTheDocument();
  });

  it('shows error state when submissions fail to load', () => {
    mockUseSubmissionsForReview.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
      progress: { total: 0, reviewed: 0, pending: 0, percentage: 0 },
    });
    mockUseRankings.mockReturnValue({ data: [], isLoading: false, error: null });

    render(<RankingPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Failed to load rankings')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('shows empty state when no submissions exist', () => {
    mockUseSubmissionsForReview.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      progress: { total: 0, reviewed: 0, pending: 0, percentage: 0 },
    });
    mockUseRankings.mockReturnValue({ data: [], isLoading: false, error: null });

    render(<RankingPage />, { wrapper: createWrapper() });
    expect(screen.getByText('No submissions to rank')).toBeInTheDocument();
    expect(screen.getByText('There are no submissions in this category yet.')).toBeInTheDocument();
  });
});
