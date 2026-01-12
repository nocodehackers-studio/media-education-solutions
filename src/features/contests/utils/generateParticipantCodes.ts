/**
 * Generates unique 8-digit participant codes
 * Ensures no duplicates in the batch
 * Range: 10000000 - 99999999 (8 digits, no leading zeros)
 * @param count Number of codes to generate
 * @returns Array of unique 8-digit code strings
 */
export function generateParticipantCodes(count: number): string[] {
  const codes: Set<string> = new Set();

  while (codes.size < count) {
    // Generate random 8-digit number (10000000 to 99999999)
    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    codes.add(code);
  }

  return Array.from(codes);
}
