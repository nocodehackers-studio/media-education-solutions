// Story 7-5: Tests for NotificationSummary component
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationSummary } from './NotificationSummary';
import type { NotificationLog } from '../types/notification.types';

vi.mock('../hooks/useNotificationLogs', () => ({
  useNotificationLogs: vi.fn(),
}));

import { useNotificationLogs } from '../hooks/useNotificationLogs';
const mockUseNotificationLogs = vi.mocked(useNotificationLogs);

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

const mockLogs: NotificationLog[] = [
  { id: '1', type: 'judge_invitation', recipientEmail: 'a@test.com', recipientId: null, relatedContestId: 'c1', relatedCategoryId: null, brevoMessageId: null, status: 'sent', errorMessage: null, retryCount: 0, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: '2', type: 'judge_complete', recipientEmail: 'b@test.com', recipientId: null, relatedContestId: 'c1', relatedCategoryId: null, brevoMessageId: null, status: 'sent', errorMessage: null, retryCount: 0, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: '3', type: 'tlc_results', recipientEmail: 'c@test.com', recipientId: null, relatedContestId: 'c1', relatedCategoryId: null, brevoMessageId: null, status: 'failed', errorMessage: 'Brevo error', retryCount: 1, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: '4', type: 'judge_invitation', recipientEmail: 'd@test.com', recipientId: null, relatedContestId: 'c1', relatedCategoryId: null, brevoMessageId: null, status: 'permanently_failed', errorMessage: 'Max retries', retryCount: 3, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
];

describe('NotificationSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correct counts with data', () => {
    mockUseNotificationLogs.mockReturnValue({
      data: mockLogs,
      isLoading: false,
    } as unknown as ReturnType<typeof useNotificationLogs>);

    renderWithProviders(<NotificationSummary contestId="c1" />);

    expect(screen.getByText('4')).toBeInTheDocument(); // total
    expect(screen.getByText('Total Emails')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    // Both "Delivered" and "Failed" show 2, so check both exist
    const twos = screen.getAllByText('2');
    expect(twos).toHaveLength(2);
  });

  it('renders zero counts when no logs', () => {
    mockUseNotificationLogs.mockReturnValue({
      data: [] as NotificationLog[],
      isLoading: false,
    } as unknown as ReturnType<typeof useNotificationLogs>);

    renderWithProviders(<NotificationSummary contestId="c1" />);

    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(4);
  });
});
