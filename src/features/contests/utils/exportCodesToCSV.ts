import type { Participant } from '../types/contest.types';

/**
 * Exports participant codes to CSV file
 * @param codes Array of participant codes
 * @param contestCode Contest code for filename
 */
export function exportCodesToCSV(codes: Participant[], contestCode: string): void {
  // Build CSV content
  const headers = ['Code', 'Status'];
  const rows = codes.map((p) => [p.code, p.status]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join(
    '\n'
  );

  // Create download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${contestCode}_participant_codes.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
