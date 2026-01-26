// JudgesTab tests - Story 3-5
// Tests judge progress tab functionality
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { JudgesTab } from './JudgesTab';
import * as categoriesApi from '../api/categoriesApi';
import type { Category } from '../types';

// Mock the categories API
vi.mock('../api/categoriesApi', () => ({
  categoriesApi: {
    listByContest: vi.fn(),
  },
}));

// Mock supabase for useJudgeProgress hook
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() =>
          Promise.resolve({ count: 5, error: null })
        ),
      })),
    })),
  },
}));

// Mock toast
vi.mock('@/components/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/ui')>();
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

const mockCategoryWithJudge: Category = {
  id: 'cat-1',
  divisionId: 'div-1',
  name: 'Best Video',
  type: 'video',
  rules: null,
  description: 'Best video category',
  deadline: new Date('2026-12-31').toISOString(),
  status: 'published',
  createdAt: new Date().toISOString(),
  assignedJudgeId: 'judge-1',
  invitedAt: null,
  assignedJudge: {
    id: 'judge-1',
    email: 'judge@example.com',
    firstName: 'John',
    lastName: 'Doe',
  },
};

const mockCategoryWithoutJudge: Category = {
  id: 'cat-2',
  divisionId: 'div-1',
  name: 'Best Photo',
  type: 'photo',
  rules: null,
  description: 'Best photo category',
  deadline: new Date('2026-12-31').toISOString(),
  status: 'published',
  createdAt: new Date().toISOString(),
  assignedJudgeId: null,
  invitedAt: null,
  assignedJudge: null,
};

describe('JudgesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    vi.mocked(categoriesApi.categoriesApi.listByContest).mockImplementation(
      () => new Promise(() => {}) // Never resolves = loading state
    );

    const { container } = renderWithProviders(<JudgesTab contestId="contest-123" />);

    // Should show skeleton loading state (animated pulse elements)
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state when no categories exist', async () => {
    vi.mocked(categoriesApi.categoriesApi.listByContest).mockResolvedValue([]);

    renderWithProviders(<JudgesTab contestId="contest-123" />);

    await waitFor(() => {
      expect(screen.getByText(/no categories in this contest yet/i)).toBeInTheDocument();
    });
  });

  it('displays categories with assigned judges (AC1)', async () => {
    vi.mocked(categoriesApi.categoriesApi.listByContest).mockResolvedValue([
      mockCategoryWithJudge,
    ]);

    renderWithProviders(<JudgesTab contestId="contest-123" />);

    await waitFor(() => {
      // Category name
      expect(screen.getByText('Best Video')).toBeInTheDocument();
      // Judge email
      expect(screen.getByText('judge@example.com')).toBeInTheDocument();
    });
  });

  it('displays categories without judges and shows Assign button (AC4)', async () => {
    vi.mocked(categoriesApi.categoriesApi.listByContest).mockResolvedValue([
      mockCategoryWithoutJudge,
    ]);

    renderWithProviders(<JudgesTab contestId="contest-123" />);

    await waitFor(() => {
      // Category name
      expect(screen.getByText('Best Photo')).toBeInTheDocument();
      // "No judge assigned" text
      expect(screen.getByText(/no judge assigned/i)).toBeInTheDocument();
      // Assign button
      expect(screen.getByRole('button', { name: /assign judge/i })).toBeInTheDocument();
    });
  });

  it('displays mixed categories with and without judges', async () => {
    vi.mocked(categoriesApi.categoriesApi.listByContest).mockResolvedValue([
      mockCategoryWithJudge,
      mockCategoryWithoutJudge,
    ]);

    renderWithProviders(<JudgesTab contestId="contest-123" />);

    await waitFor(() => {
      // Both categories
      expect(screen.getByText('Best Video')).toBeInTheDocument();
      expect(screen.getByText('Best Photo')).toBeInTheDocument();
      // Judge email
      expect(screen.getByText('judge@example.com')).toBeInTheDocument();
      // Unassigned text
      expect(screen.getByText(/no judge assigned/i)).toBeInTheDocument();
    });
  });

  it('clicking judge email opens detail sheet (AC5)', async () => {
    const user = userEvent.setup();
    vi.mocked(categoriesApi.categoriesApi.listByContest).mockResolvedValue([
      mockCategoryWithJudge,
    ]);

    renderWithProviders(<JudgesTab contestId="contest-123" />);

    await waitFor(() => {
      expect(screen.getByText('judge@example.com')).toBeInTheDocument();
    });

    // Click on judge email
    await user.click(screen.getByText('judge@example.com'));

    // Detail sheet should open
    await waitFor(() => {
      expect(screen.getByText(/judge progress/i)).toBeInTheDocument();
      expect(screen.getByText(/judge@example.com reviewing Best Video/i)).toBeInTheDocument();
    });
  });

  it('renders error state on API failure', async () => {
    vi.mocked(categoriesApi.categoriesApi.listByContest).mockRejectedValue(
      new Error('API Error')
    );

    renderWithProviders(<JudgesTab contestId="contest-123" />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load judge data/i)).toBeInTheDocument();
    });
  });

  it('shows status badge for assigned judge', async () => {
    vi.mocked(categoriesApi.categoriesApi.listByContest).mockResolvedValue([
      mockCategoryWithJudge,
    ]);

    renderWithProviders(<JudgesTab contestId="contest-123" />);

    await waitFor(() => {
      expect(screen.getByText('Awaiting')).toBeInTheDocument();
    });
  });

  it('shows status badge for unassigned category', async () => {
    vi.mocked(categoriesApi.categoriesApi.listByContest).mockResolvedValue([
      mockCategoryWithoutJudge,
    ]);

    renderWithProviders(<JudgesTab contestId="contest-123" />);

    await waitFor(() => {
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });
  });
});
