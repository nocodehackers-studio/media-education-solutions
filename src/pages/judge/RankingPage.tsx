// RankingPage - Story 5.5 (AC1-AC10)
// Judge top 3 ranking page with drag and drop

import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from '@dnd-kit/core';
import { ArrowLeft, CheckCircle2, Trophy, Save, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts';
import { useCategoriesByJudge } from '@/features/categories';
import {
  useSubmissionsForReview,
  useRankings,
  useSaveRankings,
  RankingSlot,
  DraggableSubmissionCard,
  validateRankingOrder,
} from '@/features/reviews';
import type { SubmissionForReview, RankingPosition } from '@/features/reviews';
import { Button, Skeleton } from '@/components/ui';

// Sentinel for detecting first user interaction (referential identity check)
const INITIAL_RANKED: (SubmissionForReview | null)[] = [null, null, null];

export function RankingPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Data queries
  const {
    data: submissions,
    isLoading: submissionsLoading,
    error: submissionsError,
  } = useSubmissionsForReview(categoryId);
  const { data: existingRankings, isLoading: rankingsLoading, error: rankingsError } = useRankings(categoryId);
  const saveRankingsMutation = useSaveRankings(categoryId);

  // Category context
  const { data: categories } = useCategoriesByJudge(user?.id);
  const category = categories?.find((c) => c.id === categoryId);
  const isCompleted = !!category?.judgingCompletedAt;

  // Derive initial rankings from persisted data
  const restoredRankings = useMemo<(SubmissionForReview | null)[]>(() => {
    if (!existingRankings || existingRankings.length === 0 || !submissions) {
      return [null, null, null];
    }
    const restored: (SubmissionForReview | null)[] = [null, null, null];
    for (const ranking of existingRankings) {
      const sub = submissions.find((s) => s.id === ranking.submissionId);
      if (sub && ranking.rank >= 1 && ranking.rank <= 3) {
        restored[ranking.rank - 1] = sub;
      }
    }
    return restored;
  }, [existingRankings, submissions]);

  // Local ranking state: starts from persisted, user overrides via interactions
  const [isUserModified, setIsUserModified] = useState(false);
  const [userRanked, setUserRanked] = useState(INITIAL_RANKED);
  const ranked = isUserModified ? userRanked : restoredRankings;
  const [activeId, setActiveId] = useState<string | null>(null);

  const setRanked = useCallback((updater: (prev: (SubmissionForReview | null)[]) => (SubmissionForReview | null)[]) => {
    setIsUserModified(true);
    setUserRanked((prev) => {
      // Use sentinel reference identity: only seed from persisted rankings on first interaction
      const base = prev === INITIAL_RANKED ? restoredRankings : prev;
      return updater(base);
    });
  }, [restoredRankings]);

  // DnD sensors (disabled when category is completed - Story 5-6)
  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 8 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(
    ...(isCompleted ? [] : [pointerSensor, touchSensor, keyboardSensor])
  );

  // Set of ranked submission IDs
  const rankedIds = useMemo(
    () => new Set(ranked.filter(Boolean).map((s) => s!.id)),
    [ranked]
  );

  // Submissions sorted by rating DESC for the available pool (exclude disqualified)
  const sortedSubmissions = useMemo(() => {
    if (!submissions) return [];
    return [...submissions]
      .filter((s) => s.status !== 'disqualified')
      .sort((a, b) => {
        const rA = a.rating ?? 0;
        const rB = b.rating ?? 0;
        return rB - rA;
      });
  }, [submissions]);

  // Active submission for DragOverlay
  const activeSubmission = useMemo(
    () => (activeId ? submissions?.find((s) => s.id === activeId) ?? null : null),
    [activeId, submissions]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const submissionId = active.id as string;
      const slotId = over.id as string;

      if (!slotId.startsWith('slot-')) return;

      const position = parseInt(slotId.split('-')[1]) as RankingPosition;
      const submission = submissions?.find((s) => s.id === submissionId);
      if (!submission) return;

      setRanked((prev) => {
        const newRankings = [...prev];

        // If this submission is already in another slot, remove it first
        const existingIndex = newRankings.findIndex((s) => s?.id === submissionId);
        if (existingIndex !== -1) {
          newRankings[existingIndex] = null;
        }

        // Place in new slot (replaces whatever was there)
        newRankings[position - 1] = submission;

        // Validate ranking order
        if (!validateRankingOrder(newRankings)) {
          toast.error('Cannot rank a lower-rated submission above a higher-rated one');
          return prev;
        }

        return newRankings;
      });
    },
    [submissions, setRanked]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const handleRemove = useCallback((position: RankingPosition) => {
    setRanked((prev) => {
      const next = [...prev];
      next[position - 1] = null;
      return next;
    });
  }, [setRanked]);

  const handleSave = useCallback(async () => {
    const rankings = ranked
      .map((sub, idx) =>
        sub ? { rank: (idx + 1) as RankingPosition, submissionId: sub.id } : null
      )
      .filter(Boolean) as { rank: number; submissionId: string }[];

    try {
      await saveRankingsMutation.mutateAsync(rankings);
      toast.success('Rankings saved');
    } catch {
      toast.error('Failed to save rankings');
    }
  }, [ranked, saveRankingsMutation]);

  const allRanked = ranked.every((s) => s !== null);
  const isLoading = submissionsLoading || rankingsLoading;

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (submissionsError || rankingsError) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
        <div className="max-w-5xl mx-auto flex flex-col items-center justify-center gap-4 py-20">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <h2 className="text-lg font-semibold">Failed to load rankings</h2>
          <p className="text-sm text-muted-foreground">
            {(submissionsError as Error)?.message || (rankingsError as Error)?.message || 'An unexpected error occurred'}
          </p>
          <Button variant="outline" onClick={() => navigate(`/judge/categories/${categoryId}`)}>
            Back to Category
          </Button>
        </div>
      </div>
    );
  }

  if (!submissions || submissions.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
        <div className="max-w-5xl mx-auto flex flex-col items-center justify-center gap-4 py-20">
          <Trophy className="h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">No submissions to rank</h2>
          <p className="text-sm text-muted-foreground">
            There are no submissions in this category yet.
          </p>
          <Button variant="outline" onClick={() => navigate(`/judge/categories/${categoryId}`)}>
            Back to Category
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
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
        </div>

        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Top 3 Ranking</h1>
            {category && (
              <p className="text-muted-foreground">
                {category.name} &bull; {category.contestName}
              </p>
            )}
          </div>
        </div>

        {/* Completion banner - Story 5-6 */}
        {isCompleted && (
          <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
            <CheckCircle2 className="h-4 w-4" />
            Category completed on{' '}
            {new Date(category!.judgingCompletedAt!).toLocaleDateString()}
            {' '}&mdash; rankings are read-only
          </div>
        )}

        {/* DnD Context wraps both sections */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
            {/* Rankings section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Rankings</h2>
              <div className="space-y-3">
                {([1, 2, 3] as RankingPosition[]).map((pos) => (
                  <RankingSlot
                    key={pos}
                    position={pos}
                    submission={ranked[pos - 1]}
                    onRemove={isCompleted ? undefined : () => handleRemove(pos)}
                  />
                ))}
              </div>
            </div>

            {/* Available pool section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Available Submissions</h2>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {sortedSubmissions.map((submission) => (
                  <DraggableSubmissionCard
                    key={submission.id}
                    submission={submission}
                    isRanked={rankedIds.has(submission.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* DragOverlay for smooth visual feedback */}
          <DragOverlay>
            {activeSubmission ? (
              <div className="opacity-90">
                <DraggableSubmissionCard
                  submission={activeSubmission}
                  isRanked={false}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Save button (hidden when completed - Story 5-6) */}
        {!isCompleted && (
          <div className="flex justify-center pt-4">
            <Button
              size="lg"
              onClick={handleSave}
              disabled={!allRanked || saveRankingsMutation.isPending}
              className="gap-2 w-full sm:w-auto"
            >
              <Save className="h-4 w-4" />
              {saveRankingsMutation.isPending ? 'Saving...' : 'Save Rankings'}
            </Button>
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
        <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
            <Skeleton className="h-6 w-24" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[100px] w-full" />
            ))}
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-[64px] w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
