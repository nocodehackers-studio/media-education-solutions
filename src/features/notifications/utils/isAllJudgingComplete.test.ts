import { describe, it, expect } from 'vitest';
import { isAllJudgingComplete } from './isAllJudgingComplete';

describe('isAllJudgingComplete', () => {
  it('returns true when all categories have judging_completed_at set', () => {
    const categories = [
      { judging_completed_at: '2026-02-01T10:00:00Z' },
      { judging_completed_at: '2026-02-01T11:00:00Z' },
      { judging_completed_at: '2026-02-01T12:00:00Z' },
    ];
    expect(isAllJudgingComplete(categories)).toBe(true);
  });

  it('returns false when some categories are incomplete', () => {
    const categories = [
      { judging_completed_at: '2026-02-01T10:00:00Z' },
      { judging_completed_at: null },
      { judging_completed_at: '2026-02-01T12:00:00Z' },
    ];
    expect(isAllJudgingComplete(categories)).toBe(false);
  });

  it('returns false when no categories have judging_completed_at', () => {
    const categories = [
      { judging_completed_at: null },
      { judging_completed_at: null },
    ];
    expect(isAllJudgingComplete(categories)).toBe(false);
  });

  it('returns false for empty array', () => {
    expect(isAllJudgingComplete([])).toBe(false);
  });

  it('returns false for null/undefined input', () => {
    expect(isAllJudgingComplete(null)).toBe(false);
    expect(isAllJudgingComplete(undefined)).toBe(false);
  });
});
