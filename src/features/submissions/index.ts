// features/submissions/index.ts
// Submissions feature - Video/photo upload, preview, management

// === Components ===
export {
  UploadProgress,
  VideoUploadForm,
  PhotoUploadForm,
  SubmissionInfoFields,
  SubmissionPreview,
  SubmissionPreviewSkeleton,
  PhotoLightbox,
  AdminSubmissionFilters,
  AdminSubmissionsTable,
  AdminSubmissionDetail,
  AdminReviewSection,
  OverrideFeedbackDialog,
  AdminCategoryRankings,
  DisqualifyConfirmDialog,
  RestoreConfirmDialog,
  EditSubmissionInfoSheet,
} from './components'

// === Hooks ===
export {
  useVideoUpload,
  usePhotoUpload,
  useSubmissionPreview,
  useConfirmSubmission,
  useWithdrawSubmission,
  useAdminSubmissions,
  useOverrideFeedback,
  useOverrideRankings,
  useDisqualifySubmission,
  useRestoreSubmission,
  useUpdateSubmissionInfo,
} from './hooks'

// === Types ===
export type {
  Submission,
  SubmissionStatus,
  MediaType,
  UploadState,
} from './types/submission.types'

export type {
  AdminSubmission,
  AdminSubmissionFilters as AdminSubmissionFiltersType,
  AdminSubmissionRow,
  AdminSubmissionReview,
} from './types/adminSubmission.types'

export {
  transformAdminSubmission,
  SUBMISSION_STATUS_VARIANT,
  formatSubmissionDate,
  formatRankingPosition,
} from './types/adminSubmission.types'

export type { SubmissionPreviewData } from './hooks/useSubmissionPreview'

export {
  submissionInfoSchema,
  type SubmissionInfoFormData,
} from './types/submissionInfo.schema'

export {
  VIDEO_FORMATS,
  VIDEO_MIME_TYPES,
  MAX_VIDEO_SIZE,
  VIDEO_ACCEPT,
  PHOTO_FORMATS,
  PHOTO_MIME_TYPES,
  MAX_PHOTO_SIZE,
  PHOTO_ACCEPT,
} from './types/submission.types'
