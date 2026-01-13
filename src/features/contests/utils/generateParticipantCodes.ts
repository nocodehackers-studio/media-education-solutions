/**
 * Generates a single unique 8-digit participant code
 * Range: 10000000 - 99999999 (8 digits, no leading zeros)
 * @returns 8-digit numeric string
 */
export function generateParticipantCode(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

/**
 * Generates unique 8-digit participant codes
 * Ensures no duplicates in the batch or with existing codes
 * Range: 10000000 - 99999999 (8 digits, no leading zeros)
 * @param count Number of codes to generate
 * @param existingCodes Set of existing codes to avoid duplicates (optional)
 * @returns Array of unique 8-digit code strings
 */
export function generateParticipantCodes(
  count: number,
  existingCodes: Set<string> = new Set()
): string[] {
  const codes: string[] = [];
  const allCodes = new Set(existingCodes);

  while (codes.length < count) {
    const code = generateParticipantCode();
    if (!allCodes.has(code)) {
      allCodes.add(code);
      codes.push(code);
    }
  }

  return codes;
}
