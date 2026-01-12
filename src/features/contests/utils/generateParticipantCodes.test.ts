import { describe, it, expect } from 'vitest';
import { generateParticipantCodes } from './generateParticipantCodes';

describe('generateParticipantCodes', () => {
  it('generates the correct number of codes', () => {
    const codes = generateParticipantCodes(10);
    expect(codes).toHaveLength(10);
  });

  it('generates 8-digit codes', () => {
    const codes = generateParticipantCodes(5);
    codes.forEach(code => {
      expect(code).toHaveLength(8);
      expect(code).toMatch(/^\d{8}$/);
    });
  });

  it('generates unique codes', () => {
    const codes = generateParticipantCodes(50);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(50);
  });

  it('generates codes without leading zeros', () => {
    const codes = generateParticipantCodes(20);
    codes.forEach(code => {
      // First digit should be 1-9 (no leading zeros)
      expect(parseInt(code[0])).toBeGreaterThanOrEqual(1);
      expect(parseInt(code[0])).toBeLessThanOrEqual(9);
    });
  });

  it('handles large batch generation (50 codes)', () => {
    const codes = generateParticipantCodes(50);
    expect(codes).toHaveLength(50);

    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(50);
  });

  it('generates numeric strings only', () => {
    const codes = generateParticipantCodes(10);
    codes.forEach(code => {
      expect(Number.isInteger(parseInt(code, 10))).toBe(true);
      expect(code).toMatch(/^\d+$/);
    });
  });
});
