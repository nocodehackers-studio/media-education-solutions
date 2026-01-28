// Story 4-5: Photo upload hook using XMLHttpRequest for progress tracking
import { useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { UploadState } from '../types/submission.types'

interface UsePhotoUploadParams {
  contestId: string
  categoryId: string
  participantId: string
  participantCode: string
  onComplete: (submissionId: string) => void
}

export function usePhotoUpload({
  contestId,
  categoryId,
  participantId,
  participantCode,
  onComplete,
}: UsePhotoUploadParams) {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    speed: 0,
    fileName: null,
    error: null,
  })

  const fileRef = useRef<File | null>(null)
  const submissionIdRef = useRef<string | null>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)
  const speedSamplesRef = useRef<number[]>([])

  const startUpload = useCallback(
    async (file: File) => {
      fileRef.current = file
      speedSamplesRef.current = []

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
          'create-photo-upload',
          {
            body: {
              contestId,
              categoryId,
              participantId,
              participantCode,
              fileName: file.name,
              fileSize: file.size,
              contentType: file.type,
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

        const { submissionId, uploadUrl, accessKey, contentType } = data
        submissionIdRef.current = submissionId

        // Upload directly to Bunny Storage using XMLHttpRequest for progress tracking
        const xhr = new XMLHttpRequest()
        xhrRef.current = xhr

        let lastProgressTime = Date.now()
        let lastLoaded = 0

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100

            // Calculate speed with rolling average
            const now = Date.now()
            const timeDiff = (now - lastProgressTime) / 1000
            const bytesDiff = event.loaded - lastLoaded

            if (timeDiff > 0) {
              const instantSpeed = bytesDiff / timeDiff
              speedSamplesRef.current.push(instantSpeed)
              if (speedSamplesRef.current.length > 5) {
                speedSamplesRef.current.shift()
              }
              const avgSpeed =
                speedSamplesRef.current.reduce((a, b) => a + b, 0) /
                speedSamplesRef.current.length

              lastProgressTime = now
              lastLoaded = event.loaded

              setUploadState((prev) => ({
                ...prev,
                progress,
                speed: avgSpeed,
              }))
            }
          }
        })

        xhr.addEventListener('load', async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadState((prev) => ({
              ...prev,
              status: 'processing',
              progress: 100,
            }))

            // Finalize upload
            const { data: finalizeData, error: finalizeError } =
              await supabase.functions.invoke('finalize-photo-upload', {
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
          } else {
            setUploadState((prev) => ({
              ...prev,
              status: 'error',
              error: 'Upload failed. Please try again.',
            }))
          }
        })

        xhr.addEventListener('error', () => {
          setUploadState((prev) => ({
            ...prev,
            status: 'error',
            error: 'Network error. Please check your connection and try again.',
          }))
        })

        xhr.addEventListener('abort', () => {
          setUploadState({
            status: 'idle',
            progress: 0,
            speed: 0,
            fileName: null,
            error: null,
          })
        })

        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('AccessKey', accessKey)
        xhr.setRequestHeader('Content-Type', contentType)
        xhr.send(file)
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
    if (xhrRef.current) {
      xhrRef.current.abort()
    }
    setUploadState({
      status: 'idle',
      progress: 0,
      speed: 0,
      fileName: null,
      error: null,
    })
  }, [])

  const isUploading =
    uploadState.status === 'uploading' || uploadState.status === 'processing'

  return {
    uploadState,
    startUpload,
    retryUpload,
    cancelUpload,
    isUploading,
  }
}

function getErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    FILE_TOO_LARGE: 'File too large. Maximum size is 10MB',
    INVALID_FILE_TYPE: 'Invalid file type. Supported formats: JPG, PNG, WebP, GIF',
    INVALID_PARTICIPANT:
      'Invalid participant session. Please re-enter your code.',
    CATEGORY_NOT_FOUND: 'Category not found.',
    CATEGORY_TYPE_MISMATCH: 'This category does not accept photo submissions.',
    CATEGORY_CLOSED: 'This category is no longer accepting submissions.',
    DEADLINE_PASSED: 'The deadline for this category has passed.',
    BUNNY_CONFIG_MISSING:
      'Upload service configuration error. Please contact support.',
    UPLOAD_INIT_FAILED: 'Failed to initialize upload. Please try again.',
    SUBMISSION_CREATE_FAILED: 'Failed to create submission. Please try again.',
  }
  return messages[errorCode] || 'An unexpected error occurred. Please try again.'
}
