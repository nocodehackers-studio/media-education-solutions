/**
 * useDashboardStats Unit Tests
 * Tests TanStack Query hook for fetching dashboard statistics
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useDashboardStats } from './useDashboardStats';

// Mock the contestsApi
vi.mock('../api/contestsApi', () => ({
  contestsApi: {
    getStats: vi.fn(),
  },
}));

import { contestsApi } from '../api/contestsApi';

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

describe('useDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('returns isLoading=true on initial load', async () => {
      // Setup mock that never resolves immediately
      vi.mocked(contestsApi.getStats).mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useDashboardStats(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('returns isLoading=false after data loads', async () => {
      const mockStats = {
        totalContests: 5,
        activeContests: 2,
        totalParticipants: 100,
        totalSubmissions: 50,
      };

      vi.mocked(contestsApi.getStats).mockResolvedValue(mockStats);

      const { result } = renderHook(() => useDashboardStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockStats);
    });
  });

  describe('error state', () => {
    it('returns error when query fails', async () => {
      vi.mocked(contestsApi.getStats).mockRejectedValue(
        new Error('Database connection failed')
      );

      const { result } = renderHook(() => useDashboardStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error?.message).toBe('Database connection failed');
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('successful fetch', () => {
    it('returns dashboard stats with all counters', async () => {
      const mockStats = {
        totalContests: 10,
        activeContests: 3,
        totalParticipants: 250,
        totalSubmissions: 75,
      };

      vi.mocked(contestsApi.getStats).mockResolvedValue(mockStats);

      const { result } = renderHook(() => useDashboardStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.totalContests).toBe(10);
      expect(result.current.data?.activeContests).toBe(3);
      expect(result.current.data?.totalParticipants).toBe(250);
      expect(result.current.data?.totalSubmissions).toBe(75);
    });

    it('handles zero values correctly', async () => {
      const mockStats = {
        totalContests: 0,
        activeContests: 0,
        totalParticipants: 0,
        totalSubmissions: 0,
      };

      vi.mocked(contestsApi.getStats).mockResolvedValue(mockStats);

      const { result } = renderHook(() => useDashboardStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.totalContests).toBe(0);
      expect(result.current.data?.activeContests).toBe(0);
      expect(result.current.data?.totalParticipants).toBe(0);
      expect(result.current.data?.totalSubmissions).toBe(0);
    });
  });

  describe('query configuration', () => {
    it('uses correct query key', async () => {
      vi.mocked(contestsApi.getStats).mockResolvedValue({
        totalContests: 1,
        activeContests: 0,
        totalParticipants: 0,
        totalSubmissions: 0,
      });

      const queryClient = createTestQueryClient();
      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      renderHook(() => useDashboardStats(), { wrapper });

      await waitFor(() => {
        const queryState = queryClient.getQueryState(['dashboard-stats']);
        expect(queryState).toBeDefined();
      });
    });
  });
});
