// Story 6-5: Winners preview dialog

import { Trophy } from 'lucide-react';
import {
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from '@/components/ui';
import { useEffectiveWinners } from '@/features/contests';
import { formatRankingPosition } from '@/features/submissions';

const positionStyles: Record<number, { badge: string; border: string }> = {
  1: { badge: 'bg-yellow-100 text-yellow-800', border: 'border-yellow-300' },
  2: { badge: 'bg-gray-100 text-gray-800', border: 'border-gray-300' },
  3: { badge: 'bg-orange-100 text-orange-800', border: 'border-orange-300' },
};

interface WinnersPreviewDialogProps {
  contestId: string;
  contestName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WinnersPreviewDialog({
  contestId,
  contestName,
  open,
  onOpenChange,
}: WinnersPreviewDialogProps) {
  const { data: categoryWinners, isLoading } = useEffectiveWinners(contestId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Winners Preview — {contestName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        ) : !categoryWinners || categoryWinners.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No approved categories with winners found.
          </p>
        ) : (
          <div className="space-y-8">
            {categoryWinners.map((cat) => (
              <div key={cat.categoryId}>
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="font-semibold">{cat.categoryName}</h3>
                  <Badge variant="secondary">{cat.divisionName}</Badge>
                </div>

                {cat.winners.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No winners for this category.</p>
                ) : (
                  <div className="space-y-2">
                    {[1, 2, 3].map((rank) => {
                      const winner = cat.winners.find((w) => w.rank === rank);
                      const styles = positionStyles[rank] || positionStyles[3];

                      if (!winner || winner.vacant) {
                        return (
                          <div
                            key={rank}
                            className={`flex items-center gap-4 rounded border border-dashed p-3 ${styles.border}`}
                          >
                            <Badge className={styles.badge}>{formatRankingPosition(rank)}</Badge>
                            <span className="text-sm text-muted-foreground italic">Position vacant</span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={rank}
                          className={`flex items-center gap-4 rounded border p-3 ${styles.border}`}
                        >
                          <Badge className={styles.badge}>{formatRankingPosition(rank)}</Badge>
                          {winner.thumbnailUrl ? (
                            <img
                              src={winner.thumbnailUrl}
                              alt={`${winner.participantName} submission`}
                              className="h-12 w-12 rounded object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                              {winner.mediaType === 'video' ? 'VID' : 'IMG'}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{winner.participantName}</p>
                            {winner.institution && (
                              <p className="text-sm text-muted-foreground truncate">{winner.institution}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
