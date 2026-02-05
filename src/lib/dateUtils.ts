import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

export const DEFAULT_TIMEZONE = 'America/New_York';

export const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Miami / New York', city: 'Miami' },
  { value: 'America/Los_Angeles', label: 'Los Angeles', city: 'Los Angeles' },
  { value: 'America/Chicago', label: 'Chicago', city: 'Chicago' },
  { value: 'Europe/Madrid', label: 'Madrid', city: 'Madrid' },
  { value: 'Europe/London', label: 'London', city: 'London' },
  { value: 'Europe/Paris', label: 'Paris', city: 'Paris' },
  { value: 'Asia/Tokyo', label: 'Tokyo', city: 'Tokyo' },
  { value: 'Australia/Sydney', label: 'Sydney', city: 'Sydney' },
  { value: 'America/Sao_Paulo', label: 'São Paulo', city: 'São Paulo' },
] as const;

export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function safeTimezone(tz: string): string {
  return isValidTimezone(tz) ? tz : DEFAULT_TIMEZONE;
}

export function formatDateTimeInTimezone(
  isoDate: string,
  timezone: string,
  style: 'short' | 'long' = 'short'
): string {
  try {
    const tz = safeTimezone(timezone);
    const pattern =
      style === 'short' ? 'MMM d, yyyy h:mm a' : "MMMM d, yyyy 'at' h:mm a zzz";
    return formatInTimeZone(new Date(isoDate), tz, pattern);
  } catch {
    return 'Invalid date';
  }
}

export function formatDateInTimezone(isoDate: string, timezone: string): string {
  try {
    const tz = safeTimezone(timezone);
    return formatInTimeZone(new Date(isoDate), tz, 'MMMM d, yyyy');
  } catch {
    return 'Invalid date';
  }
}

export function formatTimeInTimezone(isoDate: string, timezone: string): string {
  try {
    const tz = safeTimezone(timezone);
    return formatInTimeZone(new Date(isoDate), tz, 'h:mm a');
  } catch {
    return 'Invalid time';
  }
}

export function getTimezoneOffsetLabel(timezone: string): string {
  try {
    const tz = safeTimezone(timezone);
    const now = new Date();
    const offset = formatInTimeZone(now, tz, 'xxx'); // e.g., "-05:00"
    const hours = parseInt(offset.slice(0, 3));
    return `UTC${hours >= 0 ? '+' : ''}${hours}`;
  } catch {
    return 'UTC';
  }
}

/**
 * Combines a date and time into a UTC ISO string.
 * IMPORTANT: Extracts only year/month/day from dateIso to avoid timezone shift issues.
 * @param dateIso - ISO date string (time component is ignored)
 * @param timeString - 24-hour format "HH:mm" (e.g., "23:59", "08:30")
 * @param timezone - IANA timezone (e.g., "America/New_York")
 * @returns UTC ISO string representing the datetime in the given timezone
 */
export function combineDateAndTime(
  dateIso: string,
  timeString: string,
  timezone: string
): string {
  try {
    const tz = safeTimezone(timezone);
    const [hours, minutes] = timeString.split(':').map(Number);

    // Extract ONLY the date portion (YYYY-MM-DD) to avoid timezone shift issues
    const datePart = dateIso.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);

    // Create a date object representing the LOCAL time in the target timezone
    const localDatetime = new Date(year, month - 1, day, hours, minutes, 0, 0);

    // fromZonedTime interprets the input as if it were in the given timezone
    // and returns the equivalent UTC time
    const utcDate = fromZonedTime(localDatetime, tz);
    return utcDate.toISOString();
  } catch (error) {
    console.error('combineDateAndTime error:', error);
    return new Date().toISOString();
  }
}

export function extractTimeFromDate(isoDate: string, timezone: string): string {
  try {
    const tz = safeTimezone(timezone);
    return formatInTimeZone(new Date(isoDate), tz, 'HH:mm');
  } catch {
    return '23:59';
  }
}

export function isDeadlinePassed(deadline: string): boolean {
  try {
    const deadlineDate = new Date(deadline);
    return Date.now() > deadlineDate.getTime();
  } catch {
    return false;
  }
}
