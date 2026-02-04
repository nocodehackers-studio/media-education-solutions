// CategoriesTab tests - Story 2-9 update
// Tests are updated for division-based category organization
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { CategoriesTab } from './CategoriesTab';
import * as categoriesApi from '../api/categoriesApi';
import * as divisionsHooks from '@/features/divisions/hooks';
import type { Contest } from '@/features/contests';

// Mock the categories API
vi.mock('../api/categoriesApi', () => ({
  categoriesApi: {
    listByContest: vi.fn(),
    listByDivision: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
    getSubmissionCount: vi.fn(),
  },
}));

// Mock the divisions hooks
vi.mock('@/features/divisions/hooks', () => ({
  useDivisions: vi.fn(),
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

const mockContest: Contest = {
  id: 'contest-123',
  name: 'Test Contest',
  description: 'Test Description',
  slug: 'test-contest',
  contestCode: 'ABC123',
  rules: null,
  coverImageUrl: null,
  logoUrl: null,
  status: 'draft',
  winnersPagePassword: null,
  winnersPageEnabled: false,
  winnersPageGeneratedAt: null,
  notifyTlc: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockDivision = {
  id: 'div-1',
  contestId: 'contest-123',
  name: 'General',
  displayOrder: 0,
  createdAt: new Date().toISOString(),
};

describe('CategoriesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getSubmissionCount to return 0 by default
    vi.mocked(categoriesApi.categoriesApi.getSubmissionCount).mockResolvedValue(0);
    // Default: return empty divisions list loading
    vi.mocked(divisionsHooks.useDivisions).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof divisionsHooks.useDivisions>);
  });

  it('renders loading state', () => {
    renderWithProviders(<CategoriesTab contest={mockContest} />);

    expect(screen.getByText(/categories/i)).toBeInTheDocument();
  });

  it('renders empty state when no divisions exist', async () => {
    vi.mocked(divisionsHooks.useDivisions).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof divisionsHooks.useDivisions>);

    renderWithProviders(<CategoriesTab contest={mockContest} />);

    await waitFor(() => {
      expect(screen.getByText(/no divisions found/i)).toBeInTheDocument();
    });
  });

  it('renders divisions with categories organized', async () => {
    vi.mocked(divisionsHooks.useDivisions).mockReturnValue({
      data: [mockDivision],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof divisionsHooks.useDivisions>);

    vi.mocked(categoriesApi.categoriesApi.listByDivision).mockResolvedValue([
      {
        id: 'cat-1',
        divisionId: 'div-1',
        name: 'Best Video',
        type: 'video',
        rules: null,
        description: 'Best video category',
        deadline: new Date('2026-12-31').toISOString(),
        status: 'draft',
        createdAt: new Date().toISOString(),
        assignedJudgeId: null,
        invitedAt: null,
        judgingCompletedAt: null,
        assignedJudge: null,
      },
    ]);

    renderWithProviders(<CategoriesTab contest={mockContest} />);

    await waitFor(() => {
      expect(screen.getByText('General')).toBeInTheDocument();
    });
  });

  it('shows Add button for draft contest', async () => {
    vi.mocked(divisionsHooks.useDivisions).mockReturnValue({
      data: [mockDivision],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof divisionsHooks.useDivisions>);

    renderWithProviders(<CategoriesTab contest={{ ...mockContest, status: 'draft' }} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    });
  });

  it('shows Add button for published contest', async () => {
    vi.mocked(divisionsHooks.useDivisions).mockReturnValue({
      data: [mockDivision],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof divisionsHooks.useDivisions>);

    renderWithProviders(<CategoriesTab contest={{ ...mockContest, status: 'published' }} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    });
  });

  it('hides Add button and shows message for closed contest (AC1)', async () => {
    vi.mocked(divisionsHooks.useDivisions).mockReturnValue({
      data: [mockDivision],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof divisionsHooks.useDivisions>);

    renderWithProviders(<CategoriesTab contest={{ ...mockContest, status: 'closed' }} />);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument();
      expect(screen.getByText(/cannot add categories to a closed contest/i)).toBeInTheDocument();
    });
  });

  it('renders error state on divisions load failure', async () => {
    vi.mocked(divisionsHooks.useDivisions).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('API Error'),
    } as unknown as ReturnType<typeof divisionsHooks.useDivisions>);

    renderWithProviders(<CategoriesTab contest={mockContest} />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load divisions/i)).toBeInTheDocument();
    });
  });

  it('opens create form sheet when Add clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(divisionsHooks.useDivisions).mockReturnValue({
      data: [mockDivision],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof divisionsHooks.useDivisions>);

    renderWithProviders(<CategoriesTab contest={mockContest} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(screen.getByText(/create category in general/i)).toBeInTheDocument();
    });
  });
});
