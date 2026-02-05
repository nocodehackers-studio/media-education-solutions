import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WinnersSetupForm } from './WinnersSetupForm';
import type { Contest } from '../types/contest.types';

vi.mock('@/features/contests', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/features/contests');
  return {
    ...actual,
    useGenerateWinnersPage: vi.fn(),
    useUpdateWinnersPassword: vi.fn(),
    useRevokeWinnersPage: vi.fn(),
    useReactivateWinnersPage: vi.fn(),
  };
});

import {
  useGenerateWinnersPage,
  useUpdateWinnersPassword,
  useRevokeWinnersPage,
  useReactivateWinnersPage,
} from '@/features/contests';

const mockUseGenerateWinnersPage = vi.mocked(useGenerateWinnersPage);
const mockUseUpdateWinnersPassword = vi.mocked(useUpdateWinnersPassword);
const mockUseRevokeWinnersPage = vi.mocked(useRevokeWinnersPage);
const mockUseReactivateWinnersPage = vi.mocked(useReactivateWinnersPage);

const mockMutate = vi.fn();

const baseContest: Contest = {
  id: 'contest-1',
  name: 'Summer Contest',
  description: null,
  slug: 'summer-contest',
  contestCode: 'ABC123',
  rules: null,
  coverImageUrl: null,
  logoUrl: null,
  status: 'reviewed',
  winnersPagePassword: null,
  winnersPageEnabled: false,
  winnersPageGeneratedAt: null,
  notifyTlc: false,
  deletedAt: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  timezone: 'America/New_York',
};

const finishedContest: Contest = {
  ...baseContest,
  status: 'finished',
  winnersPageEnabled: true,
  winnersPageGeneratedAt: '2026-01-20T10:00:00Z',
  notifyTlc: false,
  winnersPagePassword: 'secret123',
};

const onPreview = vi.fn();

function renderComponent(contest: Contest = baseContest, allApproved = false) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <WinnersSetupForm
        contest={contest}
        allCategoriesApproved={allApproved}
        approvedCount={allApproved ? 3 : 1}
        totalCount={3}
        onPreview={onPreview}
      />
    </QueryClientProvider>
  );
}

describe('WinnersSetupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockResult = { mutate: mockMutate, isPending: false };
    mockUseGenerateWinnersPage.mockReturnValue(mockResult as unknown as ReturnType<typeof useGenerateWinnersPage>);
    mockUseUpdateWinnersPassword.mockReturnValue(mockResult as unknown as ReturnType<typeof useUpdateWinnersPassword>);
    mockUseRevokeWinnersPage.mockReturnValue(mockResult as unknown as ReturnType<typeof useRevokeWinnersPage>);
    mockUseReactivateWinnersPage.mockReturnValue(mockResult as unknown as ReturnType<typeof useReactivateWinnersPage>);
  });

  it('shows generate form when not yet generated', () => {
    renderComponent();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Winners Page/i })).toBeInTheDocument();
  });

  it('disables generate button when categories not approved', () => {
    renderComponent(baseContest, false);
    const btn = screen.getByRole('button', { name: /Generate Winners Page/i });
    expect(btn).toBeDisabled();
  });

  it('enables generate button when all categories approved', () => {
    renderComponent(baseContest, true);
    const btn = screen.getByRole('button', { name: /Generate Winners Page/i });
    // Button is not disabled (it may still need valid password)
    expect(btn).not.toBeDisabled();
  });

  it('shows approval message when not all approved', () => {
    renderComponent(baseContest, false);
    expect(screen.getByText(/Approve all categories before publishing/i)).toBeInTheDocument();
  });

  it('shows URL and management controls when generated', () => {
    renderComponent(finishedContest, true);
    expect(screen.getByText(/winners\/ABC123/)).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Revoke Winners Page/i })).toBeInTheDocument();
  });

  it('shows Reactivate when revoked', () => {
    const revokedContest = { ...finishedContest, winnersPageEnabled: false };
    renderComponent(revokedContest, true);
    expect(screen.getByText('Revoked')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reactivate Winners Page/i })).toBeInTheDocument();
  });

  it('calls onPreview when Preview button clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole('button', { name: /Preview/i }));
    expect(onPreview).toHaveBeenCalled();
  });

  it('shows change password form on click', async () => {
    const user = userEvent.setup();
    renderComponent(finishedContest, true);
    await user.click(screen.getByRole('button', { name: /Change Password/i }));
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
  });
});
