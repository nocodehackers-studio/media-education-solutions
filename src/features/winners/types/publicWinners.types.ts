// Story 6-6: Public winners page types

import type { CategoryWinners } from '@/features/contests';

export interface ContestPublicMetadata {
  name: string;
  coverImageUrl: string | null;
  winnersPageEnabled: boolean;
}

export interface WinnersValidationResponse {
  success: boolean;
  error?: string;
  contestName?: string;
  winners?: CategoryWinners[];
}

export interface DownloadState {
  isDownloading: boolean;
  cooldownUntil: number;
  downloadCount: number;
  blockedUntil: number;
}
