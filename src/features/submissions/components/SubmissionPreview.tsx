// Story 4-6: Media preview component (video iframe or photo with lightbox)

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Video, RefreshCw } from 'lucide-react'
import { Button, Skeleton } from '@/components/ui'
import { PhotoLightbox } from './PhotoLightbox'
import { type SubmissionPreviewData } from '../hooks/useSubmissionPreview'

interface SubmissionPreviewProps {
  submission: SubmissionPreviewData
  libraryId: string | null
}

/** Check if a Bunny thumbnail is reachable (signals encoding is complete). */
function probeThumbnail(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
}

function VideoProcessingPlaceholder({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <div className="rounded-lg border bg-muted/50">
      <div
        className="flex flex-col items-center justify-center py-16 px-6 text-center"
        style={{ aspectRatio: '16/9', maxHeight: '360px' }}
      >
        <div className="relative mb-4">
          <Video className="h-12 w-12 text-muted-foreground" />
          <Loader2 className="h-5 w-5 text-primary animate-spin absolute -bottom-1 -right-1" />
        </div>
        <p className="text-base font-medium mb-1">Processing your video</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Your video is being processed. The preview will be available once encoding is complete.
        </p>
        {onRefresh && (
          <Button variant="ghost" size="sm" className="mt-3" onClick={onRefresh}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Check again
          </Button>
        )}
      </div>
    </div>
  )
}

export function SubmissionPreview({ submission, libraryId }: SubmissionPreviewProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  // null = still checking, true = ready, false = still processing
  const [videoReady, setVideoReady] = useState<boolean | null>(null)
  const [probeKey, setProbeKey] = useState(0)

  const isVideo = submission.mediaType === 'video'
  const thumbnailUrl = submission.thumbnailUrl

  // Probe thumbnail to detect whether Bunny has finished encoding
  useEffect(() => {
    if (!isVideo || !thumbnailUrl) {
      if (isVideo) setVideoReady(false)
      return
    }
    let cancelled = false
    setVideoReady(null)
    probeThumbnail(thumbnailUrl).then((ok) => {
      if (!cancelled) setVideoReady(ok)
    })
    return () => { cancelled = true }
  }, [isVideo, thumbnailUrl, probeKey])

  const handleCheckAgain = useCallback(() => {
    setProbeKey((k) => k + 1)
  }, [])

  if (isVideo) {
    const embedUrl = libraryId && submission.bunnyVideoId
      ? `https://iframe.mediadelivery.net/embed/${libraryId}/${submission.bunnyVideoId}?responsive=true`
      : null

    if (!embedUrl) {
      return (
        <div className="rounded-lg border p-6 text-center text-muted-foreground">
          Video preview unavailable
        </div>
      )
    }

    // Still checking thumbnail
    if (videoReady === null) {
      return <Skeleton className="w-full aspect-video rounded-lg" />
    }

    // Video not ready yet — show our processing UI instead of Bunny's ugly text
    if (!videoReady) {
      return <VideoProcessingPlaceholder onRefresh={handleCheckAgain} />
    }

    // Video is ready — show the Bunny iframe
    return (
      <div className="rounded-lg overflow-hidden border">
        <iframe
          src={embedUrl}
          loading="lazy"
          style={{ border: 'none', width: '100%', aspectRatio: '16/9' }}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title={`Video preview: ${submission.categoryName}`}
        />
      </div>
    )
  }

  // Photo preview
  if (!submission.mediaUrl) {
    return (
      <div className="rounded-lg border p-6 text-center text-muted-foreground">
        Photo preview unavailable
      </div>
    )
  }

  return (
    <>
      <div
        className="rounded-lg overflow-hidden border cursor-pointer group"
        onClick={() => setLightboxOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setLightboxOpen(true)
          }
        }}
        aria-label="Click to view full screen"
      >
        <img
          src={submission.mediaUrl}
          alt={`Photo submission for ${submission.categoryName}`}
          className="w-full max-h-96 object-contain bg-muted"
        />
        <p className="text-center text-xs text-muted-foreground py-2 group-hover:text-foreground transition-colors">
          Click to view full screen
        </p>
      </div>
      {lightboxOpen && (
        <PhotoLightbox
          src={submission.mediaUrl}
          alt={`Photo submission for ${submission.categoryName}`}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  )
}

export function SubmissionPreviewSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="w-full aspect-video" />
      <div className="flex gap-3">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}
