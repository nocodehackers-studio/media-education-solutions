import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { DeleteContestButton } from './DeleteContestButton';
import * as contestsApi from '../api/contestsApi';
import { toast } from '@/components/ui';

// Mock the API
vi.mock('../api/contestsApi', () => ({
  contestsApi: {
    delete: vi.fn(),
  },
}));

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </MemoryRouter>
  );
}

describe('DeleteContestButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('renders delete button', () => {
    renderWithProviders(<DeleteContestButton contestId="contest-123" />);

    expect(screen.getByTestId('delete-contest-button')).toBeInTheDocument();
    expect(screen.getByText('Delete Contest')).toBeInTheDocument();
  });

  it('opens confirmation dialog when clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DeleteContestButton contestId="contest-123" />);

    const deleteButton = screen.getByTestId('delete-contest-button');
    await user.click(deleteButton);

    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(
      screen.getByText(/This contest will be moved to Trash/i)
    ).toBeInTheDocument();
  });

  it('closes dialog when Cancel clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DeleteContestButton contestId="contest-123" />);

    // Open dialog
    const deleteButton = screen.getByTestId('delete-contest-button');
    await user.click(deleteButton);

    // Click Cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // Dialog should be closed
    await waitFor(() => {
      expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument();
    });
  });

  it('deletes contest and navigates when confirmed', async () => {
    const user = userEvent.setup();
    const mockDelete = vi.mocked(contestsApi.contestsApi.delete);
    mockDelete.mockResolvedValue(undefined);

    renderWithProviders(<DeleteContestButton contestId="contest-123" />);

    // Open dialog
    const deleteButton = screen.getByTestId('delete-contest-button');
    await user.click(deleteButton);

    // Confirm delete
    const confirmButton = screen.getByRole('button', { name: /^delete$/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('contest-123');
      expect(toast.success).toHaveBeenCalledWith('Contest moved to trash. It will be permanently deleted in 90 days.');
      expect(mockNavigate).toHaveBeenCalledWith('/admin/contests');
    });
  });

  it('shows error toast when delete fails', async () => {
    const user = userEvent.setup();
    const mockDelete = vi.mocked(contestsApi.contestsApi.delete);
    mockDelete.mockRejectedValue(new Error('Delete failed'));

    renderWithProviders(<DeleteContestButton contestId="contest-123" />);

    // Open dialog
    const deleteButton = screen.getByTestId('delete-contest-button');
    await user.click(deleteButton);

    // Confirm delete
    const confirmButton = screen.getByRole('button', { name: /^delete$/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Delete failed');
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
