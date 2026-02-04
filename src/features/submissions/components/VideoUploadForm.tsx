// Story 4-4: Video upload form with drag-and-drop
// Validates file type and size before upload

import { useState, useRef, useCallback, useEffect } from 'react'
import { useBlocker } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Card, CardContent, Form } from '@/components/ui'
import { UploadProgress } from './UploadProgress'
import { SubmissionInfoFields } from './SubmissionInfoFields'
import { useVideoUpload } from '../hooks/useVideoUpload'
import {
  VIDEO_ACCEPT,
  VIDEO_MIME_TYPES,
  MAX_VIDEO_SIZE,
  VIDEO_FORMATS,
} from '../types/submission.types'
import {
  submissionInfoSchema,
  type SubmissionInfoFormData,
} from '../types/submissionInfo.schema'
import { cn } from '@/lib/utils'

interface VideoUploadFormProps {
  contestId: string
  categoryId: string
  participantId: string
  participantCode: string
  onUploadComplete: (submissionId: string) => void
}

export function VideoUploadForm({
  contestId,
  categoryId,
  participantId,
  participantCode,
  onUploadComplete,
}: VideoUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  // Track when completion navigation is in progress to avoid blocking it
  const completingRef = useRef(false)

  const form = useForm<SubmissionInfoFormData>({
    resolver: zodResolver(submissionInfoSchema),
    mode: 'onBlur',
    defaultValues: {
      studentName: '',
      tlcName: '',
      tlcEmail: '',
      groupMemberNames: '',
    },
  })

  const handleComplete = useCallback(
    (submissionId: string) => {
      completingRef.current = true
      onUploadComplete(submissionId)
    },
    [onUploadComplete]
  )

  const { uploadState, startUpload, retryUpload, cancelUpload } =
    useVideoUpload({
      contestId,
      categoryId,
      participantId,
      participantCode,
      onComplete: handleComplete,
    })

  // F10 Fix: Optimized validation with early returns
  const validateFile = (file: File): string | null => {
    // Check file size first (cheaper operation)
    if (file.size > MAX_VIDEO_SIZE) {
      return 'File too large. Maximum size is 500MB'
    }

    // Check file type - short-circuit on first match
    const lowerName = file.name.toLowerCase()
    const isValidType =
      VIDEO_MIME_TYPES.some((type) => file.type === type) ||
      VIDEO_FORMATS.some((ext) => lowerName.endsWith(ext))

    if (!isValidType) {
      return 'Invalid file type. Supported formats: MP4, MKV, M4V, MOV, AVI, WMV, FLV, TS, MPEG'
    }

    return null
  }

  const handleFileSelect = useCallback(
    (file: File) => {
      const error = validateFile(file)
      if (error) {
        toast.error(error)
        return
      }

      // Validate info fields before starting upload
      form.handleSubmit((info) => {
        startUpload(file, info)
      }, () => {
        toast.error('Please fill in your information before uploading.')
      })()
    },
    [form, startUpload]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  // QA Fix #1: SPA navigation blocking during upload
  const isUploading =
    uploadState.status === 'uploading' || uploadState.status === 'processing'

  // Block React Router navigation during upload (function form evaluates at navigation time)
  const blocker = useBlocker(() => isUploading && !completingRef.current)

  // Show confirmation when blocked
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmed = window.confirm(
        'Upload in progress. Are you sure you want to leave? Your upload will be cancelled.'
      )
      if (confirmed) {
        cancelUpload()
        blocker.proceed()
      } else {
        blocker.reset()
      }
    }
  }, [blocker, cancelUpload])

  // Browser navigation warning (refresh/close)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isUploading) {
        e.preventDefault()
        e.returnValue = 'Upload in progress. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isUploading])

  return (
    <div className="space-y-6">
      {/* Submission info fields */}
      <Form {...form}>
        <div className="space-y-4">
          <SubmissionInfoFields
            control={form.control}
            disabled={isUploading || uploadState.status === 'complete'}
          />
        </div>
      </Form>

      {/* File picker / drop zone */}
      {uploadState.status === 'idle' && (
        <Card
          className={cn(
            'border-2 border-dashed transition-colors cursor-pointer',
            isDragging && 'border-primary bg-primary/5'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="py-12 text-center">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              Drop your video here or click to browse
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Supported formats: MP4, MKV, M4V, MOV, AVI, WMV, FLV, TS, MPEG
            </p>
            <p className="text-sm text-muted-foreground">
              Maximum file size: 500MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={VIDEO_ACCEPT}
              onChange={handleInputChange}
              className="hidden"
            />
          </CardContent>
        </Card>
      )}

      {/* Upload progress */}
      {uploadState.status !== 'idle' && (
        <UploadProgress
          state={uploadState}
          onRetry={uploadState.status === 'error' ? retryUpload : undefined}
        />
      )}

      {/* Cancel button during upload */}
      {isUploading && (
        <div className="text-center">
          <Button variant="outline" onClick={cancelUpload}>
            Cancel Upload
          </Button>
        </div>
      )}
    </div>
  )
}
