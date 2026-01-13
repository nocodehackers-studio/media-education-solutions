import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CodesTab } from './CodesTab';
import { contestsApi } from '../api/contestsApi';
import type { Contest, Participant } from '../types/contest.types';

// Mock the API
vi.mock('../api/contestsApi', () => ({
  contestsApi: {
    listParticipantCodes: vi.fn(),
    generateParticipantCodes: vi.fn(),
  },
}));

// Mock toast
vi.mock('@/components/ui', async () => {
  const actual = await vi.importActual('@/components/ui');
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

const mockContest: Contest = {
  id: 'contest-123',
  name: 'Test Contest',
  description: 'A test contest',
  slug: 'test-contest',
  contestCode: 'ABC123',
  rules: null,
  coverImageUrl: null,
  status: 'draft',
  winnersPagePassword: null,
  createdAt: '2026-01-13T00:00:00Z',
  updatedAt: '2026-01-13T00:00:00Z',
};

const createMockParticipant = (
  code: string,
  status: 'unused' | 'used',
  name: string | null = null
): Participant => ({
  id: `id-${code}`,
  contestId: 'contest-123',
  code,
  status,
  name,
  organizationName: null,
  tlcName: null,
  tlcEmail: null,
  createdAt: '2026-01-13T00:00:00Z',
});

describe('CodesTab', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CodesTab contest={mockContest} />
      </QueryClientProvider>
    );
  };

  it('shows loading state with skeletons initially', () => {
    vi.mocked(contestsApi.listParticipantCodes).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderComponent();

    // Should show skeleton loading state (multiple skeleton elements)
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state with generate button when no codes', async () => {
    vi.mocked(contestsApi.listParticipantCodes).mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No codes yet')).toBeInTheDocument();
    });
    // Should show generate button in empty state with default variant
    expect(
      screen.getAllByRole('button', { name: 'Generate 50 More' })
    ).toHaveLength(2); // One in header, one in empty state
  });

  it('displays code list when codes exist (AC1)', async () => {
    const codes = [
      createMockParticipant('12345678', 'unused'),
      createMockParticipant('87654321', 'used', 'John'),
    ];
    vi.mocked(contestsApi.listParticipantCodes).mockResolvedValue(codes);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('12345678')).toBeInTheDocument();
    });
    expect(screen.getByText('87654321')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('displays counts correctly', async () => {
    const codes = [
      createMockParticipant('11111111', 'unused'),
      createMockParticipant('22222222', 'unused'),
      createMockParticipant('33333333', 'used', 'Alice'),
    ];
    vi.mocked(contestsApi.listParticipantCodes).mockResolvedValue(codes);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/3 total/)).toBeInTheDocument();
    });
    expect(screen.getByText(/1 used/)).toBeInTheDocument();
    expect(screen.getByText(/2 unused/)).toBeInTheDocument();
  });

  it('has status filter with All, Used, Unused options (AC3)', async () => {
    vi.mocked(contestsApi.listParticipantCodes).mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    // Open the select
    fireEvent.click(screen.getByRole('combobox'));

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'All' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Used' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Unused' })).toBeInTheDocument();
    });
  });

  it('changes filter and refetches codes (AC3)', async () => {
    vi.mocked(contestsApi.listParticipantCodes).mockResolvedValue([
      createMockParticipant('12345678', 'unused'),
    ]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('12345678')).toBeInTheDocument();
    });

    // Initial fetch was with 'all' filter
    expect(contestsApi.listParticipantCodes).toHaveBeenCalledWith(
      'contest-123',
      'all'
    );

    // Change filter to 'unused'
    fireEvent.click(screen.getByRole('combobox'));
    await waitFor(() => {
      fireEvent.click(screen.getByRole('option', { name: 'Unused' }));
    });

    // Should refetch with 'unused' filter
    await waitFor(() => {
      expect(contestsApi.listParticipantCodes).toHaveBeenCalledWith(
        'contest-123',
        'unused'
      );
    });
  });

  it('has Generate 50 More button in header', async () => {
    vi.mocked(contestsApi.listParticipantCodes).mockResolvedValue([
      createMockParticipant('12345678', 'unused'),
    ]);

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Generate 50 More' })
      ).toBeInTheDocument();
    });
  });

  it('has Export button in header', async () => {
    vi.mocked(contestsApi.listParticipantCodes).mockResolvedValue([
      createMockParticipant('12345678', 'unused'),
    ]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
    });
  });

  it('Export button is disabled when no codes', async () => {
    vi.mocked(contestsApi.listParticipantCodes).mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled();
    });
  });

  it('displays title "Participant Codes"', async () => {
    vi.mocked(contestsApi.listParticipantCodes).mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Participant Codes')).toBeInTheDocument();
    });
  });

  it('shows error state when fetch fails', async () => {
    vi.mocked(contestsApi.listParticipantCodes).mockRejectedValue(
      new Error('Network error')
    );

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load participant codes')
      ).toBeInTheDocument();
    });
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('error state does not show generate or export buttons', async () => {
    vi.mocked(contestsApi.listParticipantCodes).mockRejectedValue(
      new Error('Server error')
    );

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load participant codes')
      ).toBeInTheDocument();
    });
    // Should not show action buttons in error state
    expect(
      screen.queryByRole('button', { name: 'Generate 50 More' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Export' })
    ).not.toBeInTheDocument();
  });
});
