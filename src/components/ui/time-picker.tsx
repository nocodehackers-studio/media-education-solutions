import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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

  // Local state for input fields to allow typing
  const [hourInput, setHourInput] = React.useState(hour12.toString());
  const [minuteInput, setMinuteInput] = React.useState(
    minutes.toString().padStart(2, '0')
  );

  // Update local state when value prop changes
  React.useEffect(() => {
    setHourInput(hour12.toString());
    setMinuteInput(minutes.toString().padStart(2, '0'));
  }, [hour12, minutes]);

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // Allow empty for typing
    if (rawValue === '') {
      setHourInput('');
      return;
    }
    // Only allow digits
    if (!/^\d*$/.test(rawValue)) return;
    setHourInput(rawValue);
  };

  const handleHourBlur = () => {
    let numValue = parseInt(hourInput) || 12;
    // Clamp to 1-12
    if (numValue < 1) numValue = 1;
    if (numValue > 12) numValue = 12;
    setHourInput(numValue.toString());
    const hour24 = to24Hour(numValue, period);
    onChange(
      `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    );
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // Allow empty for typing
    if (rawValue === '') {
      setMinuteInput('');
      return;
    }
    // Only allow digits
    if (!/^\d*$/.test(rawValue)) return;
    // Limit to 2 digits
    if (rawValue.length > 2) return;
    setMinuteInput(rawValue);
  };

  const handleMinuteBlur = () => {
    let numValue = parseInt(minuteInput);
    if (isNaN(numValue)) numValue = 0;
    // Clamp to 0-59
    if (numValue < 0) numValue = 0;
    if (numValue > 59) numValue = 59;
    setMinuteInput(numValue.toString().padStart(2, '0'));
    onChange(
      `${hours24.toString().padStart(2, '0')}:${numValue.toString().padStart(2, '0')}`
    );
  };

  const handlePeriodChange = (newPeriod: string) => {
    const hour24 = to24Hour(hour12, newPeriod as 'AM' | 'PM');
    onChange(
      `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    );
  };

  const handleHourKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleHourBlur();
      e.currentTarget.blur();
    }
  };

  const handleMinuteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleMinuteBlur();
      e.currentTarget.blur();
    }
  };

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      role="group"
      aria-label="Time picker"
    >
      <Input
        type="text"
        inputMode="numeric"
        value={hourInput}
        onChange={handleHourChange}
        onBlur={handleHourBlur}
        onKeyDown={handleHourKeyDown}
        disabled={disabled}
        className="w-[50px] text-center"
        aria-label="Hour (1-12)"
        placeholder="12"
      />

      <span className="text-muted-foreground">:</span>

      <Input
        type="text"
        inputMode="numeric"
        value={minuteInput}
        onChange={handleMinuteChange}
        onBlur={handleMinuteBlur}
        onKeyDown={handleMinuteKeyDown}
        disabled={disabled}
        className="w-[50px] text-center"
        aria-label="Minute (00-59)"
        placeholder="00"
      />

      <Select
        value={period}
        onValueChange={handlePeriodChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[70px]" aria-label="AM or PM">
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
