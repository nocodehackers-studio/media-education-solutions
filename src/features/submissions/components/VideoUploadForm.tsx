// Story 4-4: Video upload form with drag-and-drop
// Validates file type and size before upload

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Card, CardContent } from '@/components/ui'
import { UploadProgress } from './UploadProgress'
import { useVideoUpload } from '../hooks/useVideoUpload'
import {
  VIDEO_ACCEPT,
  VIDEO_MIME_TYPES,
  MAX_VIDEO_SIZE,
  VIDEO_FORMATS,
} from '../types/submission.types'
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
  const { uploadState, startUpload, retryUpload, cancelUpload } =
    useVideoUpload({
      contestId,
      categoryId,
      participantId,
      participantCode,
      onComplete: onUploadComplete,
    })

  const validateFile = (file: File): string | null => {
    // Check file type by MIME type or extension
    const isValidMime = VIDEO_MIME_TYPES.some((type) => file.type === type)
    const isValidExtension = VIDEO_FORMATS.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    )

    if (!isValidMime && !isValidExtension) {
      return 'Invalid file type. Supported formats: MP4, MKV, MOV, AVI, WMV, FLV, TS, MPEG'
    }

    // Check file size
    if (file.size > MAX_VIDEO_SIZE) {
      return 'File too large. Maximum size is 500MB'
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
      startUpload(file)
    },
    [startUpload]
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

  // Navigation warning during upload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (
        uploadState.status === 'uploading' ||
        uploadState.status === 'processing'
      ) {
        e.preventDefault()
        e.returnValue = 'Upload in progress. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [uploadState.status])

  const isUploading =
    uploadState.status === 'uploading' || uploadState.status === 'processing'

  return (
    <div className="space-y-6">
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
              Supported formats: MP4, MKV, MOV, AVI, WMV, FLV, TS, MPEG
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
