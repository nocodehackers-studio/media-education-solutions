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
 * Table displaying participant codes with status and participant name
 * AC1: Shows Code, Status, Participant Name columns
 * AC2: Used codes show participant name, unused show "-"
 */
export function CodeListTable({ codes }: CodeListTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Participant Name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {codes.map((code) => (
          <TableRow key={code.id}>
            <TableCell className="font-mono">{code.code}</TableCell>
            <TableCell>
              <Badge variant={code.status === 'used' ? 'default' : 'secondary'}>
                {code.status === 'used' ? 'Used' : 'Unused'}
              </Badge>
            </TableCell>
            <TableCell>
              {code.status === 'used' ? code.name || 'Unknown' : '-'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
