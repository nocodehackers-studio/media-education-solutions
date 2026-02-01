/**
 * useRankings Hook Tests - Story 5.5
 * Tests TanStack Query hook for fetching judge's rankings
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useRankings } from './useRankings';

// Mock supabase
const mockSelect = vi.fn();
const mockMatch = vi.fn();
const mockOrder = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  },
}));

// Mock auth context
vi.mock('@/contexts', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'judge-123', email: 'judge@test.com', role: 'judge' },
    isLoading: false,
  })),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useRankings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ match: mockMatch });
    mockMatch.mockReturnValue({ order: mockOrder });
  });

  it('fetches rankings for a category', async () => {
    mockOrder.mockResolvedValue({
      data: [
        {
          id: 'rank-1',
          category_id: 'cat-1',
          judge_id: 'judge-123',
          rank: 1,
          submission_id: 'sub-1',
          created_at: '2026-01-15T00:00:00Z',
          updated_at: '2026-01-15T00:00:00Z',
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => useRankings('cat-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].submissionId).toBe('sub-1');
    expect(result.current.data![0].rank).toBe(1);
  });

  it('returns empty array when no rankings exist', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useRankings('cat-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('does not fetch when categoryId is undefined', () => {
    const { result } = renderHook(() => useRankings(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});
