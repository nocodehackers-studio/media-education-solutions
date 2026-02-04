// Story 3-5: JudgesTab component (AC1)
// Main tab content for judge progress in ContestDetailPage

import {
  Skeleton,
} from '@/components/ui';
import { useCategories } from '../hooks/useCategories';
import { JudgesTable } from './JudgesTable';

interface JudgesTabProps {
  contestId: string;
}

export function JudgesTab({ contestId }: JudgesTabProps) {
  const { data: categories, isLoading, error } = useCategories(contestId);

  if (isLoading) {
    return <JudgesTabSkeleton />;
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-destructive">Failed to load judge data</p>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Track judging progress across all categories
        </p>
        <div className="py-8 text-center">
          <p className="text-muted-foreground">No categories in this contest yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Track judging progress across all categories
      </p>
      <JudgesTable categories={categories} contestId={contestId} />
    </div>
  );
}

function JudgesTabSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-64" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
