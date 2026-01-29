// Story 4-4: Submission types for video/photo uploads

export type SubmissionStatus = 'uploading' | 'uploaded' | 'submitted' | 'disqualified'
export type MediaType = 'video' | 'photo'

export interface Submission {
  id: string
  participantId: string
  categoryId: string
  mediaType: MediaType
  mediaUrl: string | null
  bunnyVideoId: string | null
  thumbnailUrl: string | null
  status: SubmissionStatus
  submittedAt: string
  createdAt: string
  updatedAt: string
}

export interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error'
  progress: number
  speed: number // bytes per second
  fileName: string | null
  error: string | null
}

export const VIDEO_FORMATS = [
  '.mp4',
  '.mkv',
  '.m4v',
  '.mov',
  '.avi',
  '.flv',
  '.wmv',
  '.ts',
  '.mpeg',
] as const

export const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/x-matroska',
  'video/x-m4v',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-flv',
  'video/x-ms-wmv',
  'video/mp2t',
  'video/mpeg',
] as const

export const MAX_VIDEO_SIZE = 500 * 1024 * 1024 // 500MB

export const VIDEO_ACCEPT = VIDEO_FORMATS.join(',')

// Story 4-5: Photo upload constants
export const PHOTO_FORMATS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'] as const

export const PHOTO_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

export const MAX_PHOTO_SIZE = 10 * 1024 * 1024 // 10MB

export const PHOTO_ACCEPT = PHOTO_FORMATS.join(',')
