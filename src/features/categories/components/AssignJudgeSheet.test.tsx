import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { AssignJudgeSheet } from './AssignJudgeSheet';
import * as categoriesApi from '../api/categoriesApi';

// Mock the API
vi.mock('../api/categoriesApi', () => ({
  categoriesApi: {
    assignJudge: vi.fn(),
    getJudgeByEmail: vi.fn(),
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

describe('AssignJudgeSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Assign Judge button (AC1)', () => {
    renderWithProviders(
      <AssignJudgeSheet
        categoryId="cat-1"
        categoryName="Best Video"
              />
    );

    expect(screen.getByRole('button', { name: /assign judge/i })).toBeInTheDocument();
  });

  it('opens sheet with email input when button clicked (AC1)', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AssignJudgeSheet
        categoryId="cat-1"
        categoryName="Best Video"
              />
    );

    await user.click(screen.getByRole('button', { name: /assign judge/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/judge email/i)).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  it('displays category name in sheet description', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AssignJudgeSheet
        categoryId="cat-1"
        categoryName="Best Video"
              />
    );

    await user.click(screen.getByRole('button', { name: /assign judge/i }));

    await waitFor(() => {
      expect(screen.getByText(/"Best Video"/)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AssignJudgeSheet
        categoryId="cat-1"
        categoryName="Best Video"
              />
    );

    await user.click(screen.getByRole('button', { name: /assign judge/i }));

    const emailInput = screen.getByLabelText(/judge email/i);
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // Trigger blur validation

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for empty email', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <AssignJudgeSheet
        categoryId="cat-1"
        categoryName="Best Video"
              />
    );

    await user.click(screen.getByRole('button', { name: /assign judge/i }));

    const emailInput = screen.getByLabelText(/judge email/i);
    await user.click(emailInput);
    await user.tab(); // Trigger blur validation

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it('submits form and closes sheet on success for new judge (AC2)', async () => {
    const user = userEvent.setup();
    vi.mocked(categoriesApi.categoriesApi.assignJudge).mockResolvedValue({
      isNewJudge: true,
    });

    const { toast } = await import('@/components/ui');

    renderWithProviders(
      <AssignJudgeSheet
        categoryId="cat-1"
        categoryName="Best Video"
              />
    );

    await user.click(screen.getByRole('button', { name: /assign judge/i }));

    const emailInput = screen.getByLabelText(/judge email/i);
    await user.type(emailInput, 'newjudge@example.com');

    const submitButton = screen.getByRole('button', { name: /^assign$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(categoriesApi.categoriesApi.assignJudge).toHaveBeenCalledWith(
        'cat-1',
        'newjudge@example.com'
      );
      expect(toast.success).toHaveBeenCalledWith(
        'Judge assigned - invite will be sent when category closes'
      );
    });
  });

  it('submits form and shows different message for existing judge (AC3)', async () => {
    const user = userEvent.setup();
    vi.mocked(categoriesApi.categoriesApi.assignJudge).mockResolvedValue({
      isNewJudge: false,
    });

    const { toast } = await import('@/components/ui');

    renderWithProviders(
      <AssignJudgeSheet
        categoryId="cat-1"
        categoryName="Best Video"
              />
    );

    await user.click(screen.getByRole('button', { name: /assign judge/i }));

    const emailInput = screen.getByLabelText(/judge email/i);
    await user.type(emailInput, 'existingjudge@example.com');

    const submitButton = screen.getByRole('button', { name: /^assign$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Judge assigned');
    });
  });

  it('shows mapped error toast for ROLE_CONFLICT', async () => {
    const user = userEvent.setup();
    vi.mocked(categoriesApi.categoriesApi.assignJudge).mockRejectedValue(
      new Error('ROLE_CONFLICT')
    );

    const { toast } = await import('@/components/ui');

    renderWithProviders(
      <AssignJudgeSheet
        categoryId="cat-1"
        categoryName="Best Video"
              />
    );

    await user.click(screen.getByRole('button', { name: /assign judge/i }));

    const emailInput = screen.getByLabelText(/judge email/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /^assign$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'This email is already registered with a different account type.'
      );
    });
  });

  it('shows mapped error toast for FORBIDDEN', async () => {
    const user = userEvent.setup();
    vi.mocked(categoriesApi.categoriesApi.assignJudge).mockRejectedValue(
      new Error('FORBIDDEN')
    );

    const { toast } = await import('@/components/ui');

    renderWithProviders(
      <AssignJudgeSheet
        categoryId="cat-1"
        categoryName="Best Video"
              />
    );

    await user.click(screen.getByRole('button', { name: /assign judge/i }));

    const emailInput = screen.getByLabelText(/judge email/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /^assign$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "You don't have permission to assign judges."
      );
    });
  });

  it('shows generic fallback toast for unknown error codes', async () => {
    const user = userEvent.setup();
    vi.mocked(categoriesApi.categoriesApi.assignJudge).mockRejectedValue(
      new Error('SOME_UNKNOWN_CODE')
    );

    const { toast } = await import('@/components/ui');

    renderWithProviders(
      <AssignJudgeSheet
        categoryId="cat-1"
        categoryName="Best Video"
              />
    );

    await user.click(screen.getByRole('button', { name: /assign judge/i }));

    const emailInput = screen.getByLabelText(/judge email/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /^assign$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Something went wrong while assigning the judge. Please try again.'
      );
    });
  });

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup();
    // Make the API call hang
    vi.mocked(categoriesApi.categoriesApi.assignJudge).mockImplementation(
      () => new Promise(() => {})
    );

    renderWithProviders(
      <AssignJudgeSheet
        categoryId="cat-1"
        categoryName="Best Video"
              />
    );

    await user.click(screen.getByRole('button', { name: /assign judge/i }));

    const emailInput = screen.getByLabelText(/judge email/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /^assign$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /assigning/i })).toBeDisabled();
    });
  });
});
