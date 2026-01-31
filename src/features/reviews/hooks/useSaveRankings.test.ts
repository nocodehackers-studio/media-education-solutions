/**
 * useSaveRankings Hook Tests - Story 5.5
 * Tests TanStack mutation hook for persisting judge's top 3 rankings
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useSaveRankings } from './useSaveRankings';

// Mock supabase
const mockRpc = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: (...args: unknown[]) => mockRpc(...args),
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
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useSaveRankings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls save_rankings RPC with correct params', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useSaveRankings('cat-1'), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync([
      { rank: 1, submissionId: 'sub-1' },
      { rank: 2, submissionId: 'sub-2' },
      { rank: 3, submissionId: 'sub-3' },
    ]);

    expect(mockRpc).toHaveBeenCalledWith('save_rankings', {
      p_category_id: 'cat-1',
      p_judge_id: 'judge-123',
      p_rankings: [
        { rank: 1, submission_id: 'sub-1' },
        { rank: 2, submission_id: 'sub-2' },
        { rank: 3, submission_id: 'sub-3' },
      ],
    });
  });

  it('throws when RPC returns error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

    const { result } = renderHook(() => useSaveRankings('cat-1'), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync([{ rank: 1, submissionId: 'sub-1' }])
    ).rejects.toEqual({ message: 'RPC failed' });
  });

  it('throws when categoryId is undefined', async () => {
    const { result } = renderHook(() => useSaveRankings(undefined), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync([{ rank: 1, submissionId: 'sub-1' }])
    ).rejects.toThrow('Category ID required');
  });

  it('invalidates rankings query on success', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useSaveRankings('cat-1'), { wrapper });

    await result.current.mutateAsync([{ rank: 1, submissionId: 'sub-1' }]);

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['rankings', 'cat-1'] })
      );
    });
  });
});
