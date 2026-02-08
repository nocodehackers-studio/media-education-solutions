import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTimeInTimezone } from '@/lib/dateUtils';

interface DeadlineCountdownProps {
  deadline: string;
  timezone: string;
  className?: string;
}

function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return 'Submission closed';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours >= 1) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes >= 1) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function DeadlineCountdown({ deadline, timezone, className }: DeadlineCountdownProps) {
  const [now, setNow] = useState(() => Date.now());

  const deadlineDate = new Date(deadline);
  const isValid = !isNaN(deadlineDate.getTime());
  const totalSeconds = isValid ? Math.floor((deadlineDate.getTime() - now) / 1000) : 0;
  const isCountdownRange = isValid && totalSeconds <= 86400 && totalSeconds > 0;

  // Update every second when in countdown range (0 < remaining <= 24h)
  useEffect(() => {
    if (!isCountdownRange) return;
    const interval = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(interval);
  }, [isCountdownRange]);

  // F3 fix: schedule a re-render when >24h crosses into countdown range
  useEffect(() => {
    if (!isValid || isCountdownRange || totalSeconds <= 0) return;
    const msUntilCountdown = new Date(deadline).getTime() - Date.now() - 86400_000;
    if (msUntilCountdown <= 0) return;
    const timeout = setTimeout(() => setNow(Date.now()), msUntilCountdown + 100);
    return () => clearTimeout(timeout);
  }, [isValid, isCountdownRange, totalSeconds, deadline]);

  if (!isValid) {
    return (
      <div className={cn('flex items-center gap-1 text-muted-foreground', className)}>
        <Clock className="h-4 w-4" />
        <span>Invalid deadline</span>
      </div>
    );
  }

  // >24h: show formatted date only
  if (totalSeconds > 86400) {
    return (
      <div className={cn('flex items-center gap-1 text-muted-foreground', className)}>
        <Clock className="h-4 w-4" aria-hidden="true" />
        <span>{formatDateTimeInTimezone(deadline, timezone)}</span>
      </div>
    );
  }

  // F7 fix: past deadline — show closed without urgency styling
  if (totalSeconds <= 0) {
    return (
      <div className={cn('flex items-center gap-1 text-muted-foreground', className)}>
        <Clock className="h-4 w-4" aria-hidden="true" />
        <span>Submission closed</span>
      </div>
    );
  }

  // Urgency levels (only for positive seconds)
  let urgency: 'normal' | 'warning' | 'urgent' = 'normal';
  if (totalSeconds <= 600) {
    urgency = 'urgent';
  } else if (totalSeconds <= 7200) {
    urgency = 'warning';
  }

  const urgencyStyles = {
    normal: 'text-muted-foreground',
    warning: 'text-amber-600 font-medium',
    urgent: 'text-red-600 font-bold motion-safe:animate-pulse',
  };

  const countdownText = formatCountdown(totalSeconds);
  const formattedDeadline = formatDateTimeInTimezone(deadline, timezone);

  return (
    <div
      className={cn('flex flex-col gap-0.5', className)}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className={cn('flex items-center gap-1', urgencyStyles[urgency])}>
        <Clock className="h-4 w-4" aria-hidden="true" />
        <span>{countdownText}</span>
      </div>
      <span className="text-xs text-muted-foreground">{formattedDeadline}</span>
    </div>
  );
}
