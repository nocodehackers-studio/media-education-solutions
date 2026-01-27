// Story 4-4: Video upload hook with TUS resumable uploads
// Handles upload lifecycle: init -> upload -> finalize

import { useState, useCallback, useRef } from 'react'
import * as tus from 'tus-js-client'
import { supabase } from '@/lib/supabase'
import type { UploadState } from '../types/submission.types'

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
  const submissionIdRef = useRef<string | null>(null)
  const lastProgressTimeRef = useRef<number>(0)
  const lastUploadedRef = useRef<number>(0)

  const startUpload = useCallback(
    async (file: File) => {
      fileRef.current = file

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
            },
          }
        )

        if (error || !data?.success) {
          const errorCode = data?.error || error?.message || 'UPLOAD_INIT_FAILED'
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

            // Calculate speed
            const now = Date.now()
            const timeDiff = (now - lastProgressTimeRef.current) / 1000 // seconds
            const bytesDiff = bytesUploaded - lastUploadedRef.current
            const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0

            lastProgressTimeRef.current = now
            lastUploadedRef.current = bytesUploaded

            setUploadState((prev) => ({
              ...prev,
              progress,
              speed,
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

        // Check for previous upload to resume
        const previousUploads = await upload.findPreviousUploads()
        if (previousUploads.length > 0) {
          upload.resumeFromPreviousUpload(previousUploads[0])
        }

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
    if (fileRef.current) {
      startUpload(fileRef.current)
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

function getErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    FILE_TOO_LARGE: 'File too large. Maximum size is 500MB',
    INVALID_PARTICIPANT:
      'Invalid participant session. Please re-enter your codes.',
    CATEGORY_NOT_FOUND: 'Category not found.',
    CATEGORY_TYPE_MISMATCH: 'This category does not accept video submissions.',
    CATEGORY_CLOSED: 'This category is no longer accepting submissions.',
    DEADLINE_PASSED: 'The deadline for this category has passed.',
    BUNNY_CONFIG_MISSING:
      'Upload service configuration error. Please contact support.',
    UPLOAD_INIT_FAILED: 'Failed to initialize upload. Please try again.',
  }
  return messages[errorCode] || 'An unexpected error occurred. Please try again.'
}
