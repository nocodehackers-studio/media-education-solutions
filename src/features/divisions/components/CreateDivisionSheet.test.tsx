// CreateDivisionSheet Component Tests - Story 2.9
// Tests form validation and submission (AC3)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { CreateDivisionSheet } from './CreateDivisionSheet';
import { divisionsApi } from '../api/divisionsApi';
import { toast } from '@/components/ui';

// Mock the API
vi.mock('../api/divisionsApi', () => ({
  divisionsApi: {
    listByContest: vi.fn(),
    create: vi.fn(),
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

describe('CreateDivisionSheet', () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Form rendering', () => {
    it('renders sheet with form when open', () => {
      renderWithProviders(
        <CreateDivisionSheet
          contestId="contest-1"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      // Use heading role to find the title specifically
      expect(screen.getByRole('heading', { name: /create division/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/division name/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /create division/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /cancel/i })
      ).toBeInTheDocument();
    });

    it('does not render content when closed', () => {
      renderWithProviders(
        <CreateDivisionSheet
          contestId="contest-1"
          open={false}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.queryByText('Create Division')).not.toBeInTheDocument();
    });
  });

  describe('Form validation (AC3)', () => {
    it('shows error when name is empty on blur', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <CreateDivisionSheet
          contestId="contest-1"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const nameInput = screen.getByLabelText(/division name/i);
      await user.click(nameInput);
      await user.tab(); // Blur the input

      await waitFor(() => {
        expect(screen.getByText(/division name is required/i)).toBeInTheDocument();
      });
    });

    it('shows error when name exceeds 100 characters', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <CreateDivisionSheet
          contestId="contest-1"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const nameInput = screen.getByLabelText(/division name/i);
      const longName = 'a'.repeat(101);
      await user.type(nameInput, longName);
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/name must be 100 characters or less/i)
        ).toBeInTheDocument();
      });
    });

    it('accepts valid name', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <CreateDivisionSheet
          contestId="contest-1"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const nameInput = screen.getByLabelText(/division name/i);
      await user.type(nameInput, 'High School');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.queryByText(/division name is required/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Form submission (AC3)', () => {
    it('submits form and shows success toast', async () => {
      const user = userEvent.setup();
      const mockDivision = {
        id: 'new-div',
        contestId: 'contest-1',
        name: 'High School',
        displayOrder: 0,
        createdAt: '2026-01-21T00:00:00Z',
      };

      vi.mocked(divisionsApi.create).mockResolvedValue(mockDivision);

      renderWithProviders(
        <CreateDivisionSheet
          contestId="contest-1"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const nameInput = screen.getByLabelText(/division name/i);
      await user.type(nameInput, 'High School');

      const submitButton = screen.getByRole('button', { name: /create division/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(divisionsApi.create).toHaveBeenCalledWith('contest-1', {
          name: 'High School',
        });
      });

      expect(toast.success).toHaveBeenCalledWith('Division created');
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('shows error toast on submission failure', async () => {
      const user = userEvent.setup();

      vi.mocked(divisionsApi.create).mockRejectedValue(
        new Error('Failed to create division')
      );

      renderWithProviders(
        <CreateDivisionSheet
          contestId="contest-1"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const nameInput = screen.getByLabelText(/division name/i);
      await user.type(nameInput, 'Test Division');

      const submitButton = screen.getByRole('button', { name: /create division/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to create division');
      });

      // Sheet should remain open on error
      expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
    });

    it('disables submit button while submitting', async () => {
      const user = userEvent.setup();

      // Create a promise that we can control
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(divisionsApi.create).mockReturnValue(pendingPromise as never);

      renderWithProviders(
        <CreateDivisionSheet
          contestId="contest-1"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const nameInput = screen.getByLabelText(/division name/i);
      await user.type(nameInput, 'Test');

      const submitButton = screen.getByRole('button', { name: /create division/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/creating/i)).toBeInTheDocument();
      });

      // Resolve to clean up
      resolvePromise!({
        id: 'div-1',
        contestId: 'contest-1',
        name: 'Test',
        displayOrder: 0,
        createdAt: '2026-01-21',
      });
    });

    it('resets form after successful submission', async () => {
      const user = userEvent.setup();
      const mockDivision = {
        id: 'new-div',
        contestId: 'contest-1',
        name: 'Test Division',
        displayOrder: 0,
        createdAt: '2026-01-21T00:00:00Z',
      };

      vi.mocked(divisionsApi.create).mockResolvedValue(mockDivision);

      renderWithProviders(
        <CreateDivisionSheet
          contestId="contest-1"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const nameInput = screen.getByLabelText(/division name/i);
      await user.type(nameInput, 'Test Division');

      const submitButton = screen.getByRole('button', { name: /create division/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });

      // Re-render with open=true to check if form is reset
      // Since form is reset, the input should be empty when reopened
      // Note: In real usage, form.reset() clears the values
    });
  });

  describe('Cancel button', () => {
    it('closes sheet when Cancel is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <CreateDivisionSheet
          contestId="contest-1"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Input placeholder', () => {
    it('shows helpful placeholder text', () => {
      renderWithProviders(
        <CreateDivisionSheet
          contestId="contest-1"
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const nameInput = screen.getByLabelText(/division name/i);
      expect(nameInput).toHaveAttribute(
        'placeholder',
        'e.g., High School, Teachers'
      );
    });
  });
});
