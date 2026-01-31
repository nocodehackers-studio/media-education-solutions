// SubmissionCard - Story 5.1 (AC3)
// Displays a submission card for judge review with thumbnail, status, and rating

import { useNavigate } from 'react-router-dom';
import { Camera, Video } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getRatingTier } from '../types/review.types';
import type { SubmissionForReview } from '../types/review.types';

interface SubmissionCardProps {
  submission: SubmissionForReview;
}

export function SubmissionCard({ submission }: SubmissionCardProps) {
  const navigate = useNavigate();
  const isReviewed = submission.reviewId !== null;

  const handleClick = () => {
    navigate(`/judge/review/${submission.id}`);
  };

  const thumbnailSrc =
    submission.mediaType === 'photo'
      ? submission.mediaUrl
      : submission.thumbnailUrl;

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md overflow-hidden"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Thumbnail area */}
      <div className="relative aspect-video bg-muted">
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
              <Video className="h-12 w-12" />
            ) : (
              <Camera className="h-12 w-12" />
            )}
          </div>
        )}

        {/* Media type icon overlay */}
        <div className="absolute bottom-2 left-2 rounded-full bg-black/60 p-1.5 text-white">
          {submission.mediaType === 'video' ? (
            <Video className="h-3.5 w-3.5" />
          ) : (
            <Camera className="h-3.5 w-3.5" />
          )}
        </div>

        {/* Review status badge */}
        <div className="absolute top-2 right-2">
          {isReviewed ? (
            <Badge className="bg-green-600 hover:bg-green-600 text-white">
              Reviewed
            </Badge>
          ) : (
            <Badge className="bg-amber-500 hover:bg-amber-500 text-white">
              Pending
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-3">
        <p className="font-semibold text-sm">{submission.participantCode}</p>
        {isReviewed && submission.rating !== null && getRatingTier(submission.rating) && (
          <p className="mt-1 text-xs text-muted-foreground">
            {getRatingTier(submission.rating)!.label} &middot; {submission.rating}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
