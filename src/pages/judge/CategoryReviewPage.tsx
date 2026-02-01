// CategoryReviewPage - Story 5.1 (AC1, AC2, AC3, AC4, AC5)
// Shows all submissions in a category for judge review with progress tracking

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ClipboardList, Flag, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts';
import { useCategoriesByJudge, useMarkCategoryComplete } from '@/features/categories';
import {
  useSubmissionsForReview,
  useRankings,
  SubmissionCard,
  ReviewProgress,
  SubmissionFilter,
  type SubmissionFilterType,
} from '@/features/reviews';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
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

  // Rankings and completion state (Story 5-6)
  const { data: rankings } = useRankings(categoryId);
  const markComplete = useMarkCategoryComplete();

  const allReviewed = progress.pending === 0;
  const hasRankings = (rankings?.length ?? 0) >= 3;
  const isCompleted = !!category?.judgingCompletedAt;
  const canComplete = allReviewed && hasRankings && !isCompleted;

  const handleMarkComplete = () => {
    markComplete.mutate(categoryId!, {
      onSuccess: (result) => {
        if (result.success) {
          toast.success('Category marked as complete');
        } else {
          toast.error(result.error || 'Failed to mark category as complete');
        }
      },
      onError: () => {
        toast.error('Failed to mark category as complete');
      },
    });
  };

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

        {/* Read-only banner (Story 5-6) */}
        {isCompleted && (
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
            Read-only: Category completed on{' '}
            {new Date(category!.judgingCompletedAt!).toLocaleDateString()}
          </div>
        )}

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

        {/* Proceed to Ranking - Story 5.5 (AC1) */}
        {submissions && submissions.length > 0 && !isCompleted && (
          <div className="flex justify-center pt-2">
            <Button
              onClick={() => navigate(`/judge/categories/${categoryId}/ranking`)}
              disabled={progress.pending > 0}
              className="gap-2 w-full sm:w-auto"
            >
              <Trophy className="h-4 w-4" />
              Proceed to Ranking
            </Button>
            {progress.pending > 0 && (
              <p className="sr-only">Review all submissions before ranking</p>
            )}
          </div>
        )}

        {/* Mark as Complete section - Story 5-6 */}
        {isCompleted ? (
          <div className="flex items-center justify-center gap-2 text-green-600 py-4">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">
              Completed on {new Date(category!.judgingCompletedAt!).toLocaleDateString()}
            </span>
          </div>
        ) : submissions && submissions.length > 0 ? (
          <div className="flex flex-col items-center gap-2 pt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={!canComplete || markComplete.isPending}
                  variant="default"
                  className="gap-2 w-full sm:w-auto"
                >
                  <Flag className="h-4 w-4" />
                  {markComplete.isPending ? 'Marking...' : 'Mark as Complete'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Mark Category as Complete?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You reviewed {progress.total} submissions and ranked your top 3.
                    Once marked as complete, you will no longer be able to edit your
                    ratings, feedback, or rankings.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleMarkComplete}>
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {!allReviewed && (
              <p className="text-sm text-muted-foreground">Review all submissions before completing</p>
            )}
            {allReviewed && !hasRankings && (
              <p className="text-sm text-muted-foreground">Rank your top 3 before completing</p>
            )}
          </div>
        ) : null}
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
