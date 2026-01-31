/**
 * Review types unit tests - Story 5.1
 * Tests getRatingTier function edge cases
 */
import { describe, it, expect } from 'vitest';
import { getRatingTier } from './review.types';

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
