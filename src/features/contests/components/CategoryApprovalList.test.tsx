import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { CategoryApprovalList } from './CategoryApprovalList';
import type { CategoryApprovalStatus } from '../types/winners.types';

vi.mock('@/features/contests', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/features/contests');
  return {
    ...actual,
    useApproveCategory: vi.fn(),
    useUnapproveCategory: vi.fn(),
  };
});

import { useApproveCategory, useUnapproveCategory } from '@/features/contests';

const mockUseApproveCategory = vi.mocked(useApproveCategory);
const mockUseUnapproveCategory = vi.mocked(useUnapproveCategory);

const mockCategories: CategoryApprovalStatus[] = [
  {
    categoryId: 'cat-1',
    categoryName: 'Best Video',
    divisionName: 'General',
    type: 'video',
    judgingCompleted: true,
    approvedForWinners: false,
    approvedAt: null,
    submissionCount: 5,
    reviewCount: 4,
    rankingCount: 3,
  },
  {
    categoryId: 'cat-2',
    categoryName: 'Best Photo',
    divisionName: 'General',
    type: 'photo',
    judgingCompleted: false,
    approvedForWinners: false,
    approvedAt: null,
    submissionCount: 3,
    reviewCount: 0,
    rankingCount: 0,
  },
  {
    categoryId: 'cat-3',
    categoryName: 'Creative Award',
    divisionName: 'Senior',
    type: 'video',
    judgingCompleted: true,
    approvedForWinners: true,
    approvedAt: '2026-01-15T10:00:00Z',
    submissionCount: 4,
    reviewCount: 3,
    rankingCount: 3,
  },
];

// F8 fix: separate mock functions for approve and unapprove
const mockApproveMutate = vi.fn();
const mockUnapproveMutate = vi.fn();

function renderComponent(categories?: CategoryApprovalStatus[], isLoading = false) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CategoryApprovalList contestId="contest-1" categories={categories} isLoading={isLoading} />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('CategoryApprovalList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseApproveCategory.mockReturnValue({ mutate: mockApproveMutate, isPending: false } as unknown as ReturnType<typeof useApproveCategory>);
    mockUseUnapproveCategory.mockReturnValue({ mutate: mockUnapproveMutate, isPending: false } as unknown as ReturnType<typeof useUnapproveCategory>);
  });

  it('shows loading state and hides table', () => {
    renderComponent(undefined, true);
    expect(screen.queryByText('Best Video')).not.toBeInTheDocument();
  });

  it('displays category names and divisions', () => {
    renderComponent(mockCategories);

    expect(screen.getByText('Best Video')).toBeInTheDocument();
    expect(screen.getByText('Best Photo')).toBeInTheDocument();
    expect(screen.getByText('Creative Award')).toBeInTheDocument();
  });

  it('shows progress indicator', () => {
    renderComponent(mockCategories);

    expect(screen.getByText('1 of 3 approved')).toBeInTheDocument();
  });

  it('shows Approve button for eligible categories', () => {
    renderComponent(mockCategories);

    const approveButtons = screen.getAllByRole('button', { name: /Approve/i });
    expect(approveButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('shows Revoke button for approved categories', () => {
    renderComponent(mockCategories);

    expect(screen.getByRole('button', { name: /Revoke/i })).toBeInTheDocument();
  });

  it('disables Approve for incomplete judging', () => {
    renderComponent(mockCategories);

    const buttons = screen.getAllByRole('button', { name: /Approve/i });
    const disabledButtons = buttons.filter((b) => b.hasAttribute('disabled'));
    expect(disabledButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('calls approve mutation (not unapprove) on Approve click', async () => {
    const user = userEvent.setup();
    renderComponent(mockCategories);

    const approveButtons = screen.getAllByRole('button', { name: /Approve/i });
    const enabledButton = approveButtons.find((b) => !b.hasAttribute('disabled'));
    expect(enabledButton).toBeDefined();

    await user.click(enabledButton!);
    // F8 fix: verify the correct mutation was called
    expect(mockApproveMutate).toHaveBeenCalled();
    expect(mockUnapproveMutate).not.toHaveBeenCalled();
  });

  it('shows empty state when no categories', () => {
    renderComponent([]);

    expect(screen.getByText(/No categories found/i)).toBeInTheDocument();
  });
});
