// Story 4-5: Photo upload hook using secure server-side proxy
// QA Fix: No Bunny credentials exposed to client
import { useState, useCallback, useRef } from 'react'
import type { UploadState } from '../types/submission.types'
import type { SubmissionInfoFormData } from '../types/submissionInfo.schema'

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
  const infoRef = useRef<SubmissionInfoFormData | null>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)
  const speedSamplesRef = useRef<number[]>([])

  const startUpload = useCallback(
    async (file: File, info: SubmissionInfoFormData) => {
      fileRef.current = file
      infoRef.current = info
      speedSamplesRef.current = []

      setUploadState({
        status: 'uploading',
        progress: 0,
        speed: 0,
        fileName: file.name,
        error: null,
      })

      try {
        // Build FormData with file and metadata
        const formData = new FormData()
        formData.append('file', file)
        formData.append('contestId', contestId)
        formData.append('categoryId', categoryId)
        formData.append('participantId', participantId)
        formData.append('participantCode', participantCode)
        formData.append('studentName', info.studentName)
        formData.append('tlcName', info.tlcName)
        formData.append('tlcEmail', info.tlcEmail)
        if (info.groupMemberNames) {
          formData.append('groupMemberNames', info.groupMemberNames)
        }

        // Get Supabase anon key and URL for Edge Function call
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('SUPABASE_CONFIG_MISSING')
        }

        // Upload via XMLHttpRequest for progress tracking
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

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText)
              if (response.success) {
                console.log('[usePhotoUpload] Upload succeeded', {
                  submissionId: response.submissionId,
                })
                setUploadState((prev) => ({
                  ...prev,
                  status: 'complete',
                  progress: 100,
                }))
                onComplete(response.submissionId)
              } else {
                console.error('[usePhotoUpload] Edge function returned error', {
                  errorCode: response.error,
                  status: xhr.status,
                })
                const errorMessage = getErrorMessage(response.error)
                setUploadState((prev) => ({
                  ...prev,
                  status: 'error',
                  error: errorMessage,
                }))
              }
            } catch {
              console.error('[usePhotoUpload] Failed to parse response', {
                status: xhr.status,
                responseText: xhr.responseText?.slice(0, 500),
              })
              setUploadState((prev) => ({
                ...prev,
                status: 'error',
                error: 'Invalid server response. Please try again.',
              }))
            }
          } else {
            let errorCode = 'UNKNOWN'
            let errorMessage = 'Upload failed. Please try again.'
            try {
              const response = JSON.parse(xhr.responseText)
              if (response.error) {
                errorCode = response.error
                errorMessage = getErrorMessage(response.error)
              }
            } catch {
              // Use default error message
            }
            console.error('[usePhotoUpload] HTTP error from edge function', {
              status: xhr.status,
              errorCode,
              responseText: xhr.responseText?.slice(0, 500),
            })
            setUploadState((prev) => ({
              ...prev,
              status: 'error',
              error: errorMessage,
            }))
          }
        })

        xhr.addEventListener('error', () => {
          console.error('[usePhotoUpload] Network error (XHR onerror)')
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

        // Send to our secure Edge Function (not directly to Bunny)
        xhr.open('POST', `${supabaseUrl}/functions/v1/upload-photo`)
        xhr.setRequestHeader('apikey', supabaseAnonKey)
        xhr.setRequestHeader('Authorization', `Bearer ${supabaseAnonKey}`)
        xhr.send(formData)
      } catch (error) {
        console.error('Upload start error:', error)
        const errorMessage =
          error instanceof Error && error.message === 'SUPABASE_CONFIG_MISSING'
            ? 'Configuration error. Please contact support.'
            : 'Failed to start upload. Please try again.'
        setUploadState((prev) => ({
          ...prev,
          status: 'error',
          error: errorMessage,
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
    STORAGE_UPLOAD_FAILED: 'Failed to store file. Please try again.',
    SUBMISSION_CREATE_FAILED: 'Failed to create submission. Please try again.',
    SUBMISSION_UPDATE_FAILED: 'Failed to save submission. Please try again.',
    MISSING_REQUIRED_FIELDS: 'Missing required information. Please try again.',
  }
  return messages[errorCode] || 'An unexpected error occurred. Please try again.'
}
