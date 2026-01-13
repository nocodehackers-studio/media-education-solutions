import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CategoriesTab } from './CategoriesTab';
import * as categoriesApi from '../api/categoriesApi';
import type { Contest } from '@/features/contests';

// Mock the API
vi.mock('../api/categoriesApi', () => ({
  categoriesApi: {
    listByContest: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
    getSubmissionCount: vi.fn(),
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

function renderWithProviders(ui: React.ReactElement) {
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
  status: 'draft',
  winnersPagePassword: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('CategoriesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    vi.mocked(categoriesApi.categoriesApi.listByContest).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders(<CategoriesTab contest={mockContest} />);

    expect(screen.getByText(/categories/i)).toBeInTheDocument();
  });

  it('renders empty state when no categories', async () => {
    vi.mocked(categoriesApi.categoriesApi.listByContest).mockResolvedValue([]);

    renderWithProviders(<CategoriesTab contest={mockContest} />);

    await waitFor(() => {
      expect(screen.getByText(/no categories yet/i)).toBeInTheDocument();
    });
  });

  it('renders categories list', async () => {
    vi.mocked(categoriesApi.categoriesApi.listByContest).mockResolvedValue([
      {
        id: 'cat-1',
        contestId: 'contest-123',
        name: 'Best Video',
        type: 'video',
        rules: null,
        description: 'Best video category',
        deadline: new Date('2026-12-31').toISOString(),
        status: 'draft',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'cat-2',
        contestId: 'contest-123',
        name: 'Best Photo',
        type: 'photo',
        rules: null,
        description: 'Best photo category',
        deadline: new Date('2026-12-31').toISOString(),
        status: 'published',
        createdAt: new Date().toISOString(),
      },
    ]);

    renderWithProviders(<CategoriesTab contest={mockContest} />);

    await waitFor(() => {
      expect(screen.getByText('Best Video')).toBeInTheDocument();
      expect(screen.getByText('Best Photo')).toBeInTheDocument();
    });
  });

  it('shows Add Category button for draft contest', async () => {
    vi.mocked(categoriesApi.categoriesApi.listByContest).mockResolvedValue([]);

    renderWithProviders(<CategoriesTab contest={{ ...mockContest, status: 'draft' }} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add category/i })).toBeInTheDocument();
    });
  });

  it('shows Add Category button for published contest', async () => {
    vi.mocked(categoriesApi.categoriesApi.listByContest).mockResolvedValue([]);

    renderWithProviders(<CategoriesTab contest={{ ...mockContest, status: 'published' }} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add category/i })).toBeInTheDocument();
    });
  });

  it('hides Add Category button and shows message for closed contest (AC1)', async () => {
    vi.mocked(categoriesApi.categoriesApi.listByContest).mockResolvedValue([]);

    renderWithProviders(<CategoriesTab contest={{ ...mockContest, status: 'closed' }} />);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /add category/i })).not.toBeInTheDocument();
      expect(screen.getByText(/cannot add categories to a closed contest/i)).toBeInTheDocument();
    });
  });

  it('hides Add Category button for reviewed contest', async () => {
    vi.mocked(categoriesApi.categoriesApi.listByContest).mockResolvedValue([]);

    renderWithProviders(<CategoriesTab contest={{ ...mockContest, status: 'reviewed' }} />);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /add category/i })).not.toBeInTheDocument();
    });
  });

  it('opens create form sheet when Add Category clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(categoriesApi.categoriesApi.listByContest).mockResolvedValue([]);

    renderWithProviders(<CategoriesTab contest={mockContest} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add category/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /add category/i }));

    await waitFor(() => {
      // Use more specific matcher - the sheet title
      expect(screen.getByRole('heading', { name: /create category/i })).toBeInTheDocument();
    });
  });

  it('renders error state on API failure', async () => {
    vi.mocked(categoriesApi.categoriesApi.listByContest).mockRejectedValue(
      new Error('API Error')
    );

    renderWithProviders(<CategoriesTab contest={mockContest} />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load categories/i)).toBeInTheDocument();
    });
  });
});
