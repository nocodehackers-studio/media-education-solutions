// ReviewProgress - Story 5.1 (AC2)
// Displays review progress bar with count and percentage

import { Progress } from '@/components/ui/progress';
import type { ReviewProgress as ReviewProgressType } from '../types/review.types';

interface ReviewProgressProps {
  progress: ReviewProgressType;
}

export function ReviewProgress({ progress }: ReviewProgressProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {progress.reviewed} of {progress.total} reviewed
        </span>
        <span className="text-muted-foreground">{progress.percentage}%</span>
      </div>
      <Progress value={progress.percentage} className="h-2" />
    </div>
  );
}
