// MediaViewer - Story 5.2 (AC2)
// Displays photo or video submission media for judge review
// Story 5.3 will enhance with fullscreen, zoom, and advanced controls

import { Camera, Video } from 'lucide-react';

interface MediaViewerProps {
  mediaType: 'video' | 'photo';
  mediaUrl: string | null;
  participantCode: string;
}

export function MediaViewer({ mediaType, mediaUrl, participantCode }: MediaViewerProps) {
  if (!mediaUrl) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-lg border bg-muted text-muted-foreground">
        {mediaType === 'video' ? (
          <Video className="h-12 w-12" />
        ) : (
          <Camera className="h-12 w-12" />
        )}
      </div>
    );
  }

  if (mediaType === 'video') {
    const embedUrl = mediaUrl.includes('?')
      ? `${mediaUrl}&autoplay=false&preload=true`
      : `${mediaUrl}?autoplay=false&preload=true`;

    return (
      <div className="rounded-lg overflow-hidden border">
        <iframe
          src={embedUrl}
          className="w-full aspect-video"
          loading="lazy"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title={`Video submission by ${participantCode}`}
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border bg-muted">
      <img
        src={mediaUrl}
        alt={`Submission by ${participantCode}`}
        className="max-h-[500px] w-full object-contain"
        loading="lazy"
      />
    </div>
  );
}
