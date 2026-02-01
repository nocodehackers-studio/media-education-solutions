// Story 6-6: Video player dialog for winner video playback

import { Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
} from '@/components/ui';

interface VideoPlayerDialogProps {
  mediaUrl: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: () => void;
  downloadDisabled: boolean;
}

export function VideoPlayerDialog({
  mediaUrl,
  title,
  open,
  onOpenChange,
  onDownload,
  downloadDisabled,
}: VideoPlayerDialogProps) {
  // Build embed URL with playback params (same pattern as MediaViewer)
  const embedUrl = mediaUrl.includes('?')
    ? `${mediaUrl}&autoplay=true&preload=true&responsive=true`
    : `${mediaUrl}?autoplay=true&preload=true&responsive=true`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="relative w-full aspect-video bg-black">
          {open && (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              title={title}
            />
          )}
        </div>
        <div className="p-4 pt-2 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            disabled={downloadDisabled}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
