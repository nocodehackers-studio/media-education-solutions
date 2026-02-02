import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ContestDetailsTab } from './ContestDetailsTab';
import type { Contest } from '../types/contest.types';

// Mock the API
vi.mock('../api/contestsApi', () => ({
  contestsApi: {
    update: vi.fn(),
    updateStatus: vi.fn(),
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
  status: 'draft',
  winnersPagePassword: null,
  winnersPageEnabled: false,
  winnersPageGeneratedAt: null,
  notifyTlc: false,
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

describe('ContestDetailsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders contest details', () => {
    renderWithProviders(<ContestDetailsTab contest={mockContest} />);

    expect(screen.getByText('Contest Details')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Test Rules')).toBeInTheDocument();
    expect(screen.getByText('ABC123')).toBeInTheDocument();
  });

  it('shows placeholder text when description is null', () => {
    const contestNoDesc: Contest = { ...mockContest, description: null };
    renderWithProviders(<ContestDetailsTab contest={contestNoDesc} />);

    expect(screen.getByText('No description provided')).toBeInTheDocument();
  });

  it('shows placeholder text when rules is null', () => {
    const contestNoRules: Contest = { ...mockContest, rules: null };
    renderWithProviders(<ContestDetailsTab contest={contestNoRules} />);

    expect(screen.getByText('No rules provided')).toBeInTheDocument();
  });

  it('toggles edit mode when Edit button clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContestDetailsTab contest={mockContest} />);

    // Initially shows details
    expect(screen.getByText('Test Description')).toBeInTheDocument();

    // Click Edit button (not Cancel, so use exact match)
    const editButton = screen.getByRole('button', { name: 'Edit' });
    await user.click(editButton);

    // Now shows form - check for form elements
    expect(screen.getByLabelText(/contest name/i)).toBeInTheDocument();
  });

  it('exits edit mode when header Cancel clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContestDetailsTab contest={mockContest} />);

    // Enter edit mode
    const editButton = screen.getByRole('button', { name: 'Edit' });
    await user.click(editButton);

    // Find the header cancel button (first one, before form cancel)
    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    await user.click(cancelButtons[0]); // Header cancel button

    // Back to details view
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('renders status select with current status', () => {
    renderWithProviders(<ContestDetailsTab contest={mockContest} />);

    const statusSelect = screen.getByTestId('status-select');
    expect(statusSelect).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders different status for published contest', () => {
    const publishedContest: Contest = { ...mockContest, status: 'published' };
    renderWithProviders(<ContestDetailsTab contest={publishedContest} />);

    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  it('shows T/L/C notification status as Disabled when notifyTlc is false', () => {
    renderWithProviders(<ContestDetailsTab contest={mockContest} />);

    expect(screen.getByText('T/L/C Notifications')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('shows T/L/C notification status as Enabled when notifyTlc is true', () => {
    const contestWithTlc: Contest = { ...mockContest, notifyTlc: true };
    renderWithProviders(<ContestDetailsTab contest={contestWithTlc} />);

    expect(screen.getByText('Enabled')).toBeInTheDocument();
  });
});
