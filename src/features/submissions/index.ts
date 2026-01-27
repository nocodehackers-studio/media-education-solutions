// features/submissions/index.ts
// Submissions feature - Video/photo upload, preview, management

// === Components ===
export { UploadProgress, VideoUploadForm } from './components'

// === Hooks ===
export { useVideoUpload } from './hooks'

// === Types ===
export type {
  Submission,
  SubmissionStatus,
  MediaType,
  UploadState,
} from './types/submission.types'

export {
  VIDEO_FORMATS,
  VIDEO_MIME_TYPES,
  MAX_VIDEO_SIZE,
  VIDEO_ACCEPT,
} from './types/submission.types'
