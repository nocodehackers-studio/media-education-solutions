import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { useParticipantCodes } from '../hooks/useParticipantCodes';
import { CodeListTable } from './CodeListTable';
import { GenerateCodesButton } from './GenerateCodesButton';
import { ExportCodesButton } from './ExportCodesButton';
import type { Contest } from '../types/contest.types';

interface CodesTabProps {
  contest: Contest;
}

/**
 * Tab content for managing participant codes
 * AC1: Displays CodeListTable with all codes
 * AC3: Status filter (All, Used, Unused)
 * AC4: Generate 50 More button
 * AC5: Export button
 */
export function CodesTab({ contest }: CodesTabProps) {
  const [filter, setFilter] = useState<'all' | 'used' | 'unused'>('all');
  const { data: codes, isLoading, error } = useParticipantCodes(contest.id, filter);

  if (isLoading) {
    return <div>Loading codes...</div>;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-destructive">
            <p className="mb-2">Failed to load participant codes</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'An error occurred'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const allCodes = codes || [];
  const usedCount = allCodes.filter((c) => c.status === 'used').length;
  const unusedCount = allCodes.filter((c) => c.status === 'unused').length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Participant Codes</CardTitle>
          <p className="text-sm text-muted-foreground">
            {allCodes.length} total &bull; {usedCount} used &bull; {unusedCount}{' '}
            unused
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as typeof filter)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unused">Unused</SelectItem>
              <SelectItem value="used">Used</SelectItem>
            </SelectContent>
          </Select>
          <ExportCodesButton codes={allCodes} contestCode={contest.contestCode} />
          <GenerateCodesButton contestId={contest.id} />
        </div>
      </CardHeader>
      <CardContent>
        {allCodes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No codes yet</p>
            <GenerateCodesButton contestId={contest.id} variant="default" />
          </div>
        ) : (
          <CodeListTable codes={allCodes} />
        )}
      </CardContent>
    </Card>
  );
}
