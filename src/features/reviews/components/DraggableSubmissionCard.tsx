// DraggableSubmissionCard - Story 5.5 (AC2, AC3)
// Draggable submission card for the available pool in ranking

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Camera, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getRatingTier } from '../types/review.types';
import type { SubmissionForReview } from '../types/review.types';

interface DraggableSubmissionCardProps {
  submission: SubmissionForReview;
  isRanked: boolean;
}

export function DraggableSubmissionCard({ submission, isRanked }: DraggableSubmissionCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: submission.id,
    disabled: isRanked,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const thumbnailSrc =
    submission.mediaType === 'photo'
      ? submission.mediaUrl
      : submission.thumbnailUrl;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="option"
      aria-roledescription="draggable submission"
      aria-selected={isRanked}
      className={`flex items-center gap-3 rounded-lg border p-2 transition-all ${
        isDragging
          ? 'opacity-50 ring-2 ring-primary'
          : isRanked
            ? 'opacity-50 cursor-default'
            : 'cursor-grab hover:bg-accent/50 active:cursor-grabbing'
      }`}
    >
      {/* Drag handle */}
      <div className={`flex-shrink-0 text-muted-foreground ${isRanked ? 'invisible' : ''}`}>
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Thumbnail */}
      <div className="relative h-[48px] w-[64px] flex-shrink-0 overflow-hidden rounded bg-muted">
        {thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt={`Submission by ${submission.participantCode}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            {submission.mediaType === 'video' ? (
              <Video className="h-5 w-5" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{submission.participantCode}</p>
        {submission.rating !== null && getRatingTier(submission.rating) && (
          <p className="text-xs text-muted-foreground">
            {getRatingTier(submission.rating)!.label} &middot; {submission.rating}
          </p>
        )}
      </div>

      {/* Ranked badge */}
      {isRanked && (
        <Badge variant="secondary" className="flex-shrink-0 text-xs">
          Ranked
        </Badge>
      )}
    </div>
  );
}
