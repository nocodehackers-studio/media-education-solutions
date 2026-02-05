import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EditContestForm } from './EditContestForm';
import * as contestsApi from '../api/contestsApi';
import { toast } from '@/components/ui';
import type { Contest } from '../types/contest.types';

// Mock the API
vi.mock('../api/contestsApi', () => ({
  contestsApi: {
    update: vi.fn(),
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

const mockContest: Contest = {
  id: 'contest-123',
  name: 'Test Contest',
  description: 'Test Description',
  slug: 'test-contest',
  contestCode: 'ABC123',
  rules: 'Test Rules',
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
};

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

describe('EditContestForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with existing contest values', () => {
    renderWithProviders(<EditContestForm contest={mockContest} />);

    expect(screen.getByLabelText(/contest name/i)).toHaveValue('Test Contest');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Test Description');
    expect(screen.getByLabelText(/general rules/i)).toHaveValue('Test Rules');
  });

  it('shows validation error for empty name', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditContestForm contest={mockContest} />);

    const nameInput = screen.getByLabelText(/contest name/i);
    await user.clear(nameInput);

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/contest name is required/i)).toBeInTheDocument();
    });
  });

  it('submits form with updated data', async () => {
    const user = userEvent.setup();
    const mockUpdate = vi.mocked(contestsApi.contestsApi.update);
    mockUpdate.mockResolvedValue({
      ...mockContest,
      name: 'Updated Contest',
      description: 'Updated Description',
    });

    const onSuccess = vi.fn();
    renderWithProviders(
      <EditContestForm contest={mockContest} onSuccess={onSuccess} />
    );

    const nameInput = screen.getByLabelText(/contest name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Contest');

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'Updated Description');

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        'contest-123',
        expect.objectContaining({
          name: 'Updated Contest',
          description: 'Updated Description',
        })
      );
      expect(onSuccess).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Contest updated');
    });
  });

  it('handles submission error', async () => {
    const user = userEvent.setup();
    const mockUpdate = vi.mocked(contestsApi.contestsApi.update);
    mockUpdate.mockRejectedValue(new Error('Update failed'));

    renderWithProviders(<EditContestForm contest={mockContest} />);

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Update failed');
    });
  });

  it('calls onCancel when cancel button clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderWithProviders(
      <EditContestForm contest={mockContest} onCancel={onCancel} />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('does not show cancel button when onCancel not provided', () => {
    renderWithProviders(<EditContestForm contest={mockContest} />);

    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  // Note: notifyTlc toggle tests removed - UI control not implemented in component
  // The field exists in the schema but is not exposed in the edit form UI

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup();
    const mockUpdate = vi.mocked(contestsApi.contestsApi.update);
    mockUpdate.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    renderWithProviders(<EditContestForm contest={mockContest} />);

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });
});
