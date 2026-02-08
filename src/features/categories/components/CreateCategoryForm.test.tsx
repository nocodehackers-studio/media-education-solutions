import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { CreateCategoryForm } from './CreateCategoryForm';

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

describe('CreateCategoryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields', () => {
    renderWithProviders(<CreateCategoryForm divisionId="div-1" contestId="contest-123" contestTimezone="America/New_York" />);

    expect(screen.getByLabelText(/category name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/submission type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/submission deadline/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category rules/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create category/i })).toBeInTheDocument();
  });

  it('shows validation error for empty name', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateCategoryForm divisionId="div-1" contestId="contest-123" contestTimezone="America/New_York" />);

    const submitButton = screen.getByRole('button', { name: /create category/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/category name is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for missing deadline', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateCategoryForm divisionId="div-1" contestId="contest-123" contestTimezone="America/New_York" />);

    const nameInput = screen.getByLabelText(/category name/i);
    await user.type(nameInput, 'Test Category');

    const submitButton = screen.getByRole('button', { name: /create category/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/deadline is required/i)).toBeInTheDocument();
    });
  });

  // Note: Form submission tests with date picker are skipped due to Radix UI Popover/Calendar
  // compatibility issues with jsdom. These should be covered by integration tests (Playwright).
  // The core form validation logic is tested through the validation error tests above.

  it('renders type dropdown', () => {
    renderWithProviders(<CreateCategoryForm divisionId="div-1" contestId="contest-123" contestTimezone="America/New_York" />);

    // Verify type dropdown is present (there are multiple comboboxes due to TimePicker)
    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes.length).toBeGreaterThan(0);
  });

  it('renders date picker button', () => {
    renderWithProviders(<CreateCategoryForm divisionId="div-1" contestId="contest-123" contestTimezone="America/New_York" />);

    // The date picker shows "Pick a date" or a selected date
    expect(screen.getByLabelText(/submission deadline/i)).toBeInTheDocument();
  });

  // Note: Past-deadline validation (isAtLeastOneMinuteFromNow) is tested in
  // src/lib/dateUtils.test.ts. Calendar interaction in jsdom is not supported.
});
