// SubmissionReviewPage - Story 5.2 (AC1, AC2, AC3, AC4, AC5, AC6)
// Anonymous submission review page with media viewer, rating, feedback, and navigation

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts';
import {
  useSubmissionsForReview,
  useUpsertReview,
  MediaViewer,
  RatingDisplay,
} from '@/features/reviews';
import {
  Button,
  Textarea,
  Separator,
  Skeleton,
} from '@/components/ui';

export function SubmissionReviewPage() {
  const { categoryId, submissionId } = useParams<{
    categoryId: string;
    submissionId: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch submissions (cached from CategoryReviewPage)
  const { data: submissions, isLoading } = useSubmissionsForReview(categoryId);
  const { mutateAsync: saveReview, isPending: isSaving } = useUpsertReview(categoryId);

  // Find current submission and compute navigation
  const currentIndex = useMemo(
    () => submissions?.findIndex((s) => s.id === submissionId) ?? -1,
    [submissions, submissionId]
  );
  const currentSubmission = submissions?.[currentIndex] ?? null;
  const prevSubmission = currentIndex > 0 ? submissions?.[currentIndex - 1] ?? null : null;
  const nextSubmission =
    submissions && currentIndex < submissions.length - 1
      ? submissions[currentIndex + 1] ?? null
      : null;
  const isLast = submissions ? currentIndex === submissions.length - 1 : false;

  // Local state for rating and feedback, synced to current submission
  const [localRating, setLocalRating] = useState<number | null>(null);
  const [localFeedback, setLocalFeedback] = useState('');
  const [syncedSubmissionId, setSyncedSubmissionId] = useState<string | null>(null);

  // Reset local state when submission changes (React-recommended pattern:
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders)
  if (currentSubmission && currentSubmission.id !== syncedSubmissionId) {
    setSyncedSubmissionId(currentSubmission.id);
    setLocalRating(currentSubmission.rating ?? null);
    setLocalFeedback(currentSubmission.feedback ?? '');
  }

  // Track dirty state
  const isDirty = useMemo(() => {
    if (!currentSubmission) return false;
    const savedRating = currentSubmission.rating ?? null;
    const savedFeedback = currentSubmission.feedback ?? '';
    return localRating !== savedRating || localFeedback !== savedFeedback;
  }, [localRating, localFeedback, currentSubmission]);

  // Auto-save and navigate
  const handleNavigate = useCallback(
    async (targetSubmissionId: string) => {
      if (isDirty && currentSubmission && user) {
        await saveReview({
          submissionId: currentSubmission.id,
          rating: localRating,
          feedback: localFeedback,
        });
      }
      navigate(`/judge/categories/${categoryId}/review/${targetSubmissionId}`);
    },
    [isDirty, currentSubmission, user, saveReview, localRating, localFeedback, navigate, categoryId]
  );

  // Keyboard navigation (AC6)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return;

      if (e.key === 'ArrowLeft' && prevSubmission) {
        e.preventDefault();
        handleNavigate(prevSubmission.id);
      } else if (e.key === 'ArrowRight' && nextSubmission) {
        e.preventDefault();
        handleNavigate(nextSubmission.id);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [prevSubmission, nextSubmission, handleNavigate]);

  // Loading state
  if (isLoading) {
    return <PageSkeleton />;
  }

  // Submission not found — redirect to category page
  if (!currentSubmission || currentIndex === -1) {
    navigate(`/judge/categories/${categoryId}`, { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(`/judge/categories/${categoryId}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Category
          </Button>
          <span className="text-sm text-muted-foreground">
            Submission {currentIndex + 1} of {submissions!.length}
          </span>
        </div>

        {/* Participant code */}
        <div>
          <p className="text-lg font-semibold">{currentSubmission.participantCode}</p>
        </div>

        <Separator />

        {/* Media viewer */}
        <MediaViewer
          mediaType={currentSubmission.mediaType}
          mediaUrl={currentSubmission.mediaUrl}
          participantCode={currentSubmission.participantCode}
        />

        <Separator />

        {/* Rating */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Rating</label>
          <RatingDisplay value={localRating} onChange={setLocalRating} />
        </div>

        <Separator />

        {/* Feedback */}
        <div className="space-y-2">
          <label htmlFor="feedback" className="text-sm font-medium">
            Feedback
          </label>
          <Textarea
            id="feedback"
            value={localFeedback}
            onChange={(e) => setLocalFeedback(e.target.value)}
            placeholder="Provide constructive feedback for the participant... (optional)"
            rows={4}
          />
        </div>

        <Separator />

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={!prevSubmission || isSaving}
            onClick={() => prevSubmission && handleNavigate(prevSubmission.id)}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="text-center">
            {isLast && (
              <p className="text-sm text-muted-foreground">
                You've reached the last submission
              </p>
            )}
          </div>
          <Button
            variant="outline"
            disabled={!nextSubmission || isSaving}
            onClick={() => nextSubmission && handleNavigate(nextSubmission.id)}
            className="gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-px w-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  );
}
