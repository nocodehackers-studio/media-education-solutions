// features/reviews/index.ts
// Reviews feature - Judge review dashboard, rating, feedback
// Story 5.1: Judge Review Dashboard

// === Components ===
export { SubmissionCard } from './components/SubmissionCard';
export { ReviewProgress } from './components/ReviewProgress';
export { SubmissionFilter } from './components/SubmissionFilter';
export { MediaViewer } from './components/MediaViewer';
export { PhotoZoomViewer } from './components/PhotoZoomViewer';
export { RatingDisplay } from './components/RatingDisplay';

// === Hooks ===
export { useSubmissionsForReview } from './hooks/useSubmissionsForReview';
export { useUpsertReview } from './hooks/useUpsertReview';

// === API ===
export { reviewsApi } from './api/reviewsApi';

// === Types ===
export type {
  SubmissionForReview,
  SubmissionForReviewRow,
  ReviewProgress as ReviewProgressType,
  RatingTier,
  SubmissionFilter as SubmissionFilterType,
} from './types/review.types';
export {
  RATING_TIERS,
  getRatingTier,
  transformSubmissionForReview,
} from './types/review.types';
