// Story 6-6: Photo lightbox with download button (AC #8)
// Extends the lightbox pattern from submissions feature with a download action

import { useEffect, useCallback, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui';

interface PhotoLightboxWithDownloadProps {
  src: string;
  alt: string;
  onClose: () => void;
  onDownload: () => void;
  downloadDisabled: boolean;
}

export function PhotoLightboxWithDownload({
  src,
  alt,
  onClose,
  onDownload,
  downloadDisabled,
}: PhotoLightboxWithDownloadProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  const handleBackdropClick = useCallback(
    (e: MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Photo preview"
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white hover:bg-white/20"
        onClick={onClose}
        aria-label="Close preview"
      >
        <X className="h-6 w-6" />
      </Button>
      <img
        src={src}
        alt={alt}
        className="max-w-[90vw] max-h-[80vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="mt-4" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="secondary"
          size="sm"
          onClick={onDownload}
          disabled={downloadDisabled}
        >
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </div>
    </div>,
    document.body
  );
}
