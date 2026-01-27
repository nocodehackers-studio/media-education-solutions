// Story 4-3: Countdown timer with urgency levels (AC6, AC7)
// Displays time remaining until deadline with color-coded urgency

import { useState, useEffect } from 'react';
import { formatDistanceToNow, differenceInMinutes, differenceInHours } from 'date-fns';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeadlineCountdownProps {
  deadline: string;
  className?: string;
}

export function DeadlineCountdown({ deadline, className }: DeadlineCountdownProps) {
  const [now, setNow] = useState(() => Date.now());

  // Update every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const deadlineDate = new Date(deadline);
  const minutesRemaining = differenceInMinutes(deadlineDate, now);
  const hoursRemaining = differenceInHours(deadlineDate, now);

  // Determine urgency level (AC6, AC7)
  let urgency: 'normal' | 'warning' | 'urgent' = 'normal';
  if (minutesRemaining <= 10) {
    urgency = 'urgent'; // AC7: Within 10 minutes -> red
  } else if (hoursRemaining < 2) {
    urgency = 'warning'; // AC6: Within 2 hours -> amber
  }

  const urgencyStyles = {
    normal: 'text-muted-foreground',
    warning: 'text-amber-600 font-medium',
    urgent: 'text-red-600 font-bold animate-pulse',
  };

  // Past deadline
  if (minutesRemaining < 0) {
    return (
      <div className={cn('flex items-center gap-1 text-muted-foreground', className)}>
        <Clock className="h-4 w-4" />
        <span>Deadline passed</span>
      </div>
    );
  }

  const countdownText = formatDistanceToNow(deadlineDate, { addSuffix: true });

  return (
    <div className={cn('flex items-center gap-1', urgencyStyles[urgency], className)}>
      <Clock className="h-4 w-4" />
      <span>Due {countdownText}</span>
    </div>
  );
}
