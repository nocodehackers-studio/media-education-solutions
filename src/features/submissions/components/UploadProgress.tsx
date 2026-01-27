// Story 4-4: Upload progress display component
// Shows file name, progress bar, percentage, and upload speed

import { Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button, Progress } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { UploadState } from '../types/submission.types'

interface UploadProgressProps {
  state: UploadState
  onRetry?: () => void
  className?: string
}

export function UploadProgress({
  state,
  onRetry,
  className,
}: UploadProgressProps) {
  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`
    if (bytesPerSecond < 1024 * 1024)
      return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`
  }

  const formatProgress = (progress: number): string => {
    return `${Math.round(progress)}%`
  }

  const getStatusIcon = () => {
    switch (state.status) {
      case 'idle':
        return <Upload className="h-8 w-8 text-muted-foreground" />
      case 'uploading':
        return <Loader2 className="h-8 w-8 text-primary animate-spin" />
      case 'processing':
        return <Loader2 className="h-8 w-8 text-primary animate-spin" />
      case 'complete':
        return <CheckCircle className="h-8 w-8 text-green-600" />
      case 'error':
        return <XCircle className="h-8 w-8 text-destructive" />
    }
  }

  const getStatusText = () => {
    switch (state.status) {
      case 'idle':
        return 'Ready to upload'
      case 'uploading':
        return `Uploading... ${formatProgress(state.progress)}`
      case 'processing':
        return 'Processing...'
      case 'complete':
        return 'Upload complete!'
      case 'error':
        return state.error || 'Upload failed'
    }
  }

  return (
    <div className={cn('rounded-lg border p-6 space-y-4', className)}>
      <div className="flex items-center gap-4">
        {getStatusIcon()}
        <div className="flex-1 min-w-0">
          {state.fileName && (
            <p className="font-medium truncate">{state.fileName}</p>
          )}
          <p className="text-sm text-muted-foreground">{getStatusText()}</p>
        </div>
      </div>

      {(state.status === 'uploading' || state.status === 'processing') && (
        <div className="space-y-2">
          <Progress value={state.progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatProgress(state.progress)}</span>
            {state.status === 'uploading' && state.speed > 0 && (
              <span>{formatSpeed(state.speed)}</span>
            )}
          </div>
        </div>
      )}

      {/* F7 Fix: Use Button component for consistency */}
      {state.status === 'error' && onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry upload
        </Button>
      )}
    </div>
  )
}
