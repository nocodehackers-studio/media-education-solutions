// RatingDisplay - Story 5.2 (AC2), Story 5.4 (AC1, AC2, AC3)
// Tier-selection rating component with granular score selection for judge review

import { RATING_TIERS } from '../types/review.types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

interface RatingDisplayProps {
  value: number | null;
  onChange?: (rating: number) => void;
}

export function RatingDisplay({ value, onChange }: RatingDisplayProps) {
  const selectedTier = value !== null
    ? RATING_TIERS.find((t) => value >= t.minScore && value <= t.maxScore)
    : null;

  return (
    <div className="space-y-3">
      {/* Tier row */}
      <div role="radiogroup" aria-label="Rating" className="flex flex-wrap gap-2">
        {RATING_TIERS.map((tier) => {
          const isSelected = selectedTier?.tier === tier.tier;

          return (
            <button
              key={tier.tier}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange?.(tier.minScore)}
              disabled={!onChange}
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

      {/* Granular score row */}
      {selectedTier && (
        <div role="radiogroup" aria-label="Granular score" className="flex gap-2">
          {Array.from(
            { length: selectedTier.maxScore - selectedTier.minScore + 1 },
            (_, i) => selectedTier.minScore + i
          ).map((score) => (
            <Button
              key={score}
              type="button"
              variant={value === score ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange?.(score)}
              disabled={!onChange}
              role="radio"
              aria-checked={value === score}
              aria-label={`Score ${score}`}
              className="w-10 h-10"
            >
              {score}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
