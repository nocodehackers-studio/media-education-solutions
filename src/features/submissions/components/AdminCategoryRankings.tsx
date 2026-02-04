// Story 6-3: Admin category rankings with override (AC: #3, #4, #5, #6)
// Admin can view judge rankings and override with drag-drop interface

import { useState, useCallback, useMemo } from 'react'
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
} from '@dnd-kit/core'
import { Trophy, AlertTriangle, Ban } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Badge, Skeleton } from '@/components/ui'
import { RankingSlot, DraggableSubmissionCard } from '@/features/reviews'
import type { SubmissionForReview, RankingPosition } from '@/features/reviews'
import { useAdminSubmissions } from '../hooks/useAdminSubmissions'
import { useOverrideRankings } from '../hooks/useOverrideRankings'
import type { AdminSubmission } from '../types/adminSubmission.types'
import { formatSubmissionDate } from '../types/adminSubmission.types'

interface AdminCategoryRankingsProps {
  categoryId: string
  contestId: string
}

// Map AdminSubmission to SubmissionForReview for DnD components
function toSubmissionForReview(sub: AdminSubmission): SubmissionForReview {
  return {
    id: sub.id,
    mediaType: sub.mediaType,
    mediaUrl: sub.mediaUrl,
    thumbnailUrl: sub.thumbnailUrl,
    bunnyVideoId: sub.bunnyVideoId,
    status: sub.status,
    submittedAt: sub.submittedAt,
    participantCode: sub.participantCode,
    reviewId: sub.review?.reviewId ?? null,
    rating: sub.review?.rating ?? null,
    feedback: sub.review?.feedback ?? null,
  }
}

export function AdminCategoryRankings({ categoryId, contestId }: AdminCategoryRankingsProps) {
  const {
    data: allSubmissions,
    isLoading,
    error,
  } = useAdminSubmissions(contestId, { categoryId })
  const { overrideMutation, clearMutation } = useOverrideRankings()

  const [overrideMode, setOverrideMode] = useState(false)
  const [ranked, setRanked] = useState<(SubmissionForReview | null)[]>([null, null, null])
  const [activeId, setActiveId] = useState<string | null>(null)

  // Find submissions that have rankings (judge's original picks)
  const rankedSubmissions = useMemo(() => {
    if (!allSubmissions) return []
    return allSubmissions.filter((s) => s.rankingPosition != null)
  }, [allSubmissions])

  // Build current effective rankings (override ?? original)
  const effectiveRankings = useMemo(() => {
    if (!allSubmissions) return [null, null, null] as (AdminSubmission | null)[]

    const result: (AdminSubmission | null)[] = [null, null, null]

    for (const sub of rankedSubmissions) {
      if (sub.rankingPosition != null && sub.rankingPosition >= 1 && sub.rankingPosition <= 3) {
        // Check if there's an admin override for this ranking
        if (sub.adminRankingOverride) {
          const overrideSub = allSubmissions.find((s) => s.id === sub.adminRankingOverride)
          if (overrideSub) {
            result[sub.rankingPosition - 1] = overrideSub
          }
        } else {
          result[sub.rankingPosition - 1] = sub
        }
      }
    }

    return result
  }, [allSubmissions, rankedSubmissions])

  const hasOverrides = rankedSubmissions.some((s) => s.adminRankingOverride != null)

  // Submissions pool for override mode (exclude disqualified, sorted by rating DESC)
  const submissionsPool = useMemo(() => {
    if (!allSubmissions) return []
    return [...allSubmissions]
      .filter((s) => s.status !== 'disqualified')
      .map(toSubmissionForReview)
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  }, [allSubmissions])

  // Ranked IDs set for pool display
  const rankedIds = useMemo(
    () => new Set(ranked.filter(Boolean).map((s) => s!.id)),
    [ranked]
  )

  // DnD sensors
  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  const keyboardSensor = useSensor(KeyboardSensor)
  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor)

  const activeSubmission = useMemo(
    () => (activeId ? submissionsPool.find((s) => s.id === activeId) ?? null : null),
    [activeId, submissionsPool]
  )

  const handleEnterOverrideMode = useCallback(() => {
    // Seed override slots from effective rankings
    const seeded = effectiveRankings.map((sub) =>
      sub ? toSubmissionForReview(sub) : null
    )
    setRanked(seeded)
    setOverrideMode(true)
  }, [effectiveRankings])

  const handleCancelOverride = useCallback(() => {
    setOverrideMode(false)
    setRanked([null, null, null])
  }, [])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null)
      const { active, over } = event
      if (!over) return

      const submissionId = active.id as string
      const slotId = over.id as string

      if (!slotId.startsWith('slot-')) return

      const position = parseInt(slotId.split('-')[1]) as RankingPosition
      const submission = submissionsPool.find((s) => s.id === submissionId)
      if (!submission) return

      setRanked((prev) => {
        const next = [...prev]
        // Remove from previous slot if already placed
        const existingIndex = next.findIndex((s) => s?.id === submissionId)
        if (existingIndex !== -1) {
          next[existingIndex] = null
        }
        next[position - 1] = submission
        return next
      })
    },
    [submissionsPool]
  )

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
  }, [])

  const handleRemove = useCallback((position: RankingPosition) => {
    setRanked((prev) => {
      const next = [...prev]
      next[position - 1] = null
      return next
    })
  }, [])

  const handleSaveOverride = useCallback(async () => {
    if (!allSubmissions) return

    // Build overrides from ranked slots mapped to ranking rows
    const overrides: { rankingId: string; overrideSubmissionId: string }[] = []

    for (let i = 0; i < 3; i++) {
      const rankedSub = ranked[i]
      // Find the ranking row for this position
      const rankingOwner = rankedSubmissions.find((s) => s.rankingPosition === i + 1)
      if (rankedSub && rankingOwner?.rankingId) {
        overrides.push({
          rankingId: rankingOwner.rankingId,
          overrideSubmissionId: rankedSub.id,
        })
      }
    }

    if (overrides.length === 0) {
      toast.error('No ranking changes to save')
      return
    }

    try {
      await overrideMutation.mutateAsync({ categoryId, overrides })
      toast.success('Ranking overrides saved')
      setOverrideMode(false)
    } catch {
      toast.error('Failed to save ranking overrides')
    }
  }, [ranked, rankedSubmissions, allSubmissions, categoryId, overrideMutation])

  const handleClearOverrides = useCallback(async () => {
    try {
      await clearMutation.mutateAsync(categoryId)
      toast.success('Ranking overrides cleared')
      setOverrideMode(false)
    } catch {
      toast.error('Failed to clear ranking overrides')
    }
  }, [categoryId, clearMutation])

  if (isLoading) {
    return <RankingsSkeleton />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="text-sm text-muted-foreground">Failed to load rankings</p>
      </div>
    )
  }

  const hasRankings = rankedSubmissions.length > 0
  const allSlotsFilled = ranked.every((s) => s !== null)
  const isSaving = overrideMutation.isPending || clearMutation.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">Category Rankings</h2>
          {hasOverrides && (
            <Badge variant="secondary">Overridden</Badge>
          )}
        </div>
        {hasRankings && !overrideMode && (
          <Button variant="outline" size="sm" onClick={handleEnterOverrideMode}>
            {hasOverrides ? 'Edit Override' : 'Override Rankings'}
          </Button>
        )}
      </div>

      {!hasRankings ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No rankings submitted yet for this category.
        </div>
      ) : overrideMode ? (
        /* Override mode: DnD interface */
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
            {/* Override ranking slots */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Override Rankings</h3>
              <div className="space-y-3">
                {([1, 2, 3] as RankingPosition[]).map((pos) => (
                  <RankingSlot
                    key={pos}
                    position={pos}
                    submission={ranked[pos - 1]}
                    onRemove={() => handleRemove(pos)}
                  />
                ))}
              </div>
            </div>

            {/* Available submissions pool */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">All Submissions</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {submissionsPool.map((sub) => {
                  const adminSub = allSubmissions?.find((s) => s.id === sub.id)
                  return (
                    <div key={sub.id} className="relative">
                      <DraggableSubmissionCard
                        submission={sub}
                        isRanked={rankedIds.has(sub.id)}
                      />
                      {adminSub?.studentName && (
                        <span className="absolute top-1 right-10 text-xs text-muted-foreground">
                          {adminSub.studentName}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

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

          {/* Override actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancelOverride} disabled={isSaving}>
                Cancel
              </Button>
              {hasOverrides && (
                <Button variant="outline" onClick={handleClearOverrides} disabled={isSaving}>
                  {clearMutation.isPending ? 'Clearing...' : 'Clear Overrides'}
                </Button>
              )}
            </div>
            <Button onClick={handleSaveOverride} disabled={isSaving || !allSlotsFilled}>
              {overrideMutation.isPending ? 'Saving...' : 'Save Override'}
            </Button>
          </div>
        </DndContext>
      ) : (
        /* View mode: display effective rankings */
        <div className="space-y-3">
          {effectiveRankings.map((sub, idx) => {
            const position = idx + 1
            const positionLabels = ['1st', '2nd', '3rd']
            const positionEmojis = ['🥇', '🥈', '🥉']
            const originalSub = rankedSubmissions.find((s) => s.rankingPosition === position)

            // If no submission at this position, skip
            if (!sub && !originalSub) return null

            // Check if effective submission is disqualified
            const isDisqualified = sub?.status === 'disqualified'
            const isOverridden = originalSub?.adminRankingOverride != null

            // Show empty position warning for disqualified submissions
            if (!sub || isDisqualified) {
              return (
                <div
                  key={`empty-${position}`}
                  className="flex items-center gap-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold w-20 flex-shrink-0">
                    <span>{positionEmojis[idx]}</span>
                    <span>{positionLabels[idx]}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Ban className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <span className="text-sm text-amber-700 dark:text-amber-300">
                      Ranking position is now empty
                    </span>
                  </div>
                  {isDisqualified && sub && (
                    <div className="flex-shrink-0">
                      <Badge variant="destructive" className="text-xs">Disqualified</Badge>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">{sub.participantCode}</p>
                    </div>
                  )}
                </div>
              )
            }

            const thumbnailSrc =
              sub.mediaType === 'photo' ? sub.mediaUrl : sub.thumbnailUrl

            return (
              <div
                key={sub.id}
                className="flex items-center gap-4 rounded-lg border p-3"
              >
                <div className="flex items-center gap-2 text-sm font-semibold w-20 flex-shrink-0">
                  <span>{positionEmojis[idx]}</span>
                  <span>{positionLabels[idx]}</span>
                </div>

                {/* Thumbnail */}
                <div className="relative h-[48px] w-[64px] flex-shrink-0 overflow-hidden rounded bg-muted">
                  {thumbnailSrc ? (
                    <img
                      src={thumbnailSrc}
                      alt={`Submission by ${sub.participantCode}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
                      No img
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{sub.participantCode}</span>
                    {sub.studentName && (
                      <span className="text-sm text-muted-foreground">{sub.studentName}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {sub.review?.rating != null ? `Rating: ${sub.review.rating}/10` : 'Not rated'}
                    {sub.review?.ratingTier && ` (${sub.review.ratingTier})`}
                  </div>
                </div>

                {/* Override badge + original judge pick (AC #6) */}
                {isOverridden && (
                  <div className="flex-shrink-0 text-right">
                    <Badge variant="secondary" className="text-xs">Overridden</Badge>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Originally: <span className="font-mono">{originalSub?.participantCode}</span>
                    </p>
                    {originalSub?.adminRankingOverrideAt && (
                      <p className="text-xs text-muted-foreground">
                        {formatSubmissionDate(originalSub.adminRankingOverrideAt, 'short')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function RankingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-48" />
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-[72px] w-full" />
      ))}
    </div>
  )
}
