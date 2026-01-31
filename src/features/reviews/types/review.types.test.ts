/**
 * Review types unit tests - Story 5.1 + Story 5.5
 * Tests getRatingTier, transformRanking, and validateRankingOrder functions
 */
import { describe, it, expect } from 'vitest';
import { getRatingTier, transformRanking, validateRankingOrder } from './review.types';
import type { SubmissionForReview, RankingRow } from './review.types';

describe('getRatingTier', () => {
  it('returns correct tier for boundary value 1', () => {
    const tier = getRatingTier(1);
    expect(tier?.tier).toBe(1);
    expect(tier?.label).toBe('Developing Skills');
  });

  it('returns correct tier for boundary value 2', () => {
    const tier = getRatingTier(2);
    expect(tier?.tier).toBe(1);
    expect(tier?.label).toBe('Developing Skills');
  });

  it('returns correct tier for value 5', () => {
    const tier = getRatingTier(5);
    expect(tier?.tier).toBe(3);
    expect(tier?.label).toBe('Proficient Creator');
  });

  it('returns correct tier for boundary value 9', () => {
    const tier = getRatingTier(9);
    expect(tier?.tier).toBe(5);
    expect(tier?.label).toBe('Master Creator');
  });

  it('returns correct tier for boundary value 10', () => {
    const tier = getRatingTier(10);
    expect(tier?.tier).toBe(5);
    expect(tier?.label).toBe('Master Creator');
  });

  it('returns null for value 0 (out of range)', () => {
    expect(getRatingTier(0)).toBeNull();
  });

  it('returns null for value 11 (out of range)', () => {
    expect(getRatingTier(11)).toBeNull();
  });

  it('returns null for negative value', () => {
    expect(getRatingTier(-1)).toBeNull();
  });

  it('returns null for NaN', () => {
    expect(getRatingTier(NaN)).toBeNull();
  });

  it('returns null for Infinity', () => {
    expect(getRatingTier(Infinity)).toBeNull();
  });
});

// Story 5.5: Ranking types tests
describe('transformRanking', () => {
  it('transforms snake_case ranking to camelCase', () => {
    const row: RankingRow = {
      id: 'rank-1',
      category_id: 'cat-1',
      judge_id: 'judge-1',
      rank: 1,
      submission_id: 'sub-1',
      created_at: '2026-01-15T00:00:00Z',
      updated_at: '2026-01-15T00:00:00Z',
    };

    const result = transformRanking(row);
    expect(result.id).toBe('rank-1');
    expect(result.categoryId).toBe('cat-1');
    expect(result.judgeId).toBe('judge-1');
    expect(result.rank).toBe(1);
    expect(result.submissionId).toBe('sub-1');
    expect(result.createdAt).toBe('2026-01-15T00:00:00Z');
  });
});

describe('validateRankingOrder', () => {
  const makeSub = (id: string, rating: number | null): SubmissionForReview => ({
    id,
    mediaType: 'photo',
    mediaUrl: null,
    thumbnailUrl: null,
    bunnyVideoId: null,
    status: 'submitted',
    submittedAt: '2026-01-15T00:00:00Z',
    participantCode: id,
    reviewId: 'rev-1',
    rating,
    feedback: null,
  });

  it('returns true for valid descending order', () => {
    expect(validateRankingOrder([makeSub('a', 9), makeSub('b', 7), makeSub('c', 5)])).toBe(true);
  });

  it('returns true for equal ratings in any order', () => {
    expect(validateRankingOrder([makeSub('a', 8), makeSub('b', 8), makeSub('c', 8)])).toBe(true);
  });

  it('returns false when lower-rated is ranked above higher-rated', () => {
    expect(validateRankingOrder([makeSub('a', 5), makeSub('b', 9), makeSub('c', 3)])).toBe(false);
  });

  it('returns true with null entries (empty slots)', () => {
    expect(validateRankingOrder([makeSub('a', 9), null, makeSub('c', 5)])).toBe(true);
  });

  it('returns true for all null entries', () => {
    expect(validateRankingOrder([null, null, null])).toBe(true);
  });

  it('allows null ratings on submissions without blocking', () => {
    expect(validateRankingOrder([makeSub('a', null), makeSub('b', 5), makeSub('c', 3)])).toBe(true);
  });

  it('returns true when only one position filled', () => {
    expect(validateRankingOrder([makeSub('a', 5), null, null])).toBe(true);
  });

  it('returns false when 2nd place has higher rating than 1st', () => {
    expect(validateRankingOrder([makeSub('a', 3), makeSub('b', 7), null])).toBe(false);
  });

  it('returns false when 3rd place has higher rating than 2nd', () => {
    expect(validateRankingOrder([makeSub('a', 9), makeSub('b', 3), makeSub('c', 7)])).toBe(false);
  });
});
