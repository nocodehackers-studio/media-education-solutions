import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DeletedContestsList } from './DeletedContestsList';
import type { Contest } from '../types/contest.types';

vi.mock('../hooks/useRestoreContest', () => ({
  useRestoreContest: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const mockContests: Contest[] = [
  {
    id: 'contest-1',
    name: 'Deleted Contest',
    description: 'A deleted contest',
    slug: 'deleted-contest',
    contestCode: 'DEL123',
    rules: null,
    coverImageUrl: null,
    logoUrl: null,
    status: 'draft',
    winnersPagePassword: null,
    winnersPageEnabled: false,
    winnersPageGeneratedAt: null,
    notifyTlc: false,
    deletedAt: new Date().toISOString(),
    createdAt: '2026-01-10T12:00:00Z',
    updatedAt: '2026-01-10T12:00:00Z',
    timezone: 'America/New_York',
  },
];

describe('DeletedContestsList', () => {
  it('renders collapsed by default', () => {
    render(<DeletedContestsList contests={mockContests} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Recently Deleted (1)')).toBeInTheDocument();
    expect(screen.queryByText('Deleted Contest')).not.toBeInTheDocument();
  });

  it('expands when toggle button is clicked', async () => {
    const user = userEvent.setup();
    render(<DeletedContestsList contests={mockContests} />, {
      wrapper: createWrapper(),
    });

    await user.click(screen.getByText('Recently Deleted (1)'));

    expect(screen.getByText('Deleted Contest')).toBeInTheDocument();
  });

  it('renders nothing when contests array is empty', () => {
    const { container } = render(<DeletedContestsList contests={[]} />, {
      wrapper: createWrapper(),
    });

    expect(container.firstChild).toBeNull();
  });
});
