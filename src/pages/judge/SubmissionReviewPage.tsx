// SubmissionReviewPage - Story 5.2, Story 5.4
// Anonymous submission review page with media viewer, rating, feedback,
// auto-save (debounced feedback, immediate rating), validation, and Save & Next

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts';
import { useCategoriesByJudge } from '@/features/categories';
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

  // Category completion state (Story 5-6)
  const { data: categories } = useCategoriesByJudge(user?.id);
  const category = categories?.find((c) => c.id === categoryId);
  const isReadOnly = !!category?.judgingCompletedAt;

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

  // Next unreviewed submission (AC6: Save & Next goes to next unreviewed)
  const nextUnreviewed = useMemo(() => {
    if (!submissions || currentIndex < 0) return null;
    for (let i = currentIndex + 1; i < submissions.length; i++) {
      if (submissions[i].reviewId === null) return submissions[i];
    }
    return nextSubmission;
  }, [submissions, currentIndex, nextSubmission]);

  // Local state for rating and feedback, synced to current submission
  const [localRating, setLocalRating] = useState<number | null>(null);
  const [localFeedback, setLocalFeedback] = useState('');
  // Refs to avoid stale closures in debounced/delayed callbacks (F1 fix)
  const localRatingRef = useRef<number | null>(null);
  const localFeedbackRef = useRef('');
  const [syncedSubmissionId, setSyncedSubmissionId] = useState<string | null>(null);

  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const savingRef = useRef(false);
  const queuedSaveRef = useRef<{ rating: number | null; feedback: string } | null>(null);

  // Rating validation state (AC7)
  const [ratingWarning, setRatingWarning] = useState(false);

  // Reset local state when submission changes
  if (currentSubmission && currentSubmission.id !== syncedSubmissionId) {
    const rating = currentSubmission.rating ?? null;
    const feedback = currentSubmission.feedback ?? '';
    setSyncedSubmissionId(currentSubmission.id);
    setLocalRating(rating);
    setLocalFeedback(feedback);
    localRatingRef.current = rating;
    localFeedbackRef.current = feedback;
    setSaveStatus('idle');
    setRatingWarning(false);
  }

  // Track dirty state
  const isDirty = useMemo(() => {
    if (!currentSubmission) return false;
    const savedRating = currentSubmission.rating ?? null;
    const savedFeedback = currentSubmission.feedback ?? '';
    return localRating !== savedRating || localFeedback !== savedFeedback;
  }, [localRating, localFeedback, currentSubmission]);

  // Clear rating warning when rating is selected (AC7)
  useEffect(() => {
    if (localRating !== null) setRatingWarning(false);
  }, [localRating]);

  // Cleanup timers on unmount or submission change
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, [syncedSubmissionId]);

  // Core save function (Task 2/3, F2+F3 fix: error handling + queue-only-on-success)
  const performSave = useCallback(async (rating: number | null, feedback: string) => {
    if (!currentSubmission || !user) return;
    if (savingRef.current) {
      queuedSaveRef.current = { rating, feedback };
      return;
    }
    savingRef.current = true;
    setSaveStatus('saving');
    let succeeded = false;
    try {
      await saveReview({
        submissionId: currentSubmission.id,
        rating,
        feedback,
      });
      setSaveStatus('saved');
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
      succeeded = true;
    } catch {
      setSaveStatus('idle');
      queuedSaveRef.current = null;
    } finally {
      savingRef.current = false;
    }
    if (succeeded && queuedSaveRef.current) {
      const queued = queuedSaveRef.current;
      queuedSaveRef.current = null;
      performSave(queued.rating, queued.feedback);
    }
  }, [currentSubmission, user, saveReview]);

  // Debounced feedback auto-save (Task 2: AC4, AC5; F1 fix: read rating from ref)
  const handleFeedbackChange = useCallback((value: string) => {
    setLocalFeedback(value);
    localFeedbackRef.current = value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSave(localRatingRef.current, value);
    }, 1500);
  }, [performSave]);

  // On feedback blur: save immediately (Task 2: AC5; F1 fix: read from refs)
  const handleFeedbackBlur = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (isDirty) performSave(localRatingRef.current, localFeedbackRef.current);
  }, [isDirty, performSave]);

  // Rating change: immediate save (Task 3: AC2, AC3; F1 fix: read feedback from ref)
  const handleRatingChange = useCallback((rating: number) => {
    setLocalRating(rating);
    localRatingRef.current = rating;
    performSave(rating, localFeedbackRef.current);
  }, [performSave]);

  // Forward navigation with rating validation (Task 4: AC6, AC7; F4 fix: cancel debounce)
  const handleNavigateNext = useCallback(
    async (targetSubmissionId: string) => {
      if (localRating === null) {
        setRatingWarning(true);
        return;
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (isDirty && currentSubmission && user) {
        await saveReview({
          submissionId: currentSubmission.id,
          rating: localRating,
          feedback: localFeedback,
        });
      }
      navigate(`/judge/categories/${categoryId}/review/${targetSubmissionId}`);
    },
    [localRating, isDirty, currentSubmission, user, saveReview, localFeedback, navigate, categoryId]
  );

  // Backward navigation — no rating required (Task 4: AC7; F4 fix: cancel debounce)
  const handleNavigatePrev = useCallback(
    async (targetSubmissionId: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
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

  // Keyboard navigation (AC6, AC7)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return;

      if (e.key === 'ArrowLeft' && prevSubmission) {
        e.preventDefault();
        handleNavigatePrev(prevSubmission.id);
      } else if (e.key === 'ArrowRight' && nextSubmission) {
        e.preventDefault();
        handleNavigateNext(nextSubmission.id);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [prevSubmission, nextSubmission, handleNavigateNext, handleNavigatePrev]);

  // Redirect if submission not found after loading (F6 fix: useEffect, not render)
  const shouldRedirect = !isLoading && (!currentSubmission || currentIndex === -1);
  useEffect(() => {
    if (shouldRedirect) {
      navigate(`/judge/categories/${categoryId}`, { replace: true });
    }
  }, [shouldRedirect, navigate, categoryId]);

  // Loading state
  if (isLoading) {
    return <PageSkeleton />;
  }

  // Submission not found — show nothing while redirect fires
  if (shouldRedirect || !currentSubmission) {
    return null;
  }

  // Determine Save & Next target
  const saveNextTarget = nextUnreviewed ?? nextSubmission;

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

        {/* Read-only banner (Story 5-6) */}
        {isReadOnly && (
          <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
            <CheckCircle2 className="h-4 w-4" />
            Read-only: Category completed
          </div>
        )}

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
          <RatingDisplay value={localRating} onChange={isReadOnly ? undefined : handleRatingChange} />
          {ratingWarning && !isReadOnly && (
            <p className="text-sm text-destructive">Please select a rating before continuing</p>
          )}
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
            onChange={isReadOnly ? undefined : (e) => handleFeedbackChange(e.target.value)}
            onBlur={isReadOnly ? undefined : handleFeedbackBlur}
            readOnly={isReadOnly}
            placeholder="Provide constructive feedback for the participant... (optional)"
            rows={4}
          />
          {saveStatus === 'saving' && (
            <span className="text-xs text-muted-foreground">Saving...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-muted-foreground transition-opacity">Saved</span>
          )}
        </div>

        <Separator />

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={!prevSubmission || isSaving}
            onClick={() => prevSubmission && handleNavigatePrev(prevSubmission.id)}
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
          {isReadOnly ? (
            <Button
              variant="outline"
              disabled={!nextSubmission}
              onClick={() => nextSubmission && navigate(`/judge/categories/${categoryId}/review/${nextSubmission.id}`)}
              className="gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : localRating !== null && saveNextTarget ? (
            <Button
              disabled={isSaving}
              onClick={() => handleNavigateNext(saveNextTarget.id)}
              className="gap-2"
            >
              Save & Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled={!nextSubmission || isSaving}
              onClick={() => nextSubmission && handleNavigateNext(nextSubmission.id)}
              className="gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
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
