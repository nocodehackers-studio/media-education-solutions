// Story 6-6: Winners display — shows all categories and winners with reveal animation

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import type { CategoryWinners } from '@/features/contests';
import { useDownloadManager } from '../hooks/useDownloadManager';
import { WinnerCard } from './WinnerCard';

interface WinnersDisplayProps {
  contestName: string;
  contestCode: string;
  winners: CategoryWinners[];
}

export function WinnersDisplay({ contestName, contestCode, winners }: WinnersDisplayProps) {
  const [revealed, setRevealed] = useState(false);
  const { downloadFile, isDownloading, cooldownActive, isBlocked } = useDownloadManager();

  const downloadDisabled = isDownloading || cooldownActive || isBlocked;

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`transition-all duration-700 ease-out ${
        revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{contestName}</h1>
        <p className="mt-2 text-lg text-muted-foreground">Congratulations to all winners!</p>
      </div>

      {/* Download status bar */}
      {(isDownloading || cooldownActive || isBlocked) && (
        <div className="sticky top-4 z-10 mb-6 mx-auto max-w-md">
          <div className="rounded-lg border bg-background/95 backdrop-blur px-4 py-3 shadow-sm text-center text-sm">
            {isBlocked ? (
              <span className="text-destructive flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Too many downloads. Please try again later.
              </span>
            ) : isDownloading ? (
              <span className="text-muted-foreground">Download in progress...</span>
            ) : cooldownActive ? (
              <span className="text-muted-foreground">Please wait for current download to complete</span>
            ) : null}
          </div>
        </div>
      )}

      {/* Categories and winners */}
      {winners.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No winners have been announced yet.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {winners.map((category) => {
            const allVacant = category.winners.every((w) => w.vacant);

            return (
              <section key={category.categoryId}>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-foreground">{category.categoryName}</h2>
                  <p className="text-sm text-muted-foreground">{category.divisionName}</p>
                </div>

                {allVacant || category.winners.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">No winners for this category.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.winners.map((winner) => (
                      <WinnerCard
                        key={`${category.categoryId}-${winner.rank}`}
                        winner={winner}
                        rank={winner.rank}
                        contestCode={contestCode}
                        onDownload={downloadFile}
                        downloadDisabled={downloadDisabled}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
