// RatingDisplay - Story 5.2 (AC2)
// Basic tier-selection rating component for judge review
// Story 5.4 will add granular score selection within tiers

import { RATING_TIERS } from '../types/review.types';
import { cn } from '@/lib/utils';

interface RatingDisplayProps {
  value: number | null;
  onChange: (rating: number) => void;
}

export function RatingDisplay({ value, onChange }: RatingDisplayProps) {
  const selectedTier = value !== null
    ? RATING_TIERS.find((t) => value >= t.minScore && value <= t.maxScore)
    : null;

  return (
    <div className="flex flex-wrap gap-2">
      {RATING_TIERS.map((tier) => {
        const isSelected = selectedTier?.tier === tier.tier;

        return (
          <button
            key={tier.tier}
            type="button"
            onClick={() => onChange(tier.minScore)}
            className={cn(
              'flex flex-col items-center rounded-lg border px-4 py-3 text-sm transition-colors',
              'hover:border-primary/50 hover:bg-primary/5',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isSelected
                ? 'border-primary bg-primary/10 text-primary font-medium'
                : 'border-border bg-background text-muted-foreground'
            )}
          >
            <span className={cn('font-medium', isSelected && 'text-primary')}>
              {tier.label}
            </span>
            <span className="text-xs mt-0.5">
              {tier.minScore}–{tier.maxScore}
            </span>
          </button>
        );
      })}
    </div>
  );
}
