/**
 * DashboardPage Unit Tests
 * Tests admin dashboard with stats, recent contests, and empty state
 *
 * AC1: Summary Statistics - Total Contests, Active Contests, Total Submissions
 * AC2: Active Contests List - name, status, submission count, judge progress
 * AC3: Judge Progress Display - placeholder until Epic 3
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
    useRecentContests: vi.fn(),
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

import { useDashboardStats, useRecentContests } from '@/features/contests';

const mockStats: DashboardStats = {
  totalContests: 5,
  activeContests: 2,
  totalParticipants: 100,
  totalSubmissions: 50,
};

const mockContests: Contest[] = [
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
    status: 'draft',
    winnersPagePassword: null,
    createdAt: '2026-01-09T12:00:00Z',
    updatedAt: '2026-01-09T12:00:00Z',
  },
];

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
      } as ReturnType<typeof useDashboardStats>);

      vi.mocked(useRecentContests).mockReturnValue({
        data: mockContests,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useRecentContests>);

      render(<DashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Total Contests')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Active Contests')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Total Submissions')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('displays loading skeletons while fetching stats', () => {
      vi.mocked(useDashboardStats).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as ReturnType<typeof useDashboardStats>);

      vi.mocked(useRecentContests).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as ReturnType<typeof useRecentContests>);

      render(<DashboardPage />, { wrapper: createWrapper() });

      // Should show loading skeleton (presence of skeleton elements)
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('AC2: Active Contests List', () => {
    it('displays recent contests with name and status', async () => {
      vi.mocked(useDashboardStats).mockReturnValue({
        data: mockStats,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useDashboardStats>);

      vi.mocked(useRecentContests).mockReturnValue({
        data: mockContests,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useRecentContests>);

      render(<DashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Recent Contests')).toBeInTheDocument();
      expect(screen.getByText('Summer Video Contest')).toBeInTheDocument();
      expect(screen.getByText('ABC123')).toBeInTheDocument();
      expect(screen.getByText('Winter Photo Contest')).toBeInTheDocument();
      expect(screen.getByText('DEF456')).toBeInTheDocument();
    });

    it('displays status badges for contests', async () => {
      vi.mocked(useDashboardStats).mockReturnValue({
        data: mockStats,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useDashboardStats>);

      vi.mocked(useRecentContests).mockReturnValue({
        data: mockContests,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useRecentContests>);

      render(<DashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText('published')).toBeInTheDocument();
      expect(screen.getByText('draft')).toBeInTheDocument();
    });
  });

  describe('AC3: Judge Progress Display', () => {
    it('displays placeholder for judge progress', async () => {
      vi.mocked(useDashboardStats).mockReturnValue({
        data: mockStats,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useDashboardStats>);

      vi.mocked(useRecentContests).mockReturnValue({
        data: mockContests,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useRecentContests>);

      render(<DashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Judge Progress')).toBeInTheDocument();
      expect(screen.getByText('No judges assigned yet')).toBeInTheDocument();
      expect(
        screen.getByText('Judge assignments available in Epic 3')
      ).toBeInTheDocument();
    });
  });

  describe('AC4: Contest Navigation', () => {
    it('navigates to contest detail when clicking a contest', async () => {
      const user = userEvent.setup();

      vi.mocked(useDashboardStats).mockReturnValue({
        data: mockStats,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useDashboardStats>);

      vi.mocked(useRecentContests).mockReturnValue({
        data: mockContests,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useRecentContests>);

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
      } as ReturnType<typeof useDashboardStats>);

      vi.mocked(useRecentContests).mockReturnValue({
        data: mockContests,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useRecentContests>);

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
      } as ReturnType<typeof useDashboardStats>);

      vi.mocked(useRecentContests).mockReturnValue({
        data: [] as Contest[],
        isLoading: false,
        error: null,
      } as ReturnType<typeof useRecentContests>);

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
      } as ReturnType<typeof useDashboardStats>);

      vi.mocked(useRecentContests).mockReturnValue({
        data: [] as Contest[],
        isLoading: false,
        error: null,
      } as ReturnType<typeof useRecentContests>);

      render(<DashboardPage />, { wrapper: createWrapper() });

      const ctaButton = screen.getByRole('button', {
        name: 'Create your first contest',
      });
      await user.click(ctaButton);

      expect(mockNavigate).toHaveBeenCalledWith('/admin/contests');
    });
  });

  describe('page header', () => {
    it('displays page title and subtitle', () => {
      vi.mocked(useDashboardStats).mockReturnValue({
        data: mockStats,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useDashboardStats>);

      vi.mocked(useRecentContests).mockReturnValue({
        data: mockContests,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useRecentContests>);

      render(<DashboardPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Overview of all contests')).toBeInTheDocument();
    });
  });
});
