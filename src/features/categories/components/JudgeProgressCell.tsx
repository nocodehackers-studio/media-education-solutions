// Story 3-5: JudgeProgressCell component
// Displays review progress with progress bar (AC2) and complete state (AC3)

import { CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui';
import { useJudgeProgress } from '../hooks/useJudgeProgress';

interface JudgeProgressCellProps {
  categoryId: string;
}

export function JudgeProgressCell({ categoryId }: JudgeProgressCellProps) {
  const { data: progress, isLoading } = useJudgeProgress(categoryId);

  if (isLoading) {
    return <Skeleton className="h-4 w-24" />;
  }

  // Handle case where submissions table doesn't exist yet or no data
  if (!progress) {
    return <span className="text-sm text-muted-foreground">Awaiting judging</span>;
  }

  const { reviewed, total } = progress;
  const percentage = total > 0 ? (reviewed / total) * 100 : 0;
  const isComplete = reviewed === total && total > 0;

  // Complete state (AC3)
  if (isComplete) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Complete</span>
      </div>
    );
  }

  // No submissions yet
  if (total === 0) {
    return <span className="text-sm text-muted-foreground">No submissions</span>;
  }

  // Progress bar (AC2)
  return (
    <div className="flex items-center gap-3 min-w-[140px]">
      <div
        className="flex-1 h-2 bg-muted rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Review progress: ${reviewed} of ${total} reviewed`}
      >
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {reviewed} / {total}
      </span>
    </div>
  );
}
