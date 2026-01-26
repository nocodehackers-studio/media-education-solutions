// Story 3-5: JudgesTab component (AC1)
// Main tab content for judge progress in ContestDetailPage

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-destructive">Failed to load judge data</p>
        </CardContent>
      </Card>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Judge Assignments</CardTitle>
          <CardDescription>
            Track judging progress across all categories
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No categories in this contest yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Judge Assignments</CardTitle>
        <CardDescription>
          Track judging progress across all categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <JudgesTable categories={categories} />
      </CardContent>
    </Card>
  );
}

function JudgesTabSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
