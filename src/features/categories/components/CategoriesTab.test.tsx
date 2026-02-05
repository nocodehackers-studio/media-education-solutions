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
  deletedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  timezone: 'America/New_York',
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

    // Loading state shows skeletons
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
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

  it('shows Add Division and Add category buttons for draft contest', async () => {
    vi.mocked(divisionsHooks.useDivisions).mockReturnValue({
      data: [mockDivision],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof divisionsHooks.useDivisions>);

    renderWithProviders(<CategoriesTab contest={{ ...mockContest, status: 'draft' }} />);

    await waitFor(() => {
      // Should have Add Division button at the top level
      expect(screen.getByRole('button', { name: /add division/i })).toBeInTheDocument();
      // Should have Add button for category in the division section
      // (there are two Add buttons total)
      const addButtons = screen.getAllByRole('button', { name: /^add$/i });
      expect(addButtons.length).toBeGreaterThan(0);
    });
  });

  it('shows Add buttons for published contest', async () => {
    vi.mocked(divisionsHooks.useDivisions).mockReturnValue({
      data: [mockDivision],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof divisionsHooks.useDivisions>);

    renderWithProviders(<CategoriesTab contest={{ ...mockContest, status: 'published' }} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add division/i })).toBeInTheDocument();
    });
  });

  it('hides Add category button and shows message for closed contest (AC1)', async () => {
    vi.mocked(divisionsHooks.useDivisions).mockReturnValue({
      data: [mockDivision],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof divisionsHooks.useDivisions>);

    renderWithProviders(<CategoriesTab contest={{ ...mockContest, status: 'closed' }} />);

    await waitFor(() => {
      // Add Division button should still be present
      expect(screen.getByRole('button', { name: /add division/i })).toBeInTheDocument();
      // But Add (category) buttons should NOT be present
      expect(screen.queryByRole('button', { name: /^add$/i })).not.toBeInTheDocument();
      // Shows the closed contest message
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

  it('opens create category form sheet when Add clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(divisionsHooks.useDivisions).mockReturnValue({
      data: [mockDivision],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof divisionsHooks.useDivisions>);

    renderWithProviders(<CategoriesTab contest={mockContest} />);

    await waitFor(() => {
      // Wait for the Add button in the division section (not Add Division)
      const addButtons = screen.getAllByRole('button', { name: /^add$/i });
      expect(addButtons.length).toBeGreaterThan(0);
    });

    // Click the first Add button (for adding category to division)
    const addButtons = screen.getAllByRole('button', { name: /^add$/i });
    await user.click(addButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/create category in general/i)).toBeInTheDocument();
    });
  });
});
