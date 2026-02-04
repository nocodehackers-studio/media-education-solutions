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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[120px]" />
            <Skeleton className="h-10 w-36" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
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
          <AddCodeDialog contestId={contest.id} variant="default" />
        </div>
      </CardHeader>
      <CardContent>
        {allCodes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No codes yet</p>
            <AddCodeDialog contestId={contest.id} variant="default" />
          </div>
        ) : (
          <CodeListTable codes={allCodes} />
        )}
      </CardContent>
    </Card>
  );
}
