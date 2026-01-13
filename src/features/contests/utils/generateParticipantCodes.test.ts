import { describe, it, expect } from 'vitest';
import {
  generateParticipantCode,
  generateParticipantCodes,
} from './generateParticipantCodes';

describe('generateParticipantCode', () => {
  it('generates an 8-digit numeric code', () => {
    const code = generateParticipantCode();
    expect(code).toMatch(/^\d{8}$/);
    expect(code.length).toBe(8);
  });

  it('generates codes in valid range (no leading zeros)', () => {
    // Generate multiple codes to test range
    for (let i = 0; i < 100; i++) {
      const code = generateParticipantCode();
      const num = parseInt(code, 10);
      expect(num).toBeGreaterThanOrEqual(10000000);
      expect(num).toBeLessThanOrEqual(99999999);
    }
  });
});

describe('generateParticipantCodes', () => {
  it('generates the correct number of codes', () => {
    const codes = generateParticipantCodes(10);
    expect(codes).toHaveLength(10);
  });

  it('generates 8-digit codes', () => {
    const codes = generateParticipantCodes(5);
    codes.forEach((code) => {
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
    codes.forEach((code) => {
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
    codes.forEach((code) => {
      expect(Number.isInteger(parseInt(code, 10))).toBe(true);
      expect(code).toMatch(/^\d+$/);
    });
  });

  it('avoids existing codes when provided', () => {
    const existingCodes = new Set(['12345678', '87654321', '11111111']);
    const codes = generateParticipantCodes(50, existingCodes);

    // None of the new codes should be in the existing set
    codes.forEach((code) => {
      expect(existingCodes.has(code)).toBe(false);
    });
  });

  it('returns empty array when count is 0', () => {
    const codes = generateParticipantCodes(0);
    expect(codes).toHaveLength(0);
  });
});
