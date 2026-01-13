import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GenerateCodesButton } from './GenerateCodesButton';
import { contestsApi } from '../api/contestsApi';
import { toast } from '@/components/ui';

// Mock the API
vi.mock('../api/contestsApi', () => ({
  contestsApi: {
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

describe('GenerateCodesButton', () => {
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

  const renderComponent = (contestId: string = 'contest-123') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <GenerateCodesButton contestId={contestId} />
      </QueryClientProvider>
    );
  };

  it('renders button with correct text', () => {
    renderComponent();

    expect(
      screen.getByRole('button', { name: 'Generate 50 More' })
    ).toBeInTheDocument();
  });

  it('shows loading state when generating', async () => {
    vi.mocked(contestsApi.generateParticipantCodes).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderComponent();

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Generating...' })).toBeDisabled();
    });
  });

  it('shows success toast after generating codes (AC4)', async () => {
    vi.mocked(contestsApi.generateParticipantCodes).mockResolvedValue([]);

    renderComponent();

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('50 codes generated');
    });
  });

  it('shows error toast when generation fails', async () => {
    vi.mocked(contestsApi.generateParticipantCodes).mockRejectedValue(
      new Error('Network error')
    );

    renderComponent();

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to generate codes');
    });
  });

  it('calls API with contestId and count of 50', async () => {
    vi.mocked(contestsApi.generateParticipantCodes).mockResolvedValue([]);

    renderComponent('my-contest-id');

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(contestsApi.generateParticipantCodes).toHaveBeenCalledWith(
        'my-contest-id',
        50
      );
    });
  });

  it('renders with default variant (outline)', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <GenerateCodesButton contestId="test" />
      </QueryClientProvider>
    );

    // Default is outline variant, should have the button
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders with specified variant', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <GenerateCodesButton contestId="test" variant="default" />
      </QueryClientProvider>
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
