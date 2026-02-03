// F3: API-layer test for FunctionsHttpError extraction in categoriesApi.assignJudge()
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase before importing categoriesApi
const mockInvoke = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockLimit = vi.fn();
const mockUpdateResult = vi.fn();
const mockRefreshSession = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: (...args: unknown[]) => {
        mockSelect(...args);
        return {
          eq: (...eqArgs: unknown[]) => {
            mockEq(...eqArgs);
            return {
              eq: (...eq2Args: unknown[]) => {
                mockEq(...eq2Args);
                return {
                  limit: () => mockLimit(),
                };
              },
            };
          },
        };
      },
      update: () => ({
        eq: () => mockUpdateResult(),
      }),
    }),
    auth: {
      refreshSession: () => mockRefreshSession(),
    },
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

vi.mock('@/lib/errorCodes', () => ({
  ERROR_CODES: {},
  getErrorMessage: (code: string) => code,
}));

vi.mock('../types/category.types', () => ({
  transformCategory: (row: unknown) => row,
}));

// Helper: simulate Supabase FunctionsHttpError (same pattern as useWithdrawSubmission.test.ts:32-45)
function mockHttpError(errorCode: string) {
  return {
    data: null,
    error: {
      name: 'FunctionsHttpError',
      message: 'Edge Function returned a non-2xx status code',
      context: new Response(JSON.stringify({ error: errorCode }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    },
  };
}

import { categoriesApi } from './categoriesApi';

const MOCK_TOKEN = 'fresh-access-token';

describe('categoriesApi.assignJudge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no existing judge found (empty result set from .limit(1))
    mockLimit.mockResolvedValue({ data: [], error: null });
    // Default: category update succeeds
    mockUpdateResult.mockReturnValue({ error: null });
    // Default: session refresh succeeds with valid session
    mockRefreshSession.mockResolvedValue({
      data: { session: { access_token: MOCK_TOKEN } },
      error: null,
    });
  });

  it('extracts ROLE_CONFLICT error code from FunctionsHttpError', async () => {
    mockInvoke.mockResolvedValueOnce(mockHttpError('ROLE_CONFLICT'));

    await expect(
      categoriesApi.assignJudge('cat-1', 'admin@example.com')
    ).rejects.toThrow('ROLE_CONFLICT');
  });

  it('extracts UNAUTHORIZED error code from FunctionsHttpError', async () => {
    mockInvoke.mockResolvedValueOnce(mockHttpError('UNAUTHORIZED'));

    await expect(
      categoriesApi.assignJudge('cat-1', 'test@example.com')
    ).rejects.toThrow('UNAUTHORIZED');
  });

  it('extracts FORBIDDEN error code from FunctionsHttpError', async () => {
    mockInvoke.mockResolvedValueOnce(mockHttpError('FORBIDDEN'));

    await expect(
      categoriesApi.assignJudge('cat-1', 'test@example.com')
    ).rejects.toThrow('FORBIDDEN');
  });

  it('extracts CREATE_FAILED error code from FunctionsHttpError', async () => {
    mockInvoke.mockResolvedValueOnce(mockHttpError('CREATE_FAILED'));

    await expect(
      categoriesApi.assignJudge('cat-1', 'test@example.com')
    ).rejects.toThrow('CREATE_FAILED');
  });

  it('falls back to JUDGE_ASSIGN_FAILED for non-parseable error', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: new Error('Network error'),
    });

    await expect(
      categoriesApi.assignJudge('cat-1', 'test@example.com')
    ).rejects.toThrow('JUDGE_ASSIGN_FAILED');
  });

  it('throws JUDGE_ASSIGN_FAILED when category update fails (F2)', async () => {
    // Edge function succeeds
    mockInvoke.mockResolvedValueOnce({
      data: { judgeId: 'judge-123', isExisting: false },
      error: null,
    });

    // Category update fails
    mockUpdateResult.mockReturnValueOnce({
      error: { message: 'violates row-level security policy', code: '42501' },
    });

    await expect(
      categoriesApi.assignJudge('cat-1', 'new@example.com')
    ).rejects.toThrow('JUDGE_ASSIGN_FAILED');
  });

  it('returns isNewJudge: false when existing judge found', async () => {
    // Existing judge found (array with one element from .limit(1))
    mockLimit.mockResolvedValueOnce({
      data: [{ id: 'judge-existing', email: 'judge@example.com' }],
      error: null,
    });

    const result = await categoriesApi.assignJudge(
      'cat-1',
      'judge@example.com'
    );

    expect(result.isNewJudge).toBe(false);
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('throws UNAUTHORIZED when session refresh fails', async () => {
    mockRefreshSession.mockResolvedValueOnce({
      data: { session: null },
      error: new Error('Refresh token expired'),
    });

    await expect(
      categoriesApi.assignJudge('cat-1', 'test@example.com')
    ).rejects.toThrow('UNAUTHORIZED');

    // Neither profiles query nor edge function should be called
    expect(mockLimit).not.toHaveBeenCalled();
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('throws UNAUTHORIZED when session refresh returns null session', async () => {
    // refreshSession() can return { session: null, error: null } — no error
    // but no valid session either
    mockRefreshSession.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    await expect(
      categoriesApi.assignJudge('cat-1', 'test@example.com')
    ).rejects.toThrow('UNAUTHORIZED');

    expect(mockLimit).not.toHaveBeenCalled();
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('returns isNewJudge: true when edge function creates new judge', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { judgeId: 'judge-new', isExisting: false },
      error: null,
    });

    const result = await categoriesApi.assignJudge(
      'cat-1',
      'newjudge@example.com'
    );

    expect(result.isNewJudge).toBe(true);
    expect(mockInvoke).toHaveBeenCalledWith('create-judge', {
      body: { email: 'newjudge@example.com' },
      headers: {
        Authorization: `Bearer ${MOCK_TOKEN}`,
      },
    });
  });

  it('passes fresh access token explicitly to edge function', async () => {
    const customToken = 'custom-fresh-token';
    mockRefreshSession.mockResolvedValueOnce({
      data: { session: { access_token: customToken } },
      error: null,
    });
    mockInvoke.mockResolvedValueOnce({
      data: { judgeId: 'judge-new', isExisting: false },
      error: null,
    });

    await categoriesApi.assignJudge('cat-1', 'new@example.com');

    expect(mockInvoke).toHaveBeenCalledWith('create-judge', {
      body: { email: 'new@example.com' },
      headers: {
        Authorization: `Bearer ${customToken}`,
      },
    });
  });
});
