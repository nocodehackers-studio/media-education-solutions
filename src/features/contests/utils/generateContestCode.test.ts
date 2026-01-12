import { describe, it, expect } from 'vitest';
import { generateContestCode } from './generateContestCode';

describe('generateContestCode', () => {
  it('generates a 6-character code', () => {
    const code = generateContestCode();
    expect(code).toHaveLength(6);
  });

  it('generates alphanumeric characters only', () => {
    const code = generateContestCode();
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  it('excludes confusing characters (0, O, 1, I)', () => {
    // Generate many codes to test randomness
    for (let i = 0; i < 100; i++) {
      const code = generateContestCode();
      expect(code).not.toMatch(/[01OI]/);
    }
  });

  it('generates valid codes on repeated calls', () => {
    // Test deterministic properties: each call returns a valid 6-char code
    // Uniqueness is not guaranteed by the function contract (handled by DB constraint)
    for (let i = 0; i < 10; i++) {
      const code = generateContestCode();
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
    }
  });

  it('uses only allowed character set', () => {
    const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const code = generateContestCode();

    for (const char of code) {
      expect(allowedChars).toContain(char);
    }
  });
});
