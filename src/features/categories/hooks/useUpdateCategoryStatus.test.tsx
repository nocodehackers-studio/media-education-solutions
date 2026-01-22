// useUpdateCategoryStatus hook tests - Story 3-2
// Tests for category status update with judge invitation flow

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Mock the API - must be before imports that use it
vi.mock('../api/categoriesApi', () => ({
  categoriesApi: {
    updateStatus: vi.fn(),
    sendJudgeInvitation: vi.fn(),
  },
}));

// Mock toast - use factory that doesn't reference external variables
vi.mock('@/components/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/ui')>();
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    },
  };
});

// Import after mocks are set up
import { useUpdateCategoryStatus } from './useUpdateCategoryStatus';
import * as categoriesApi from '../api/categoriesApi';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useUpdateCategoryStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls updateStatus API for any status change', async () => {
    vi.mocked(categoriesApi.categoriesApi.updateStatus).mockResolvedValue({
      id: 'cat-1',
      divisionId: 'div-1',
      name: 'Test Category',
      type: 'video',
      rules: null,
      description: null,
      deadline: '2026-12-31',
      status: 'published',
      createdAt: new Date().toISOString(),
      assignedJudgeId: null,
      invitedAt: null,
    });

    const { result } = renderHook(
      () => useUpdateCategoryStatus('contest-123'),
      { wrapper: createWrapper() }
    );

    await result.current.mutateAsync({
      categoryId: 'cat-1',
      status: 'published',
    });

    await waitFor(() => {
      expect(categoriesApi.categoriesApi.updateStatus).toHaveBeenCalledWith(
        'cat-1',
        'published'
      );
    });
  });

  it('calls sendJudgeInvitation when status changes to closed (AC1)', async () => {
    vi.mocked(categoriesApi.categoriesApi.updateStatus).mockResolvedValue({
      id: 'cat-1',
      divisionId: 'div-1',
      name: 'Test Category',
      type: 'video',
      rules: null,
      description: null,
      deadline: '2026-12-31',
      status: 'closed',
      createdAt: new Date().toISOString(),
      assignedJudgeId: 'judge-1',
      invitedAt: null,
    });
    vi.mocked(categoriesApi.categoriesApi.sendJudgeInvitation).mockResolvedValue({
      success: true,
    });

    const { result } = renderHook(
      () => useUpdateCategoryStatus('contest-123'),
      { wrapper: createWrapper() }
    );

    await result.current.mutateAsync({
      categoryId: 'cat-1',
      status: 'closed',
    });

    await waitFor(() => {
      expect(categoriesApi.categoriesApi.sendJudgeInvitation).toHaveBeenCalledWith(
        'cat-1'
      );
    });
  });

  it('does NOT call sendJudgeInvitation for non-closed status', async () => {
    vi.mocked(categoriesApi.categoriesApi.updateStatus).mockResolvedValue({
      id: 'cat-1',
      divisionId: 'div-1',
      name: 'Test Category',
      type: 'video',
      rules: null,
      description: null,
      deadline: '2026-12-31',
      status: 'published',
      createdAt: new Date().toISOString(),
      assignedJudgeId: null,
      invitedAt: null,
    });

    const { result } = renderHook(
      () => useUpdateCategoryStatus('contest-123'),
      { wrapper: createWrapper() }
    );

    await result.current.mutateAsync({
      categoryId: 'cat-1',
      status: 'published',
    });

    await waitFor(() => {
      expect(categoriesApi.categoriesApi.updateStatus).toHaveBeenCalled();
    });

    expect(categoriesApi.categoriesApi.sendJudgeInvitation).not.toHaveBeenCalled();
  });

  it('shows warning toast when closing category without judge (AC3)', async () => {
    vi.mocked(categoriesApi.categoriesApi.updateStatus).mockResolvedValue({
      id: 'cat-1',
      divisionId: 'div-1',
      name: 'Test Category',
      type: 'video',
      rules: null,
      description: null,
      deadline: '2026-12-31',
      status: 'closed',
      createdAt: new Date().toISOString(),
      assignedJudgeId: null,
      invitedAt: null,
    });
    vi.mocked(categoriesApi.categoriesApi.sendJudgeInvitation).mockResolvedValue({
      success: false,
      error: 'NO_JUDGE_ASSIGNED',
    });

    const { result } = renderHook(
      () => useUpdateCategoryStatus('contest-123'),
      { wrapper: createWrapper() }
    );

    await result.current.mutateAsync({
      categoryId: 'cat-1',
      status: 'closed',
    });

    // Get the toast mock from the module
    const { toast } = await import('@/components/ui');

    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith(
        'Category closed without judge assigned'
      );
    });
  });

  it('silently handles ALREADY_INVITED without showing toast (AC4)', async () => {
    vi.mocked(categoriesApi.categoriesApi.updateStatus).mockResolvedValue({
      id: 'cat-1',
      divisionId: 'div-1',
      name: 'Test Category',
      type: 'video',
      rules: null,
      description: null,
      deadline: '2026-12-31',
      status: 'closed',
      createdAt: new Date().toISOString(),
      assignedJudgeId: 'judge-1',
      invitedAt: '2026-01-01T00:00:00Z', // Already invited
    });
    vi.mocked(categoriesApi.categoriesApi.sendJudgeInvitation).mockResolvedValue({
      success: false,
      error: 'ALREADY_INVITED',
    });

    const { result } = renderHook(
      () => useUpdateCategoryStatus('contest-123'),
      { wrapper: createWrapper() }
    );

    await result.current.mutateAsync({
      categoryId: 'cat-1',
      status: 'closed',
    });

    // Get the toast mock from the module
    const { toast } = await import('@/components/ui');

    await waitFor(() => {
      expect(categoriesApi.categoriesApi.sendJudgeInvitation).toHaveBeenCalled();
    });

    // Should not show warning toast for ALREADY_INVITED
    expect(toast.warning).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('logs error but does not fail when sendJudgeInvitation fails (non-critical)', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(categoriesApi.categoriesApi.updateStatus).mockResolvedValue({
      id: 'cat-1',
      divisionId: 'div-1',
      name: 'Test Category',
      type: 'video',
      rules: null,
      description: null,
      deadline: '2026-12-31',
      status: 'closed',
      createdAt: new Date().toISOString(),
      assignedJudgeId: 'judge-1',
      invitedAt: null,
    });
    vi.mocked(categoriesApi.categoriesApi.sendJudgeInvitation).mockResolvedValue({
      success: false,
      error: 'BREVO_API_ERROR',
    });

    const { result } = renderHook(
      () => useUpdateCategoryStatus('contest-123'),
      { wrapper: createWrapper() }
    );

    // Should not throw even if email fails
    await expect(
      result.current.mutateAsync({
        categoryId: 'cat-1',
        status: 'closed',
      })
    ).resolves.toEqual({ success: true });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send invitation:',
        'BREVO_API_ERROR'
      );
    });

    consoleSpy.mockRestore();
  });
});
