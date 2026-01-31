// CategoryReviewPage - Story 5.1 (AC1, AC2, AC3, AC4, AC5)
// Shows all submissions in a category for judge review with progress tracking

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { useAuth } from '@/contexts';
import { useCategoriesByJudge } from '@/features/categories';
import {
  useSubmissionsForReview,
  SubmissionCard,
  ReviewProgress,
  SubmissionFilter,
  type SubmissionFilterType,
} from '@/features/reviews';
import {
  Button,
  Card,
  CardContent,
  Skeleton,
} from '@/components/ui';

export function CategoryReviewPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState<SubmissionFilterType>('all');

  // Fetch submissions for review
  const {
    data: submissions,
    isLoading: submissionsLoading,
    error: submissionsError,
    refetch,
    progress,
  } = useSubmissionsForReview(categoryId);

  // Get category context from cached dashboard data
  const { data: categories } = useCategoriesByJudge(user?.id);
  const category = categories?.find((c) => c.id === categoryId);

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    if (!submissions) return [];
    switch (filter) {
      case 'pending':
        return submissions.filter((s) => s.reviewId === null);
      case 'reviewed':
        return submissions.filter((s) => s.reviewId !== null);
      default:
        return submissions;
    }
  }, [submissions, filter]);

  // Loading state
  if (submissionsLoading) {
    return <PageSkeleton />;
  }

  // Error state
  if (submissionsError) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/judge/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-destructive font-medium mb-2">
                Failed to load submissions
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {submissionsError.message || 'An unexpected error occurred'}
              </p>
              <Button onClick={() => refetch()}>Try Again</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/judge/dashboard')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Category header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {category?.name ?? 'Category'}
          </h1>
          {category && (
            <p className="text-muted-foreground">
              {category.contestName} &bull; {category.divisionName}
            </p>
          )}
        </div>

        {/* Progress */}
        <ReviewProgress progress={progress} />

        {/* Filter + count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''}
          </p>
          <SubmissionFilter value={filter} onChange={setFilter} />
        </div>

        {/* Submissions grid */}
        {filteredSubmissions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                {submissions?.length === 0
                  ? 'No submissions in this category yet'
                  : 'No submissions match the current filter'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {filteredSubmissions.map((submission) => (
              <SubmissionCard key={submission.id} submission={submission} categoryId={categoryId!} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-9 w-40" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-[140px]" />
        </div>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-[4/3]" />
          ))}
        </div>
      </div>
    </div>
  );
}
