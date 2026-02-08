import { describe, it, expect } from 'vitest';
import { isAtLeastOneMinuteFromNow } from './dateUtils';

describe('isAtLeastOneMinuteFromNow', () => {
  it('returns true for a date 2 minutes from now', () => {
    const twoMinutesFromNow = new Date(Date.now() + 2 * 60_000).toISOString();
    expect(isAtLeastOneMinuteFromNow(twoMinutesFromNow)).toBe(true);
  });

  it('returns true for a date exactly 1 minute from now', () => {
    const oneMinuteFromNow = new Date(Date.now() + 60_000).toISOString();
    expect(isAtLeastOneMinuteFromNow(oneMinuteFromNow)).toBe(true);
  });

  it('returns false for a date 30 seconds from now', () => {
    const thirtySecondsFromNow = new Date(Date.now() + 30_000).toISOString();
    expect(isAtLeastOneMinuteFromNow(thirtySecondsFromNow)).toBe(false);
  });

  it('returns false for a date in the past', () => {
    const pastDate = new Date(Date.now() - 60_000).toISOString();
    expect(isAtLeastOneMinuteFromNow(pastDate)).toBe(false);
  });

  it('returns true for a date far in the future', () => {
    const futureDate = new Date('2030-01-01T00:00:00Z').toISOString();
    expect(isAtLeastOneMinuteFromNow(futureDate)).toBe(true);
  });

  it('returns false for invalid date string', () => {
    expect(isAtLeastOneMinuteFromNow('not-a-date')).toBe(false);
  });
});
