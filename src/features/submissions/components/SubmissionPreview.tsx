// Story 4-6: Media preview component (video iframe or photo with lightbox)

import { useState } from 'react'
import { Skeleton } from '@/components/ui'
import { PhotoLightbox } from './PhotoLightbox'
import { type SubmissionPreviewData } from '../hooks/useSubmissionPreview'

interface SubmissionPreviewProps {
  submission: SubmissionPreviewData
  libraryId: string | null
}

export function SubmissionPreview({ submission, libraryId }: SubmissionPreviewProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (submission.mediaType === 'video') {
    const embedUrl = libraryId && submission.bunnyVideoId
      ? `https://iframe.mediadelivery.net/embed/${libraryId}/${submission.bunnyVideoId}`
      : null

    if (!embedUrl) {
      return (
        <div className="rounded-lg border p-6 text-center text-muted-foreground">
          Video preview unavailable
        </div>
      )
    }

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
