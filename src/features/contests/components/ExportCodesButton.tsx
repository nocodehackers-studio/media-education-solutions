import { Button } from '@/components/ui';
import { exportCodesToCSV } from '../utils/exportCodesToCSV';
import type { Participant } from '../types/contest.types';

interface ExportCodesButtonProps {
  codes: Participant[];
  contestCode: string;
}

/**
 * Button to export participant codes to CSV
 * AC5: Downloads CSV with Code, Status columns; filename is "{contest_code}_participant_codes.csv"
 */
export function ExportCodesButton({ codes, contestCode }: ExportCodesButtonProps) {
  const handleExport = () => {
    exportCodesToCSV(codes, contestCode);
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={codes.length === 0}>
      Export
    </Button>
  );
}
