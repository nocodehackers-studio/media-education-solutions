// RankingSlot - Story 5.5 (AC2, AC3, AC4, AC6)
// Droppable ranking position slot for top 3 ranking

import { useDroppable } from '@dnd-kit/core';
import { X, Camera, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRatingTier } from '../types/review.types';
import type { SubmissionForReview } from '../types/review.types';
import type { RankingPosition } from '../types/review.types';

const POSITION_CONFIG: Record<RankingPosition, { label: string; emoji: string; color: string }> = {
  1: { label: '1st Place', emoji: '🥇', color: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20' },
  2: { label: '2nd Place', emoji: '🥈', color: 'border-gray-400 bg-gray-50 dark:bg-gray-950/20' },
  3: { label: '3rd Place', emoji: '🥉', color: 'border-amber-600 bg-amber-50 dark:bg-amber-950/20' },
};

interface RankingSlotProps {
  position: RankingPosition;
  submission: SubmissionForReview | null;
  onRemove?: () => void;
}

export function RankingSlot({ position, submission, onRemove }: RankingSlotProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${position}` });
  const config = POSITION_CONFIG[position];

  const thumbnailSrc = submission
    ? submission.mediaType === 'photo'
      ? submission.mediaUrl
      : submission.thumbnailUrl
    : null;

  return (
    <div
      ref={setNodeRef}
      role="group"
      aria-label={`Rank ${position} position`}
      className={`rounded-lg border-2 border-dashed p-4 transition-colors ${
        isOver
          ? 'border-primary bg-primary/5'
          : submission
            ? `border-solid ${config.color}`
            : 'border-muted-foreground/30 bg-muted/30'
      }`}
    >
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <span>{config.emoji}</span>
        <span>{config.label}</span>
      </div>

      {submission ? (
        <div className="flex items-center gap-3">
          {/* Thumbnail */}
          <div className="relative h-[60px] w-[80px] flex-shrink-0 overflow-hidden rounded bg-muted">
            {thumbnailSrc ? (
              <img
                src={thumbnailSrc}
                alt={`Submission by ${submission.participantCode}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                {submission.mediaType === 'video' ? (
                  <Video className="h-6 w-6" />
                ) : (
                  <Camera className="h-6 w-6" />
                )}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm">{submission.participantCode}</p>
            {submission.rating !== null && getRatingTier(submission.rating) && (
              <p className="text-xs text-muted-foreground">
                {getRatingTier(submission.rating)!.label} &middot; {submission.rating}
              </p>
            )}
          </div>

          {/* Remove button (hidden when read-only) */}
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              aria-label={`Remove from rank ${position}`}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div className="flex h-[60px] items-center justify-center text-sm text-muted-foreground">
          Drop submission here
        </div>
      )}
    </div>
  );
}
