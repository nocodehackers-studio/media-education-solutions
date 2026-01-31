// useSubmissionsForReview hook - Story 5.1
// TanStack Query hook for fetching submissions with review progress

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { reviewsApi } from '../api/reviewsApi';
import type { ReviewProgress, SubmissionForReview } from '../types/review.types';

function computeProgress(submissions: SubmissionForReview[]): ReviewProgress {
  const total = submissions.length;
  const reviewed = submissions.filter((s) => s.reviewId !== null).length;
  const pending = total - reviewed;
  const percentage = total > 0 ? Math.round((reviewed / total) * 100) : 0;
  return { total, reviewed, pending, percentage };
}

export function useSubmissionsForReview(categoryId: string | undefined) {
  const query = useQuery({
    queryKey: ['submissions-for-review', categoryId],
    queryFn: () => {
      if (!categoryId) throw new Error('Category ID required');
      return reviewsApi.getSubmissionsForReview(categoryId);
    },
    enabled: !!categoryId,
  });

  const progress = useMemo<ReviewProgress>(
    () => computeProgress(query.data ?? []),
    [query.data]
  );

  return {
    ...query,
    progress,
  };
}
