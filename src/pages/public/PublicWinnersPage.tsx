// Story 6-6: Public winners page — password-gated display of contest winners

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui';
import type { CategoryWinners } from '@/features/contests';
import { PasswordEntryForm, WinnersDisplay } from '@/features/winners';
import { publicWinnersApi } from '@/features/winners';
import type { ContestPublicMetadata } from '@/features/winners';

const SESSION_KEY = (code: string) => `winners_${code}`;

function getSession(contestCode: string): { contestName: string; winners: CategoryWinners[] } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY(contestCode));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.verified) return null;
    return { contestName: data.contestName, winners: data.winners };
  } catch {
    return null;
  }
}

function storeSession(contestCode: string, contestName: string, winners: CategoryWinners[]) {
  sessionStorage.setItem(
    SESSION_KEY(contestCode),
    JSON.stringify({ verified: true, contestName, winners, timestamp: Date.now() })
  );
}

export function PublicWinnersPage() {
  const { contestCode } = useParams<{ contestCode: string }>();

  // Initialize from sessionStorage synchronously (no effect needed)
  const cachedSession = contestCode ? getSession(contestCode) : null;

  const [metadata, setMetadata] = useState<ContestPublicMetadata | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(!contestCode ? false : true);
  const [metadataError, setMetadataError] = useState<string | null>(!contestCode ? 'Contest not found' : null);

  const [winnersData, setWinnersData] = useState<{
    contestName: string;
    winners: CategoryWinners[];
  } | null>(cachedSession);

  const [showWinners, setShowWinners] = useState(cachedSession !== null);

  // Fetch contest metadata
  useEffect(() => {
    if (!contestCode) return;

    publicWinnersApi
      .getContestMetadata(contestCode)
      .then((data) => {
        setMetadata(data);
        setMetadataLoading(false);
      })
      .catch(() => {
        setMetadataError('Contest not found');
        setMetadataLoading(false);
      });
  }, [contestCode]);

  const handlePasswordSuccess = useCallback(
    (contestName: string, winners: CategoryWinners[]) => {
      if (!contestCode) return;
      storeSession(contestCode, contestName, winners);
      setWinnersData({ contestName, winners });
      // Trigger transition
      setShowWinners(true);
    },
    [contestCode]
  );

  // Loading state
  if (metadataLoading && !winnersData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (metadataError && !winnersData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Contest Not Found</h1>
          <p className="text-muted-foreground">
            {metadataError === 'Contest not found'
              ? 'This contest does not exist or results are not yet available.'
              : metadataError}
          </p>
        </div>
      </div>
    );
  }

  // Show winners (from session or after password success)
  if (showWinners && winnersData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-12">
          <WinnersDisplay
            contestName={winnersData.contestName}
            contestCode={contestCode!}
            winners={winnersData.winners}
          />
        </div>
      </div>
    );
  }

  // Password form
  return (
    <div className="min-h-screen bg-background">
      {/* Cover image / header area */}
      {metadata?.coverImageUrl && (
        <div className="relative h-48 sm:h-64 overflow-hidden">
          <img
            src={metadata.coverImageUrl}
            alt={metadata.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        </div>
      )}

      <div className={`flex items-center justify-center p-4 ${metadata?.coverImageUrl ? '-mt-16' : 'min-h-screen'}`}>
        <PasswordEntryForm
          contestCode={contestCode!}
          contestName={metadata?.name || 'Contest Winners'}
          onSuccess={handlePasswordSuccess}
        />
      </div>
    </div>
  );
}
