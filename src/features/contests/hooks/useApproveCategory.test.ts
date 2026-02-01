import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, createElement } from 'react';
import { useApproveCategory, useUnapproveCategory } from './useApproveCategory';

vi.mock('../api/winnersApi', () => ({
  winnersApi: {
    approveCategory: vi.fn(),
    unapproveCategory: vi.fn(),
  },
}));

import { winnersApi } from '../api/winnersApi';

const mockApprove = vi.mocked(winnersApi.approveCategory);
const mockUnapprove = vi.mocked(winnersApi.unapproveCategory);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useApproveCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls winnersApi.approveCategory on mutate', async () => {
    mockApprove.mockResolvedValue(undefined);
    const { result } = renderHook(() => useApproveCategory(), { wrapper: createWrapper() });

    result.current.mutate('cat-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApprove).toHaveBeenCalledWith('cat-1');
  });

  it('handles approve error', async () => {
    mockApprove.mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useApproveCategory(), { wrapper: createWrapper() });

    result.current.mutate('cat-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useUnapproveCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls winnersApi.unapproveCategory on mutate', async () => {
    mockUnapprove.mockResolvedValue(undefined);
    const { result } = renderHook(() => useUnapproveCategory(), { wrapper: createWrapper() });

    result.current.mutate('cat-2');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockUnapprove).toHaveBeenCalledWith('cat-2');
  });
});
