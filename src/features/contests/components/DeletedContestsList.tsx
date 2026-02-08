import { useState } from 'react';
import { Trash2, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { Button, toast } from '@/components/ui';
import { useRestoreContest } from '../hooks/useRestoreContest';
import type { Contest } from '../types/contest.types';

interface DeletedContestsListProps {
  contests: Contest[];
}

function getDaysRemaining(deletedAt: string): number {
  const deleted = new Date(deletedAt);
  const purgeDate = new Date(deleted.getTime() + 90 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const remaining = Math.ceil((purgeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, remaining);
}

export function DeletedContestsList({ contests }: DeletedContestsListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const restoreContest = useRestoreContest();

  const handleRestore = async (id: string, name: string) => {
    try {
      await restoreContest.mutateAsync(id);
      toast.success(`"${name}" restored to drafts`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to restore contest'
      );
    }
  };

  if (contests.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <Trash2 className="h-4 w-4" />
        <span className="text-sm font-medium">
          Recently Deleted ({contests.length})
        </span>
      </button>

      {isExpanded && (
        <div className="space-y-2">
          {contests.map((contest) => {
            const daysRemaining = contest.deletedAt
              ? getDaysRemaining(contest.deletedAt)
              : 90;

            return (
              <div
                key={contest.id}
                className="flex items-center justify-between rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{contest.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Permanently deleted in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(contest.id, contest.name)}
                  disabled={restoreContest.isPending}
                  className="ml-4 shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Restore
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
