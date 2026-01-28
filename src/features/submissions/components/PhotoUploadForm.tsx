// Story 4-5: Photo upload form with drag-and-drop and image preview
import { useState, useRef, useCallback, useEffect } from 'react'
import { useBlocker } from 'react-router-dom'
import { Image } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, Button } from '@/components/ui'
import { UploadProgress } from './UploadProgress'
import { usePhotoUpload } from '../hooks/usePhotoUpload'
import {
  PHOTO_ACCEPT,
  PHOTO_MIME_TYPES,
  MAX_PHOTO_SIZE,
} from '../types/submission.types'
import { cn } from '@/lib/utils'

interface PhotoUploadFormProps {
  contestId: string
  categoryId: string
  participantId: string
  participantCode: string
  onUploadComplete: (submissionId: string) => void
}

export function PhotoUploadForm({
  contestId,
  categoryId,
  participantId,
  participantCode,
  onUploadComplete,
}: PhotoUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const { uploadState, startUpload, retryUpload, cancelUpload, isUploading } =
    usePhotoUpload({
      contestId,
      categoryId,
      participantId,
      participantCode,
      onComplete: onUploadComplete,
    })

  // SPA navigation blocking during upload
  const blocker = useBlocker(isUploading)

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmed = window.confirm(
        'Upload in progress. If you leave now, your upload will be cancelled. Are you sure?'
      )
      if (confirmed) {
        cancelUpload()
        blocker.proceed()
      } else {
        blocker.reset()
      }
    }
  }, [blocker, cancelUpload])

  // Browser navigation warning during upload
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

  // Clean up preview on unmount
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

  const validateFile = (file: File): string | null => {
    // Check file type
    if (
      !PHOTO_MIME_TYPES.includes(file.type as (typeof PHOTO_MIME_TYPES)[number])
    ) {
      return 'Invalid file type. Supported formats: JPG, PNG, WebP, GIF'
    }

    // Check file size
    if (file.size > MAX_PHOTO_SIZE) {
      return 'File too large. Maximum size is 10MB'
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

      // Create preview
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)

      startUpload(file)
    },
    [startUpload]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
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
            <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              Drop your photo here or click to browse
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Supported formats: JPG, PNG, WebP, GIF
            </p>
            <p className="text-sm text-muted-foreground">
              Maximum file size: 10MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={PHOTO_ACCEPT}
              onChange={handleInputChange}
              className="hidden"
              data-testid="photo-file-input"
            />
          </CardContent>
        </Card>
      )}

      {/* Preview and progress */}
      {uploadState.status !== 'idle' && (
        <div className="space-y-4">
          {/* Image preview */}
          {preview && (
            <div className="rounded-lg overflow-hidden border">
              <img
                src={preview}
                alt="Upload preview"
                className="w-full max-h-64 object-contain bg-muted"
              />
            </div>
          )}

          {/* Upload progress */}
          <UploadProgress
            state={uploadState}
            onRetry={uploadState.status === 'error' ? retryUpload : undefined}
          />
        </div>
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
