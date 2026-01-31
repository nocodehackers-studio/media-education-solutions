/**
 * useUpsertReview Hook Tests - Story 5.2 (AC3)
 * Tests mutation hook for upserting judge reviews
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useUpsertReview } from './useUpsertReview';

// Mock supabase
const mockSelect = vi.fn();
const mockUpsert = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

vi.mock('@/contexts', () => ({
  useAuth: () => ({
    user: { id: 'judge-1', email: 'judge@test.com', role: 'judge', firstName: null, lastName: null },
    isLoading: false,
    isAuthenticated: true,
  }),
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

describe('useUpsertReview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'rev-1' }, error: null }) });
    mockUpsert.mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ upsert: mockUpsert });
  });

  it('calls supabase upsert with correct params', async () => {
    const { result } = renderHook(() => useUpsertReview('cat-1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        submissionId: 'sub-1',
        rating: 7,
        feedback: 'Good work',
      });
    });

    expect(mockFrom).toHaveBeenCalledWith('reviews');
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        submission_id: 'sub-1',
        judge_id: 'judge-1',
        rating: 7,
        feedback: 'Good work',
      },
      { onConflict: 'submission_id,judge_id' }
    );
  });

  it('handles null rating and feedback', async () => {
    const { result } = renderHook(() => useUpsertReview('cat-1'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        submissionId: 'sub-1',
      });
    });

    expect(mockUpsert).toHaveBeenCalledWith(
      {
        submission_id: 'sub-1',
        judge_id: 'judge-1',
        rating: null,
        feedback: null,
      },
      { onConflict: 'submission_id,judge_id' }
    );
  });

  it('returns isPending state', () => {
    const { result } = renderHook(() => useUpsertReview('cat-1'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);
  });

  it('throws on supabase error', async () => {
    const supabaseError = new Error('RLS violation');
    mockSelect.mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: null, error: supabaseError }),
    });

    const { result } = renderHook(() => useUpsertReview('cat-1'), {
      wrapper: createWrapper(),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          submissionId: 'sub-1',
          rating: 5,
          feedback: 'Test',
        });
      })
    ).rejects.toThrow('RLS violation');
  });

  it('invalidates submissions-for-review query on success', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useUpsertReview('cat-1'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        submissionId: 'sub-1',
        rating: 8,
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['submissions-for-review', 'cat-1'],
      });
    });
  });
});
