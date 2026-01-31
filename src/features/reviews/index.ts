// features/reviews/index.ts
// Reviews feature - Judge review dashboard, rating, feedback, ranking
// Story 5.1: Judge Review Dashboard
// Story 5.5: Top 3 Ranking (Drag & Drop)

// === Components ===
export { SubmissionCard } from './components/SubmissionCard';
export { ReviewProgress } from './components/ReviewProgress';
export { SubmissionFilter } from './components/SubmissionFilter';
export { MediaViewer } from './components/MediaViewer';
export { PhotoZoomViewer } from './components/PhotoZoomViewer';
export { RatingDisplay } from './components/RatingDisplay';
export { RankingSlot } from './components/RankingSlot';
export { DraggableSubmissionCard } from './components/DraggableSubmissionCard';

// === Hooks ===
export { useSubmissionsForReview } from './hooks/useSubmissionsForReview';
export { useUpsertReview } from './hooks/useUpsertReview';
export { useRankings } from './hooks/useRankings';
export { useSaveRankings } from './hooks/useSaveRankings';

// === API ===
export { reviewsApi } from './api/reviewsApi';
export { rankingsApi } from './api/rankingsApi';

// === Types ===
export type {
  SubmissionForReview,
  SubmissionForReviewRow,
  ReviewProgress as ReviewProgressType,
  RatingTier,
  SubmissionFilter as SubmissionFilterType,
  Ranking,
  RankingRow,
  RankingPosition,
  RankedSubmission,
} from './types/review.types';
export {
  RATING_TIERS,
  getRatingTier,
  transformSubmissionForReview,
  transformRanking,
  validateRankingOrder,
} from './types/review.types';
