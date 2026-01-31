// MediaViewer - Story 5.2 (AC2), enhanced in Story 5.3
// Displays photo or video submission media for judge review
// 5.3: photo expand/lightbox, video loading/error states, controls hint

import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Video, Maximize2, AlertCircle } from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';
import { PhotoZoomViewer } from './PhotoZoomViewer';

interface MediaViewerProps {
  mediaType: 'video' | 'photo';
  mediaUrl: string | null;
  participantCode: string;
}

export function MediaViewer({ mediaType, mediaUrl, participantCode }: MediaViewerProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Video load timeout — show error if iframe hasn't loaded within 15s
  useEffect(() => {
    if (mediaType !== 'video' || !mediaUrl) return;

    timeoutRef.current = setTimeout(() => {
      setVideoLoading((loading) => {
        if (loading) {
          setVideoError(true);
          return false;
        }
        return loading;
      });
    }, 15000);

    return () => clearTimeout(timeoutRef.current);
  }, [mediaType, mediaUrl, retryCount]);

  const handleIframeLoad = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setVideoLoading(false);
  }, []);

  const handleRetry = useCallback(() => {
    setVideoLoading(true);
    setVideoError(false);
    setRetryCount((prev) => prev + 1);
  }, []);

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
      ? `${mediaUrl}&autoplay=false&preload=true&responsive=true`
      : `${mediaUrl}?autoplay=false&preload=true&responsive=true`;

    return (
      <div className="rounded-lg overflow-hidden border">
        {videoLoading && <Skeleton className="w-full aspect-video" />}
        {videoError && (
          <div className="flex flex-col items-center gap-3 py-8">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-muted-foreground">Video unavailable</p>
            <Button variant="outline" onClick={handleRetry}>
              Retry
            </Button>
          </div>
        )}
        <iframe
          key={retryCount}
          src={embedUrl}
          className={`w-full aspect-video${videoError || videoLoading ? ' hidden' : ''}`}
          loading="eager"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title={`Video submission by ${participantCode}`}
          onLoad={handleIframeLoad}
        />
        {!videoError && !videoLoading && (
          <p className="px-3 py-2 text-xs text-muted-foreground">
            Click video to use keyboard controls (Space: play/pause, Arrows: skip 10s)
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden border bg-muted group">
      <img
        src={mediaUrl}
        alt={`Submission by ${participantCode}`}
        className="max-h-[500px] w-full object-contain"
        loading="lazy"
      />
      <Button
        variant="secondary"
        size="icon"
        className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => setLightboxOpen(true)}
        aria-label="Expand photo"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
      {lightboxOpen && (
        <PhotoZoomViewer
          src={mediaUrl}
          alt={`Submission by ${participantCode}`}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
