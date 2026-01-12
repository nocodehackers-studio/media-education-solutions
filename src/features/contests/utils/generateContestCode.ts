/**
 * Generates a unique 6-character alphanumeric contest code
 * Excludes confusing characters: 0, O, 1, I
 * @returns 6-character uppercase code
 */
export function generateContestCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing: 0, O, 1, I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
