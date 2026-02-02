// Story 7-5: Tests for NotificationLogsTable component
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationLogsTable } from './NotificationLogsTable';
import type { NotificationLog } from '../types/notification.types';

vi.mock('../hooks/useNotificationLogs', () => ({
  useNotificationLogs: vi.fn(),
}));

vi.mock('../hooks/useRetryNotification', () => ({
  useRetryNotification: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

import { useNotificationLogs } from '../hooks/useNotificationLogs';
const mockUseNotificationLogs = vi.mocked(useNotificationLogs);

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

const baseLogs: NotificationLog[] = [
  { id: '1', type: 'judge_invitation', recipientEmail: 'judge@test.com', recipientId: 'u1', relatedContestId: 'c1', relatedCategoryId: 'cat1', brevoMessageId: 'msg1', status: 'sent', errorMessage: null, retryCount: 0, createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-01-15T10:00:00Z' },
  { id: '2', type: 'judge_complete', recipientEmail: 'admin@test.com', recipientId: 'u2', relatedContestId: 'c1', relatedCategoryId: 'cat1', brevoMessageId: null, status: 'failed', errorMessage: 'Brevo API error', retryCount: 1, createdAt: '2026-01-15T11:00:00Z', updatedAt: '2026-01-15T11:00:00Z' },
  { id: '3', type: 'tlc_results', recipientEmail: 'tlc@test.com', recipientId: null, relatedContestId: 'c1', relatedCategoryId: null, brevoMessageId: null, status: 'permanently_failed', errorMessage: 'Max retries exceeded', retryCount: 3, createdAt: '2026-01-15T12:00:00Z', updatedAt: '2026-01-15T12:00:00Z' },
];

describe('NotificationLogsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders rows with correct status badges', () => {
    mockUseNotificationLogs.mockReturnValue({
      data: baseLogs,
      isLoading: false,
    } as unknown as ReturnType<typeof useNotificationLogs>);

    renderWithProviders(<NotificationLogsTable contestId="c1" />);

    expect(screen.getByText('judge@test.com')).toBeInTheDocument();
    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
    expect(screen.getByText('tlc@test.com')).toBeInTheDocument();
    expect(screen.getByText('Sent')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Permanently Failed')).toBeInTheDocument();
  });

  it('renders type badges correctly', () => {
    mockUseNotificationLogs.mockReturnValue({
      data: baseLogs,
      isLoading: false,
    } as unknown as ReturnType<typeof useNotificationLogs>);

    renderWithProviders(<NotificationLogsTable contestId="c1" />);

    expect(screen.getByText('Judge Invitation')).toBeInTheDocument();
    expect(screen.getByText('Judging Complete')).toBeInTheDocument();
    expect(screen.getByText('T/L/C Results')).toBeInTheDocument();
  });

  it('shows Retry button for failed but not for permanently_failed or sent', () => {
    mockUseNotificationLogs.mockReturnValue({
      data: baseLogs,
      isLoading: false,
    } as unknown as ReturnType<typeof useNotificationLogs>);

    renderWithProviders(<NotificationLogsTable contestId="c1" />);

    const retryButtons = screen.getAllByRole('button', { name: /retry/i });
    // Only the "failed" entry (id=2) should have a Retry button
    expect(retryButtons).toHaveLength(1);
  });

  it('shows empty state when no logs', () => {
    mockUseNotificationLogs.mockReturnValue({
      data: [] as NotificationLog[],
      isLoading: false,
    } as unknown as ReturnType<typeof useNotificationLogs>);

    renderWithProviders(<NotificationLogsTable contestId="c1" />);

    expect(screen.getByText('No notification logs found.')).toBeInTheDocument();
  });

  it('renders Export CSV button', () => {
    mockUseNotificationLogs.mockReturnValue({
      data: baseLogs,
      isLoading: false,
    } as unknown as ReturnType<typeof useNotificationLogs>);

    renderWithProviders(<NotificationLogsTable contestId="c1" />);

    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
  });

  it('displays retry count for entries with retries', () => {
    mockUseNotificationLogs.mockReturnValue({
      data: baseLogs,
      isLoading: false,
    } as unknown as ReturnType<typeof useNotificationLogs>);

    renderWithProviders(<NotificationLogsTable contestId="c1" />);

    expect(screen.getByText('(1 retry)')).toBeInTheDocument();
    expect(screen.getByText('(3 retries)')).toBeInTheDocument();
  });
});
