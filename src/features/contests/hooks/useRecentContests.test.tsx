/**
 * useRecentContests Unit Tests
 * Tests TanStack Query hook for fetching recent contests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useRecentContests } from './useRecentContests';
import type { Contest } from '../types/contest.types';

// Mock the contestsApi
vi.mock('../api/contestsApi', () => ({
  contestsApi: {
    listRecentContests: vi.fn(),
  },
}));

import { contestsApi } from '../api/contestsApi';

const mockContest: Contest = {
  id: 'contest-1',
  name: 'Summer Video Contest',
  description: 'A contest for summer videos',
  slug: 'summer-video-contest-abc123',
  contestCode: 'ABC123',
  rules: null,
  coverImageUrl: null,
  logoUrl: null,
  status: 'published',
  winnersPagePassword: null,
  winnersPageEnabled: false,
  winnersPageGeneratedAt: null,
  notifyTlc: false,
  deletedAt: null,
  createdAt: '2026-01-10T12:00:00Z',
  updatedAt: '2026-01-10T12:00:00Z',
  timezone: 'America/New_York',
};

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

// Wrapper component with QueryClientProvider
function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useRecentContests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('returns isLoading=true on initial load', async () => {
      vi.mocked(contestsApi.listRecentContests).mockReturnValue(
        new Promise(() => {})
      );

      const { result } = renderHook(() => useRecentContests(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('returns isLoading=false after data loads', async () => {
      vi.mocked(contestsApi.listRecentContests).mockResolvedValue([mockContest]);

      const { result } = renderHook(() => useRecentContests(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(1);
    });
  });

  describe('error state', () => {
    it('returns error when query fails', async () => {
      vi.mocked(contestsApi.listRecentContests).mockRejectedValue(
        new Error('Failed to fetch recent contests')
      );

      const { result } = renderHook(() => useRecentContests(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error?.message).toBe(
        'Failed to fetch recent contests'
      );
    });
  });

  describe('successful fetch', () => {
    it('returns array of recent contests', async () => {
      const mockContests: Contest[] = [
        mockContest,
        { ...mockContest, id: 'contest-2', name: 'Winter Contest', status: 'draft' },
        { ...mockContest, id: 'contest-3', name: 'Fall Contest', status: 'closed' },
      ];

      vi.mocked(contestsApi.listRecentContests).mockResolvedValue(mockContests);

      const { result } = renderHook(() => useRecentContests(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(3);
      expect(result.current.data?.[0].name).toBe('Summer Video Contest');
      expect(result.current.data?.[1].name).toBe('Winter Contest');
      expect(result.current.data?.[2].name).toBe('Fall Contest');
    });

    it('returns empty array when no contests exist', async () => {
      vi.mocked(contestsApi.listRecentContests).mockResolvedValue([]);

      const { result } = renderHook(() => useRecentContests(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });
  });

  describe('limit parameter', () => {
    it('uses default limit of 5', async () => {
      vi.mocked(contestsApi.listRecentContests).mockResolvedValue([]);

      renderHook(() => useRecentContests(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(contestsApi.listRecentContests).toHaveBeenCalledWith(5);
      });
    });

    it('passes custom limit to API', async () => {
      vi.mocked(contestsApi.listRecentContests).mockResolvedValue([]);

      renderHook(() => useRecentContests(10), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(contestsApi.listRecentContests).toHaveBeenCalledWith(10);
      });
    });
  });

  describe('query configuration', () => {
    it('uses correct query key with limit', async () => {
      vi.mocked(contestsApi.listRecentContests).mockResolvedValue([]);

      const queryClient = createTestQueryClient();
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      renderHook(() => useRecentContests(3), { wrapper });

      await waitFor(() => {
        const queryState = queryClient.getQueryState(['recent-contests', 3]);
        expect(queryState).toBeDefined();
      });
    });
  });
});
