// Story 6-6: Winner card component — displays a single winner with media

import { useState } from 'react';
import { Download, Play, Trophy } from 'lucide-react';
import { Card, CardContent, Badge, Button } from '@/components/ui';
import type { EffectiveWinner } from '@/features/contests';
import { buildDownloadFilename } from '../hooks/useDownloadManager';
import { VideoPlayerDialog } from './VideoPlayerDialog';
import { PhotoLightboxWithDownload } from './PhotoLightboxWithDownload';

interface WinnerCardProps {
  winner: EffectiveWinner;
  rank: number;
  contestCode: string;
  onDownload: (url: string, filename: string) => void;
  downloadDisabled: boolean;
}

const positionStyles: Record<number, { bg: string; badge: string; label: string }> = {
  1: { bg: 'bg-amber-50 border-amber-300', badge: 'bg-amber-400 text-amber-900', label: '1st Place' },
  2: { bg: 'bg-gray-50 border-gray-300', badge: 'bg-gray-300 text-gray-800', label: '2nd Place' },
  3: { bg: 'bg-orange-50 border-orange-300', badge: 'bg-orange-300 text-orange-900', label: '3rd Place' },
};

export function WinnerCard({ winner, rank, contestCode, onDownload, downloadDisabled }: WinnerCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  const style = positionStyles[rank] || positionStyles[3];
  const isFirst = rank === 1;

  // Vacant position
  if (winner.vacant) {
    return (
      <Card className={`border-2 border-dashed border-gray-200 bg-gray-50 ${isFirst ? 'col-span-full max-w-lg mx-auto' : ''}`}>
        <CardContent className="p-6 text-center">
          <Badge className={style.badge}>{style.label}</Badge>
          <div className="mt-4">
            <Trophy className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-muted-foreground">Position vacant</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isVideo = winner.mediaType === 'video';
  const downloadFilename = buildDownloadFilename(
    contestCode,
    winner.categoryName,
    rank,
    winner.participantName,
    winner.mediaType
  );

  const handleDownload = () => {
    // For video, transform Bunny embed URL to direct play URL for actual file download
    const downloadUrl = isVideo ? getVideoDownloadUrl(winner.mediaUrl) : winner.mediaUrl;
    onDownload(downloadUrl, downloadFilename);
  };

  return (
    <>
      <Card className={`border-2 ${style.bg} ${isFirst ? 'col-span-full max-w-lg mx-auto' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Badge className={style.badge}>{style.label}</Badge>
          </div>

          {/* Media display */}
          <div className="relative rounded-lg overflow-hidden bg-muted mb-3">
            {isVideo ? (
              <button
                onClick={() => setVideoOpen(true)}
                className="relative w-full aspect-video bg-black group cursor-pointer"
                aria-label={`Play video by ${winner.participantName}`}
              >
                {winner.thumbnailUrl ? (
                  <img
                    src={winner.thumbnailUrl}
                    alt={`${winner.participantName}'s submission`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="h-12 w-12 text-white/60" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                  <Play className="h-12 w-12 text-white drop-shadow-lg" />
                </div>
              </button>
            ) : (
              <button
                onClick={() => setLightboxOpen(true)}
                className="w-full cursor-pointer"
                aria-label={`View full photo by ${winner.participantName}`}
              >
                <img
                  src={winner.mediaUrl}
                  alt={`${winner.participantName}'s submission`}
                  className={`w-full object-cover rounded-lg ${isFirst ? 'max-h-80' : 'max-h-56'}`}
                  loading="lazy"
                />
              </button>
            )}
          </div>

          {/* Winner info */}
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{winner.participantName}</p>
            {winner.institution && (
              <p className="text-sm text-muted-foreground">{winner.institution}</p>
            )}
            <p className="text-xs text-muted-foreground">{winner.categoryName}</p>
          </div>

          {/* Download button */}
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={downloadDisabled}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Photo lightbox with download button (AC #8) */}
      {lightboxOpen && !isVideo && (
        <PhotoLightboxWithDownload
          src={winner.mediaUrl}
          alt={`${winner.participantName}'s submission`}
          onClose={() => setLightboxOpen(false)}
          onDownload={handleDownload}
          downloadDisabled={downloadDisabled}
        />
      )}

      {/* Video player dialog */}
      {isVideo && (
        <VideoPlayerDialog
          mediaUrl={winner.mediaUrl}
          title={`${winner.participantName} - ${winner.categoryName}`}
          open={videoOpen}
          onOpenChange={setVideoOpen}
          onDownload={handleDownload}
          downloadDisabled={downloadDisabled}
        />
      )}
    </>
  );
}

/**
 * Transform Bunny Stream embed URL to direct play URL for download.
 * Embed: https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}
 * Play:  https://iframe.mediadelivery.net/play/{libraryId}/{videoId}
 */
function getVideoDownloadUrl(embedUrl: string): string {
  return embedUrl.replace('/embed/', '/play/').split('?')[0];
}
