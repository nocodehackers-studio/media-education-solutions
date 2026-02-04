// Story 4-4: Video upload hook with TUS resumable uploads
// Handles upload lifecycle: init -> upload -> finalize

import { useState, useCallback, useRef } from 'react'
import * as tus from 'tus-js-client'
import { supabase } from '@/lib/supabase'
import type { UploadState } from '../types/submission.types'
import type { SubmissionInfoFormData } from '../types/submissionInfo.schema'

interface UseVideoUploadParams {
  contestId: string
  categoryId: string
  participantId: string
  participantCode: string
  onComplete: (submissionId: string) => void
}

export function useVideoUpload({
  contestId,
  categoryId,
  participantId,
  participantCode,
  onComplete,
}: UseVideoUploadParams) {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    speed: 0,
    fileName: null,
    error: null,
  })

  const uploadRef = useRef<tus.Upload | null>(null)
  const fileRef = useRef<File | null>(null)
  const infoRef = useRef<SubmissionInfoFormData | null>(null)
  const submissionIdRef = useRef<string | null>(null)
  const lastProgressTimeRef = useRef<number>(0)
  const lastUploadedRef = useRef<number>(0)
  // F2 Fix: Use rolling average for smoother speed display
  const speedSamplesRef = useRef<number[]>([])

  const startUpload = useCallback(
    async (file: File, info: SubmissionInfoFormData) => {
      fileRef.current = file
      infoRef.current = info

      setUploadState({
        status: 'uploading',
        progress: 0,
        speed: 0,
        fileName: file.name,
        error: null,
      })

      try {
        // Get signed upload URL from Edge Function
        const { data, error } = await supabase.functions.invoke(
          'create-video-upload',
          {
            body: {
              contestId,
              categoryId,
              participantId,
              participantCode,
              fileName: file.name,
              fileSize: file.size,
              studentName: info.studentName,
              tlcName: info.tlcName,
              tlcEmail: info.tlcEmail,
              groupMemberNames: info.groupMemberNames || undefined,
            },
          }
        )

        if (error || !data?.success) {
          // Extract actual error body from FunctionsHttpError context
          const errorContext = (error as Record<string, unknown>)?.context as Record<string, unknown> | undefined
          const errorCode = (errorContext?.error as string) || data?.error || error?.message || 'UPLOAD_INIT_FAILED'
          console.error('[useVideoUpload] create-video-upload failed', {
            errorCode,
            edgeFnError: error?.message ?? null,
            responseData: data,
            errorContext: errorContext ?? null,
          })
          const errorMessage = getErrorMessage(errorCode)
          setUploadState((prev) => ({
            ...prev,
            status: 'error',
            error: errorMessage,
          }))
          return
        }

        const {
          submissionId,
          bunnyVideoId,
          libraryId,
          authorizationSignature,
          expirationTime,
        } = data
        submissionIdRef.current = submissionId

        // Initialize progress tracking
        lastProgressTimeRef.current = Date.now()
        lastUploadedRef.current = 0
        speedSamplesRef.current = [] // F2 Fix: Reset speed samples

        // Create TUS upload
        const upload = new tus.Upload(file, {
          endpoint: 'https://video.bunnycdn.com/tusupload',
          retryDelays: [0, 1000, 3000, 5000],
          metadata: {
            filetype: file.type,
            title: file.name,
          },
          headers: {
            AuthorizationSignature: authorizationSignature,
            AuthorizationExpire: expirationTime.toString(),
            VideoId: bunnyVideoId,
            LibraryId: libraryId,
          },
          onError: (error) => {
            console.error('TUS upload error:', error)
            setUploadState((prev) => ({
              ...prev,
              status: 'error',
              error: 'Upload failed. Please try again.',
            }))
          },
          onProgress: (bytesUploaded, bytesTotal) => {
            const progress = (bytesUploaded / bytesTotal) * 100

            // F2 Fix: Calculate speed with rolling average for smoother display
            const now = Date.now()
            const timeDiff = (now - lastProgressTimeRef.current) / 1000 // seconds
            const bytesDiff = bytesUploaded - lastUploadedRef.current

            if (timeDiff > 0) {
              const instantSpeed = bytesDiff / timeDiff
              // Keep last 5 samples for rolling average
              speedSamplesRef.current.push(instantSpeed)
              if (speedSamplesRef.current.length > 5) {
                speedSamplesRef.current.shift()
              }
            }

            // Calculate average speed from samples
            const avgSpeed =
              speedSamplesRef.current.length > 0
                ? speedSamplesRef.current.reduce((a, b) => a + b, 0) /
                  speedSamplesRef.current.length
                : 0

            lastProgressTimeRef.current = now
            lastUploadedRef.current = bytesUploaded

            setUploadState((prev) => ({
              ...prev,
              progress,
              speed: avgSpeed,
            }))
          },
          onSuccess: async () => {
            setUploadState((prev) => ({
              ...prev,
              status: 'processing',
              progress: 100,
            }))

            // Finalize upload
            const { data: finalizeData, error: finalizeError } =
              await supabase.functions.invoke('finalize-upload', {
                body: {
                  submissionId: submissionIdRef.current,
                  participantId,
                  participantCode,
                },
              })

            if (finalizeError || !finalizeData?.success) {
              console.error('[useVideoUpload] finalize-upload failed', {
                edgeFnError: finalizeError?.message ?? null,
                responseData: finalizeData,
              })
              setUploadState((prev) => ({
                ...prev,
                status: 'error',
                error: 'Failed to finalize upload. Please try again.',
              }))
              return
            }

            setUploadState((prev) => ({
              ...prev,
              status: 'complete',
            }))

            onComplete(submissionIdRef.current!)
          },
        })

        uploadRef.current = upload

        // Don't resume previous uploads — each startUpload creates a fresh
        // Bunny video ID, so any cached TUS URL points to a deleted video
        // and would 404 on the HEAD check.
        upload.start()
      } catch (error) {
        console.error('Upload start error:', error)
        setUploadState((prev) => ({
          ...prev,
          status: 'error',
          error: 'Failed to start upload. Please try again.',
        }))
      }
    },
    [contestId, categoryId, participantId, participantCode, onComplete]
  )

  const retryUpload = useCallback(() => {
    if (fileRef.current && infoRef.current) {
      startUpload(fileRef.current, infoRef.current)
    }
  }, [startUpload])

  const cancelUpload = useCallback(() => {
    if (uploadRef.current) {
      uploadRef.current.abort()
    }
    setUploadState({
      status: 'idle',
      progress: 0,
      speed: 0,
      fileName: null,
      error: null,
    })
  }, [])

  return {
    uploadState,
    startUpload,
    retryUpload,
    cancelUpload,
  }
}

// F3 Fix: Complete error message mapping for all Edge Function error codes
function getErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    // Validation errors
    FILE_TOO_LARGE: 'File too large. Maximum size is 500MB',
    MISSING_REQUIRED_FIELDS: 'Missing required information. Please try again.',
    INVALID_PARTICIPANT:
      'Invalid participant session. Please re-enter your codes.',
    CATEGORY_NOT_FOUND: 'Category not found.',
    CATEGORY_TYPE_MISMATCH: 'This category does not accept video submissions.',
    CATEGORY_CLOSED: 'This category is no longer accepting submissions.',
    DEADLINE_PASSED: 'The deadline for this category has passed.',
    // Server errors
    SUBMISSION_CREATE_FAILED: 'Failed to create submission. Please try again.',
    BUNNY_CONFIG_MISSING:
      'Upload service configuration error. Please contact support.',
    BUNNY_VIDEO_CREATE_FAILED:
      'Failed to initialize video storage. Please try again.',
    UPLOAD_INIT_FAILED: 'Failed to initialize upload. Please try again.',
    // Finalize errors
    SUBMISSION_NOT_FOUND: 'Submission not found. Please try again.',
    UNAUTHORIZED: 'You are not authorized to complete this upload.',
    SUBMISSION_UPDATE_FAILED: 'Failed to save submission. Please try again.',
    // Generic
    METHOD_NOT_ALLOWED: 'Invalid request. Please try again.',
  }
  return messages[errorCode] || 'An unexpected error occurred. Please try again.'
}
