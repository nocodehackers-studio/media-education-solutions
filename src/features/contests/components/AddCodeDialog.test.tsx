import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddCodeDialog } from './AddCodeDialog';
import { contestsApi } from '../api/contestsApi';
import { toast } from '@/components/ui';

// Mock the API
vi.mock('../api/contestsApi', () => ({
  contestsApi: {
    generateSingleCode: vi.fn(),
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

// Mock Radix UI pointer capture (needed for Sheet/Dialog)
beforeEach(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

describe('AddCodeDialog', () => {
  let queryClient: QueryClient;
  const user = userEvent.setup();

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
        <AddCodeDialog contestId={contestId} />
      </QueryClientProvider>
    );
  };

  it('renders Add Code button', () => {
    renderComponent();

    expect(screen.getByRole('button', { name: 'Add Code' })).toBeInTheDocument();
  });

  it('opens dialog when clicking Add Code button', async () => {
    renderComponent();

    await user.click(screen.getByRole('button', { name: 'Add Code' }));

    await waitFor(() => {
      expect(screen.getByText('Add Participant Code')).toBeInTheDocument();
    });
  });

  it('shows organization name input in dialog', async () => {
    renderComponent();

    await user.click(screen.getByRole('button', { name: 'Add Code' }));

    await waitFor(() => {
      expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
    });
  });

  it('validates organization name is required', async () => {
    renderComponent();

    await user.click(screen.getByRole('button', { name: 'Add Code' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Generate Code' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Generate Code' }));

    await waitFor(() => {
      expect(screen.getByText('Organization name is required')).toBeInTheDocument();
    });
  });

  it('calls API with organization name and shows success toast (AC4 Updated)', async () => {
    const mockParticipant = {
      id: 'p-123',
      contestId: 'contest-123',
      code: '12345678',
      status: 'unused' as const,
      name: null,
      organizationName: 'Springfield Elementary',
      tlcName: null,
      tlcEmail: null,
      createdAt: '2026-01-22T00:00:00Z',
    };

    vi.mocked(contestsApi.generateSingleCode).mockResolvedValue(mockParticipant);

    renderComponent('contest-123');

    await user.click(screen.getByRole('button', { name: 'Add Code' }));

    await waitFor(() => {
      expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
    });

    await user.type(
      screen.getByLabelText(/organization name/i),
      'Springfield Elementary'
    );

    await user.click(screen.getByRole('button', { name: 'Generate Code' }));

    await waitFor(() => {
      expect(contestsApi.generateSingleCode).toHaveBeenCalledWith(
        'contest-123',
        'Springfield Elementary'
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Code 12345678 generated for Springfield Elementary'
      );
    });
  });

  it('shows error toast when generation fails', async () => {
    vi.mocked(contestsApi.generateSingleCode).mockRejectedValue(
      new Error('Database error')
    );

    renderComponent();

    await user.click(screen.getByRole('button', { name: 'Add Code' }));

    await waitFor(() => {
      expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/organization name/i), 'Test School');

    await user.click(screen.getByRole('button', { name: 'Generate Code' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Database error');
    });
  });

  it('closes dialog after successful code generation', async () => {
    const mockParticipant = {
      id: 'p-123',
      contestId: 'contest-123',
      code: '12345678',
      status: 'unused' as const,
      name: null,
      organizationName: 'Test School',
      tlcName: null,
      tlcEmail: null,
      createdAt: '2026-01-22T00:00:00Z',
    };

    vi.mocked(contestsApi.generateSingleCode).mockResolvedValue(mockParticipant);

    renderComponent();

    await user.click(screen.getByRole('button', { name: 'Add Code' }));

    await waitFor(() => {
      expect(screen.getByText('Add Participant Code')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/organization name/i), 'Test School');

    await user.click(screen.getByRole('button', { name: 'Generate Code' }));

    await waitFor(() => {
      expect(screen.queryByText('Add Participant Code')).not.toBeInTheDocument();
    });
  });

  it('shows loading state during generation', async () => {
    vi.mocked(contestsApi.generateSingleCode).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderComponent();

    await user.click(screen.getByRole('button', { name: 'Add Code' }));

    await waitFor(() => {
      expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/organization name/i), 'Test School');

    await user.click(screen.getByRole('button', { name: 'Generate Code' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Generating...' })).toBeDisabled();
    });
  });

  it('renders with different variants', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AddCodeDialog contestId="test" variant="default" />
      </QueryClientProvider>
    );

    expect(screen.getByRole('button', { name: 'Add Code' })).toBeInTheDocument();
  });
});
