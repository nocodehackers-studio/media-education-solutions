import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { CreateContestForm } from './CreateContestForm';
import * as contestsApi from '../api/contestsApi';
import { toast } from '@/components/ui';

// Mock the API
vi.mock('../api/contestsApi', () => ({
  contestsApi: {
    create: vi.fn(),
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

describe('CreateContestForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('renders all form fields', () => {
    renderWithProviders(<CreateContestForm />);

    expect(screen.getByLabelText(/contest name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contest code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/general rules/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create contest/i })).toBeInTheDocument();
  });

  it('shows validation error for empty name', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateContestForm />);

    const submitButton = screen.getByRole('button', { name: /create contest/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/contest name is required/i)).toBeInTheDocument();
    });
  });

  it('validates contest code length', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateContestForm />);

    const codeInput = screen.getByLabelText(/contest code/i);
    await user.type(codeInput, 'ABC');

    const submitButton = screen.getByRole('button', { name: /create contest/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/must be 6 characters/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockCreate = vi.mocked(contestsApi.contestsApi.create);
    mockCreate.mockResolvedValue({
      id: '123',
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
    });

    const onSuccess = vi.fn();
    renderWithProviders(<CreateContestForm onSuccess={onSuccess} />);

    const nameInput = screen.getByLabelText(/contest name/i);
    await user.type(nameInput, 'Test Contest');

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'Test Description');

    const submitButton = screen.getByRole('button', { name: /create contest/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Contest',
          description: 'Test Description',
          contestCode: '',
          rules: '',
        })
      );
      expect(onSuccess).toHaveBeenCalled();
      // AC3: Verify success toast shown
      expect(toast.success).toHaveBeenCalledWith('Contest created');
      // AC3: Verify navigation to contest detail page
      expect(mockNavigate).toHaveBeenCalledWith('/admin/contests/123');
    });
  });

  it('handles submission error', async () => {
    const user = userEvent.setup();
    const mockCreate = vi.mocked(contestsApi.contestsApi.create);
    mockCreate.mockRejectedValue(new Error('Contest code already exists'));

    renderWithProviders(<CreateContestForm />);

    const nameInput = screen.getByLabelText(/contest name/i);
    await user.type(nameInput, 'Test Contest');

    const submitButton = screen.getByRole('button', { name: /create contest/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
      // AC4: Verify error toast shown with error message
      expect(toast.error).toHaveBeenCalledWith('Contest code already exists');
      // Should NOT navigate on error
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup();
    const mockCreate = vi.mocked(contestsApi.contestsApi.create);
    mockCreate.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    renderWithProviders(<CreateContestForm />);

    const nameInput = screen.getByLabelText(/contest name/i);
    await user.type(nameInput, 'Test Contest');

    const submitButton = screen.getByRole('button', { name: /create contest/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('allows optional fields to be empty', async () => {
    const user = userEvent.setup();
    const mockCreate = vi.mocked(contestsApi.contestsApi.create);
    mockCreate.mockResolvedValue({
      id: '123',
      name: 'Minimal Contest',
      description: null,
      slug: 'minimal-contest',
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
    });

    renderWithProviders(<CreateContestForm />);

    const nameInput = screen.getByLabelText(/contest name/i);
    await user.type(nameInput, 'Minimal Contest');

    const submitButton = screen.getByRole('button', { name: /create contest/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Minimal Contest',
          description: '',
          contestCode: '',
          rules: '',
        })
      );
    });
  });
});
