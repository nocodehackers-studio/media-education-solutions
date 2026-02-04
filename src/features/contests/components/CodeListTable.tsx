import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
} from '@/components/ui';
import type { Participant } from '../types/contest.types';

interface CodeListTableProps {
  codes: Participant[];
}

/**
 * Table displaying participant codes with organization and status.
 * Codes represent institutions, not individuals.
 */
export function CodeListTable({ codes }: CodeListTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Organization</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {codes.map((code) => (
          <TableRow key={code.id}>
            <TableCell className="font-mono">{code.code}</TableCell>
            <TableCell>{code.organizationName || '-'}</TableCell>
            <TableCell>
              <Badge variant={code.status === 'used' ? 'default' : 'outline'}>
                {code.status === 'used' ? 'Used' : 'Unused'}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
