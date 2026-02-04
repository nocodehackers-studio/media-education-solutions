import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@/components/ui';
import { useParticipantCodes } from '../hooks/useParticipantCodes';
import { CodeListTable } from './CodeListTable';
import { AddCodeDialog } from './AddCodeDialog';
import type { Contest } from '../types/contest.types';

interface CodesTabProps {
  contest: Contest;
}

/**
 * Tab content for managing participant codes
 * AC1 (Updated): Displays CodeListTable with Code, Organization, Status, Participant Name columns
 * AC3: Status filter (All, Used, Unused)
 * AC4 (Updated): Add Code button opens dialog for single code generation with organization name
 * AC5: Export button
 */
export function CodesTab({ contest }: CodesTabProps) {
  const [filter, setFilter] = useState<'all' | 'used' | 'unused'>('all');
  const { data: codes, isLoading, error } = useParticipantCodes(contest.id, filter);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[120px]" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-destructive">
        <p className="mb-2">Failed to load participant codes</p>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : 'An error occurred'}
        </p>
      </div>
    );
  }

  const allCodes = codes || [];
  const usedCount = allCodes.filter((c) => c.status === 'used').length;
  const unusedCount = allCodes.filter((c) => c.status === 'unused').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {allCodes.length} total &bull; {usedCount} used &bull; {unusedCount}{' '}
          unused
        </p>
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
          <AddCodeDialog contestId={contest.id} variant="default" />
        </div>
      </div>
      {allCodes.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">No codes yet</p>
        </div>
      ) : (
        <CodeListTable codes={allCodes} contestId={contest.id} />
      )}
    </div>
  );
}
