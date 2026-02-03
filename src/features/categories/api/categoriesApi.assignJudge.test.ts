// F3: API-layer test for FunctionsHttpError extraction in categoriesApi.assignJudge()
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase before importing categoriesApi
const mockInvoke = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockUpdateResult = vi.fn();

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
                  single: () => mockSingle(),
                };
              },
              single: () => mockSingle(),
            };
          },
        };
      },
      update: () => ({
        eq: () => mockUpdateResult(),
      }),
    }),
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

describe('categoriesApi.assignJudge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no existing judge found (PGRST116 = no rows)
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'not found' },
    });
    // Default: category update succeeds
    mockUpdateResult.mockReturnValue({ error: null });
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
    // Existing judge found
    mockSingle.mockResolvedValueOnce({
      data: { id: 'judge-existing', email: 'judge@example.com' },
      error: null,
    });

    const result = await categoriesApi.assignJudge(
      'cat-1',
      'judge@example.com'
    );

    expect(result.isNewJudge).toBe(false);
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
    });
  });
});
