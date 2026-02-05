import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value: string; // "HH:mm" 24h format
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

function to12Hour(hour24: number): { hour: number; period: 'AM' | 'PM' } {
  if (hour24 === 0) return { hour: 12, period: 'AM' };
  if (hour24 === 12) return { hour: 12, period: 'PM' };
  if (hour24 > 12) return { hour: hour24 - 12, period: 'PM' };
  return { hour: hour24, period: 'AM' };
}

function to24Hour(hour12: number, period: 'AM' | 'PM'): number {
  if (period === 'AM') {
    return hour12 === 12 ? 0 : hour12;
  }
  return hour12 === 12 ? 12 : hour12 + 12;
}

export function TimePicker({
  value,
  onChange,
  disabled = false,
  className,
}: TimePickerProps) {
  const [hours24, minutes] = value ? value.split(':').map(Number) : [23, 59];
  const { hour: hour12, period } = to12Hour(hours24);

  const handleHourChange = (newHour: string) => {
    const hour24 = to24Hour(parseInt(newHour), period);
    onChange(`${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    onChange(`${hours24.toString().padStart(2, '0')}:${newMinute.padStart(2, '0')}`);
  };

  const handlePeriodChange = (newPeriod: string) => {
    const hour24 = to24Hour(hour12, newPeriod as 'AM' | 'PM');
    onChange(`${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
  };

  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      role="group"
      aria-label="Time picker"
    >
      <Select
        value={hour12.toString()}
        onValueChange={handleHourChange}
        disabled={disabled}
      >
        <SelectTrigger
          className="w-[70px]"
          aria-label="Hour"
        >
          <SelectValue placeholder="Hour" />
        </SelectTrigger>
        <SelectContent>
          {hourOptions.map((h) => (
            <SelectItem key={h} value={h.toString()}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-muted-foreground">:</span>

      <Select
        value={minutes.toString().padStart(2, '0')}
        onValueChange={handleMinuteChange}
        disabled={disabled}
      >
        <SelectTrigger
          className="w-[70px]"
          aria-label="Minute"
        >
          <SelectValue placeholder="Min" />
        </SelectTrigger>
        <SelectContent>
          {minuteOptions.map((m) => (
            <SelectItem key={m} value={m.toString().padStart(2, '0')}>
              {m.toString().padStart(2, '0')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={period}
        onValueChange={handlePeriodChange}
        disabled={disabled}
      >
        <SelectTrigger
          className="w-[70px]"
          aria-label="AM or PM"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
