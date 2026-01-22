// useDivisions Hook Tests - Story 2.9
// Tests TanStack Query states: isLoading, isFetching, error, data

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useDivisions } from './useDivisions';
import { divisionsApi } from '../api/divisionsApi';
import type { Division } from '../types/division.types';

// Mock the API
vi.mock('../api/divisionsApi', () => ({
  divisionsApi: {
    listByContest: vi.fn(),
  },
}));

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

const mockDivisions: Division[] = [
  {
    id: 'div-1',
    contestId: 'contest-1',
    name: 'High School',
    displayOrder: 0,
    createdAt: '2026-01-21T00:00:00Z',
    categoryCount: 3,
  },
  {
    id: 'div-2',
    contestId: 'contest-1',
    name: 'Teachers',
    displayOrder: 1,
    createdAt: '2026-01-21T00:00:00Z',
    categoryCount: 5,
  },
];

describe('useDivisions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isLoading state', () => {
    it('returns isLoading=true on initial load', async () => {
      // Setup mock that never resolves immediately
      vi.mocked(divisionsApi.listByContest).mockReturnValue(
        new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useDivisions('contest-1'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('returns isLoading=false after data loads', async () => {
      vi.mocked(divisionsApi.listByContest).mockResolvedValue(mockDivisions);

      const { result } = renderHook(() => useDivisions('contest-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].name).toBe('High School');
    });
  });

  describe('isFetching state', () => {
    it('returns isFetching=true while request is in-flight', async () => {
      let resolvePromise: (value: Division[]) => void;
      const pendingPromise = new Promise<Division[]>((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(divisionsApi.listByContest).mockReturnValue(pendingPromise);

      const { result } = renderHook(() => useDivisions('contest-1'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(true);

      // Resolve the promise
      resolvePromise!(mockDivisions);

      await waitFor(() => {
        expect(result.current.isFetching).toBe(false);
      });
    });
  });

  describe('error state', () => {
    it('returns error when query fails', async () => {
      vi.mocked(divisionsApi.listByContest).mockRejectedValue(
        new Error('Failed to load divisions')
      );

      const { result } = renderHook(() => useDivisions('contest-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error?.message).toBe('Failed to load divisions');
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('enabled condition', () => {
    it('does not fetch when contestId is empty string', () => {
      const { result } = renderHook(() => useDivisions(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(divisionsApi.listByContest).not.toHaveBeenCalled();
    });

    it('fetches when contestId is provided', async () => {
      vi.mocked(divisionsApi.listByContest).mockResolvedValue(mockDivisions);

      renderHook(() => useDivisions('contest-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(divisionsApi.listByContest).toHaveBeenCalledWith('contest-1');
      });
    });
  });

  describe('data transformation', () => {
    it('returns divisions in API-provided order (sorting done by database)', async () => {
      // Note: Sorting is handled by the database query (ORDER BY display_order)
      // This test verifies the hook passes through data as received from API
      const divisionsFromApi: Division[] = [
        { ...mockDivisions[1], displayOrder: 1 },
        { ...mockDivisions[0], displayOrder: 0 },
      ];

      vi.mocked(divisionsApi.listByContest).mockResolvedValue(divisionsFromApi);

      const { result } = renderHook(() => useDivisions('contest-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Hook returns data in same order as API provides (pass-through)
      expect(result.current.data?.[0].displayOrder).toBe(1);
      expect(result.current.data?.[1].displayOrder).toBe(0);
    });

    it('includes categoryCount in returned divisions', async () => {
      vi.mocked(divisionsApi.listByContest).mockResolvedValue(mockDivisions);

      const { result } = renderHook(() => useDivisions('contest-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.[0].categoryCount).toBe(3);
      expect(result.current.data?.[1].categoryCount).toBe(5);
    });
  });

  describe('query key', () => {
    it('uses correct query key with contestId', async () => {
      vi.mocked(divisionsApi.listByContest).mockResolvedValue(mockDivisions);

      const { result } = renderHook(() => useDivisions('specific-contest'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(divisionsApi.listByContest).toHaveBeenCalledWith('specific-contest');
    });
  });
});
