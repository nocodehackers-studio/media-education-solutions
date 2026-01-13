/**
 * DashboardPage Unit Tests
 * Tests admin dashboard with stats, active contests, and empty state
 *
 * AC1: Summary Statistics - Total Contests, Active Contests, Total Submissions
 * AC2: Active Contests List - name, status, submission count, judge progress percentage
 * AC3: Judge Progress Display - per-contest "Judge Progress: X/Y reviewed"
 * AC4: Contest Navigation - click to go to contest detail
 * AC5: Empty State - "Create your first contest" CTA
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { DashboardPage } from './DashboardPage';
import type { Contest, DashboardStats } from '@/features/contests';

// Mock the hooks
vi.mock('@/features/contests', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/contests')>();
  return {
    ...actual,
    useDashboardStats: vi.fn(),
    useActiveContests: vi.fn(),
  };
});

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { useDashboardStats, useActiveContests } from '@/features/contests';

const mockStats: DashboardStats = {
  totalContests: 5,
  activeContests: 2,
  totalParticipants: 100,
  totalSubmissions: 50,
};

// Active contests only (status = 'published')
const mockActiveContests: Contest[] = [
  {
    id: 'contest-1',
    name: 'Summer Video Contest',
    description: 'A contest for summer videos',
    slug: 'summer-video-contest-abc123',
    contestCode: 'ABC123',
    rules: null,
    coverImageUrl: null,
    status: 'published',
    winnersPagePassword: null,
    createdAt: '2026-01-10T12:00:00Z',
    updatedAt: '2026-01-10T12:00:00Z',
  },
  {
    id: 'contest-2',
    name: 'Winter Photo Contest',
    description: 'A contest for winter photos',
    slug: 'winter-photo-contest-def456',
    contestCode: 'DEF456',
    rules: null,
    coverImageUrl: null,
    status: 'published',
    winnersPagePassword: null,
    createdAt: '2026-01-09T12:00:00Z',
    updatedAt: '2026-01-09T12:00:00Z',
  },
];

const mockRefetch = vi.fn();

// Create a fresh QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

// Wrapper component with providers
function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    );
  };
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC1: Summary Statistics', () => {
    it('displays stat cards with correct values', async () => {
      vi.mocked(useDashboardStats).mockReturnValue({
        data: mockStats,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useDashboardStats>);

      vi.mocked(useActiveContests).mockReturnValue({
        data: mockActiveContests,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useActiveContests>);

      render(<DashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Total Contests')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      // "Active Contests" appears twice - once in stat card, once in card title
      expect(screen.getAllByText('Active Contests')).toHaveLength(2);
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Total Submissions')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('displays loading skeletons while fetching stats', () => {
      vi.mocked(useDashboardStats).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useDashboardStats>);

      vi.mocked(useActiveContests).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useActiveContests>);

      render(<DashboardPage />, { wrapper: createWrapper() });

      // Should show loading skeleton (presence of skeleton elements)
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('AC2: Active Contests List', () => {
    it('displays active contests with name and status badge', async () => {
      vi.mocked(useDashboardStats).mockReturnValue({
        data: mockStats,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useDashboardStats>);

      vi.mocked(useActiveContests).mockReturnValue({
        data: mockActiveContests,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useActiveContests>);

      render(<DashboardPage />, { wrapper: createWrapper() });

      // "Active Contests" appears in both stat card title and card header
      expect(screen.getAllByText('Active Contests')).toHaveLength(2);
      expect(screen.getByText('Summer Video Contest')).toBeInTheDocument();
      expect(screen.getByText('Winter Photo Contest')).toBeInTheDocument();
      // All active contests should have published status
      expect(screen.getAllByText('published')).toHaveLength(2);
    });

    it('displays submission count per contest (AC2)', async () => {
      vi.mocked(useDashboardStats).mockReturnValue({
        data: mockStats,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useDashboardStats>);

      vi.mocked(useActiveContests).mockReturnValue({
        data: mockActiveContests,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useActiveContests>);

      render(<DashboardPage />, { wrapper: createWrapper() });

      // Each active contest should show submission count
      const submissionCounts = screen.getAllByTestId('submission-count');
      expect(submissionCounts).toHaveLength(2);
      expect(submissionCounts[0]).toHaveTextContent('Submissions: 0');
      expect(submissionCounts[1]).toHaveTextContent('Submissions: 0');
    });

    it('shows empty message when no active contests', async () => {
      vi.mocked(useDashboardStats).mockReturnValue({
        data: { ...mockStats, activeContests: 0 },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useDashboardStats>);

      vi.mocked(useActiveContests).mockReturnValue({
        data: [] as Contest[],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useActiveContests>);

      render(<DashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText('No active contests. Publish a contest to see it here.')).toBeInTheDocument();
    });
  });

  describe('AC3: Judge Progress Display (per-contest)', () => {
    it('displays judge progress per contest', async () => {
      vi.mocked(useDashboardStats).mockReturnValue({
        data: mockStats,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useDashboardStats>);

      vi.mocked(useActiveContests).mockReturnValue({
        data: mockActiveContests,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useActiveContests>);

      render(<DashboardPage />, { wrapper: createWrapper() });

      // Each active contest should show judge progress placeholder (AC3 note: "No judges assigned" until Epic 3)
      const judgeProgressElements = screen.getAllByTestId('judge-progress');
      expect(judgeProgressElements).toHaveLength(2);
      expect(judgeProgressElements[0]).toHaveTextContent('No judges assigned');
      expect(judgeProgressElements[1]).toHaveTextContent('No judges assigned');
    });
  });

  describe('AC4: Contest Navigation', () => {
    it('navigates to contest detail when clicking a contest', async () => {
      const user = userEvent.setup();

      vi.mocked(useDashboardStats).mockReturnValue({
        data: mockStats,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useDashboardStats>);

      vi.mocked(useActiveContests).mockReturnValue({
        data: mockActiveContests,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useActiveContests>);

      render(<DashboardPage />, { wrapper: createWrapper() });

      const contestItem = screen.getByText('Summer Video Contest').closest('[role="button"]');
      expect(contestItem).toBeInTheDocument();

      await user.click(contestItem!);

      expect(mockNavigate).toHaveBeenCalledWith('/admin/contests/contest-1');
    });

    it('supports keyboard navigation to contest detail', async () => {
      const user = userEvent.setup();

      vi.mocked(useDashboardStats).mockReturnValue({
        data: mockStats,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useDashboardStats>);

      vi.mocked(useActiveContests).mockReturnValue({
        data: mockActiveContests,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useActiveContests>);

      render(<DashboardPage />, { wrapper: createWrapper() });

      const contestItem = screen.getByText('Summer Video Contest').closest('[role="button"]') as HTMLElement;
      contestItem.focus();
      await user.keyboard('{Enter}');

      expect(mockNavigate).toHaveBeenCalledWith('/admin/contests/contest-1');
    });
  });

  describe('AC5: Empty State', () => {
    it('displays empty state when no contests exist', async () => {
      vi.mocked(useDashboardStats).mockReturnValue({
        data: { totalContests: 0, activeContests: 0, totalParticipants: 0, totalSubmissions: 0 },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useDashboardStats>);

      vi.mocked(useActiveContests).mockReturnValue({
        data: [] as Contest[],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useActiveContests>);

      render(<DashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText('No contests yet')).toBeInTheDocument();
      expect(
        screen.getByText('Create your first contest to get started')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Create your first contest' })
      ).toBeInTheDocument();
    });

    it('navigates to contests page when clicking CTA button', async () => {
      const user = userEvent.setup();

      vi.mocked(useDashboardStats).mockReturnValue({
        data: { totalContests: 0, activeContests: 0, totalParticipants: 0, totalSubmissions: 0 },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useDashboardStats>);

      vi.mocked(useActiveContests).mockReturnValue({
        data: [] as Contest[],
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useActiveContests>);

      render(<DashboardPage />, { wrapper: createWrapper() });

      const ctaButton = screen.getByRole('button', {
        name: 'Create your first contest',
      });
      await user.click(ctaButton);

      expect(mockNavigate).toHaveBeenCalledWith('/admin/contests');
    });
  });

  describe('error state', () => {
    it('displays error state when stats fetch fails', () => {
      vi.mocked(useDashboardStats).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Database connection failed'),
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useDashboardStats>);

      vi.mocked(useActiveContests).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useActiveContests>);

      render(<DashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Failed to load dashboard')).toBeInTheDocument();
      expect(screen.getByText('There was an error loading the dashboard data. Please try again.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });

    it('displays error state when active contests fetch fails', () => {
      vi.mocked(useDashboardStats).mockReturnValue({
        data: mockStats,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useDashboardStats>);

      vi.mocked(useActiveContests).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch active contests'),
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useActiveContests>);

      render(<DashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Failed to load dashboard')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });

    it('calls refetch when Try Again button is clicked', async () => {
      const user = userEvent.setup();

      vi.mocked(useDashboardStats).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Database connection failed'),
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useDashboardStats>);

      vi.mocked(useActiveContests).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useActiveContests>);

      render(<DashboardPage />, { wrapper: createWrapper() });

      const retryButton = screen.getByRole('button', { name: 'Try Again' });
      await user.click(retryButton);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('page header', () => {
    it('displays page title and subtitle', () => {
      vi.mocked(useDashboardStats).mockReturnValue({
        data: mockStats,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useDashboardStats>);

      vi.mocked(useActiveContests).mockReturnValue({
        data: mockActiveContests,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useActiveContests>);

      render(<DashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Overview of all contests')).toBeInTheDocument();
    });
  });
});
