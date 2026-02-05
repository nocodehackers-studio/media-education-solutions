import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

export const DEFAULT_TIMEZONE = 'America/New_York';

/**
 * Comprehensive timezone list with Windows-style display names.
 * Sorted by UTC offset, then alphabetically by label.
 */
export const TIMEZONE_OPTIONS = [
  // UTC-12:00
  { value: 'Etc/GMT+12', label: '(UTC-12:00) International Date Line West' },
  // UTC-11:00
  { value: 'Pacific/Midway', label: '(UTC-11:00) Midway Island, Samoa' },
  { value: 'Pacific/Niue', label: '(UTC-11:00) Niue' },
  { value: 'Pacific/Pago_Pago', label: '(UTC-11:00) Pago Pago' },
  // UTC-10:00
  { value: 'America/Adak', label: '(UTC-10:00) Aleutian Islands' },
  { value: 'Pacific/Honolulu', label: '(UTC-10:00) Hawaii' },
  { value: 'Pacific/Tahiti', label: '(UTC-10:00) Tahiti' },
  // UTC-09:30
  { value: 'Pacific/Marquesas', label: '(UTC-09:30) Marquesas Islands' },
  // UTC-09:00
  { value: 'America/Anchorage', label: '(UTC-09:00) Alaska' },
  { value: 'Pacific/Gambier', label: '(UTC-09:00) Gambier Islands' },
  // UTC-08:00
  { value: 'America/Los_Angeles', label: '(UTC-08:00) Pacific Time (US & Canada)' },
  { value: 'America/Tijuana', label: '(UTC-08:00) Baja California' },
  { value: 'America/Vancouver', label: '(UTC-08:00) Vancouver' },
  { value: 'Pacific/Pitcairn', label: '(UTC-08:00) Pitcairn Islands' },
  // UTC-07:00
  { value: 'America/Denver', label: '(UTC-07:00) Mountain Time (US & Canada)' },
  { value: 'America/Phoenix', label: '(UTC-07:00) Arizona' },
  { value: 'America/Edmonton', label: '(UTC-07:00) Edmonton' },
  { value: 'America/Chihuahua', label: '(UTC-07:00) Chihuahua, La Paz, Mazatlan' },
  { value: 'America/Hermosillo', label: '(UTC-07:00) Hermosillo' },
  // UTC-06:00
  { value: 'America/Chicago', label: '(UTC-06:00) Central Time (US & Canada)' },
  { value: 'America/Mexico_City', label: '(UTC-06:00) Guadalajara, Mexico City, Monterrey' },
  { value: 'America/Guatemala', label: '(UTC-06:00) Central America' },
  { value: 'America/Regina', label: '(UTC-06:00) Saskatchewan' },
  { value: 'America/Winnipeg', label: '(UTC-06:00) Winnipeg' },
  { value: 'America/Costa_Rica', label: '(UTC-06:00) Costa Rica' },
  { value: 'America/El_Salvador', label: '(UTC-06:00) El Salvador' },
  { value: 'America/Tegucigalpa', label: '(UTC-06:00) Honduras' },
  { value: 'America/Managua', label: '(UTC-06:00) Nicaragua' },
  { value: 'Pacific/Galapagos', label: '(UTC-06:00) Galapagos Islands' },
  // UTC-05:00
  { value: 'America/New_York', label: '(UTC-05:00) Eastern Time (US & Canada)' },
  { value: 'America/Toronto', label: '(UTC-05:00) Toronto' },
  { value: 'America/Havana', label: '(UTC-05:00) Havana' },
  { value: 'America/Lima', label: '(UTC-05:00) Bogota, Lima, Quito' },
  { value: 'America/Panama', label: '(UTC-05:00) Panama' },
  { value: 'America/Jamaica', label: '(UTC-05:00) Jamaica' },
  { value: 'America/Indiana/Indianapolis', label: '(UTC-05:00) Indiana (East)' },
  { value: 'America/Detroit', label: '(UTC-05:00) Detroit' },
  { value: 'America/Cancun', label: '(UTC-05:00) Cancun, Chetumal' },
  { value: 'America/Port-au-Prince', label: '(UTC-05:00) Haiti' },
  { value: 'America/Atikokan', label: '(UTC-05:00) Atikokan' },
  { value: 'Pacific/Easter', label: '(UTC-05:00) Easter Island' },
  // UTC-04:00
  { value: 'America/Halifax', label: '(UTC-04:00) Atlantic Time (Canada)' },
  { value: 'America/Caracas', label: '(UTC-04:00) Caracas' },
  { value: 'America/La_Paz', label: '(UTC-04:00) Georgetown, La Paz, Manaus, San Juan' },
  { value: 'America/Santiago', label: '(UTC-04:00) Santiago' },
  { value: 'America/Asuncion', label: '(UTC-04:00) Asuncion' },
  { value: 'America/Cuiaba', label: '(UTC-04:00) Cuiaba' },
  { value: 'America/Santo_Domingo', label: '(UTC-04:00) Santo Domingo' },
  { value: 'America/Puerto_Rico', label: '(UTC-04:00) Puerto Rico' },
  { value: 'America/Martinique', label: '(UTC-04:00) Martinique' },
  { value: 'America/Barbados', label: '(UTC-04:00) Barbados' },
  { value: 'America/Guyana', label: '(UTC-04:00) Guyana' },
  { value: 'Atlantic/Bermuda', label: '(UTC-04:00) Bermuda' },
  // UTC-03:30
  { value: 'America/St_Johns', label: '(UTC-03:30) Newfoundland' },
  // UTC-03:00
  { value: 'America/Sao_Paulo', label: '(UTC-03:00) Brasilia' },
  { value: 'America/Argentina/Buenos_Aires', label: '(UTC-03:00) Buenos Aires' },
  { value: 'America/Montevideo', label: '(UTC-03:00) Montevideo' },
  { value: 'America/Cayenne', label: '(UTC-03:00) Cayenne, Fortaleza' },
  { value: 'America/Godthab', label: '(UTC-03:00) Greenland' },
  { value: 'Atlantic/Stanley', label: '(UTC-03:00) Falkland Islands' },
  { value: 'America/Miquelon', label: '(UTC-03:00) Saint Pierre and Miquelon' },
  { value: 'America/Paramaribo', label: '(UTC-03:00) Suriname' },
  // UTC-02:00
  { value: 'America/Noronha', label: '(UTC-02:00) Fernando de Noronha' },
  { value: 'Atlantic/South_Georgia', label: '(UTC-02:00) South Georgia' },
  // UTC-01:00
  { value: 'Atlantic/Azores', label: '(UTC-01:00) Azores' },
  { value: 'Atlantic/Cape_Verde', label: '(UTC-01:00) Cape Verde Islands' },
  // UTC+00:00
  { value: 'UTC', label: '(UTC+00:00) Coordinated Universal Time' },
  { value: 'Europe/London', label: '(UTC+00:00) London, Dublin, Edinburgh, Lisbon' },
  { value: 'Africa/Casablanca', label: '(UTC+00:00) Casablanca' },
  { value: 'Africa/Monrovia', label: '(UTC+00:00) Monrovia, Reykjavik' },
  { value: 'Atlantic/Reykjavik', label: '(UTC+00:00) Reykjavik' },
  { value: 'Africa/Dakar', label: '(UTC+00:00) Dakar' },
  { value: 'Africa/Accra', label: '(UTC+00:00) Accra' },
  // UTC+01:00
  { value: 'Europe/Paris', label: '(UTC+01:00) Paris, Brussels, Amsterdam, Berlin' },
  { value: 'Europe/Madrid', label: '(UTC+01:00) Madrid' },
  { value: 'Europe/Rome', label: '(UTC+01:00) Rome, Vienna, Prague, Warsaw' },
  { value: 'Europe/Berlin', label: '(UTC+01:00) Berlin' },
  { value: 'Europe/Stockholm', label: '(UTC+01:00) Stockholm' },
  { value: 'Europe/Belgrade', label: '(UTC+01:00) Belgrade, Bratislava, Budapest, Ljubljana' },
  { value: 'Africa/Lagos', label: '(UTC+01:00) West Central Africa' },
  { value: 'Africa/Algiers', label: '(UTC+01:00) Algiers' },
  { value: 'Africa/Tunis', label: '(UTC+01:00) Tunis' },
  { value: 'Europe/Zurich', label: '(UTC+01:00) Zurich' },
  { value: 'Europe/Amsterdam', label: '(UTC+01:00) Amsterdam' },
  { value: 'Europe/Brussels', label: '(UTC+01:00) Brussels' },
  { value: 'Europe/Copenhagen', label: '(UTC+01:00) Copenhagen' },
  { value: 'Europe/Oslo', label: '(UTC+01:00) Oslo' },
  { value: 'Europe/Warsaw', label: '(UTC+01:00) Warsaw' },
  // UTC+02:00
  { value: 'Europe/Athens', label: '(UTC+02:00) Athens, Bucharest' },
  { value: 'Europe/Helsinki', label: '(UTC+02:00) Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius' },
  { value: 'Africa/Cairo', label: '(UTC+02:00) Cairo' },
  { value: 'Africa/Johannesburg', label: '(UTC+02:00) Harare, Pretoria' },
  { value: 'Europe/Istanbul', label: '(UTC+03:00) Istanbul' },
  { value: 'Asia/Jerusalem', label: '(UTC+02:00) Jerusalem' },
  { value: 'Asia/Beirut', label: '(UTC+02:00) Beirut' },
  { value: 'Asia/Amman', label: '(UTC+02:00) Amman' },
  { value: 'Europe/Bucharest', label: '(UTC+02:00) Bucharest' },
  { value: 'Europe/Sofia', label: '(UTC+02:00) Sofia' },
  { value: 'Europe/Kiev', label: '(UTC+02:00) Kyiv' },
  { value: 'Africa/Tripoli', label: '(UTC+02:00) Tripoli' },
  { value: 'Africa/Windhoek', label: '(UTC+02:00) Windhoek' },
  // UTC+03:00
  { value: 'Europe/Moscow', label: '(UTC+03:00) Moscow, St. Petersburg' },
  { value: 'Asia/Kuwait', label: '(UTC+03:00) Kuwait, Riyadh' },
  { value: 'Asia/Baghdad', label: '(UTC+03:00) Baghdad' },
  { value: 'Africa/Nairobi', label: '(UTC+03:00) Nairobi' },
  { value: 'Asia/Qatar', label: '(UTC+03:00) Qatar' },
  { value: 'Asia/Bahrain', label: '(UTC+03:00) Bahrain' },
  { value: 'Africa/Addis_Ababa', label: '(UTC+03:00) Addis Ababa' },
  { value: 'Europe/Minsk', label: '(UTC+03:00) Minsk' },
  // UTC+03:30
  { value: 'Asia/Tehran', label: '(UTC+03:30) Tehran' },
  // UTC+04:00
  { value: 'Asia/Dubai', label: '(UTC+04:00) Abu Dhabi, Muscat' },
  { value: 'Asia/Baku', label: '(UTC+04:00) Baku' },
  { value: 'Asia/Tbilisi', label: '(UTC+04:00) Tbilisi' },
  { value: 'Asia/Yerevan', label: '(UTC+04:00) Yerevan' },
  { value: 'Indian/Mauritius', label: '(UTC+04:00) Port Louis' },
  { value: 'Europe/Samara', label: '(UTC+04:00) Samara, Volgograd' },
  // UTC+04:30
  { value: 'Asia/Kabul', label: '(UTC+04:30) Kabul' },
  // UTC+05:00
  { value: 'Asia/Karachi', label: '(UTC+05:00) Islamabad, Karachi' },
  { value: 'Asia/Tashkent', label: '(UTC+05:00) Tashkent, Ashgabat' },
  { value: 'Asia/Yekaterinburg', label: '(UTC+05:00) Ekaterinburg' },
  { value: 'Indian/Maldives', label: '(UTC+05:00) Maldives' },
  // UTC+05:30
  { value: 'Asia/Kolkata', label: '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi' },
  { value: 'Asia/Colombo', label: '(UTC+05:30) Sri Jayawardenepura' },
  // UTC+05:45
  { value: 'Asia/Kathmandu', label: '(UTC+05:45) Kathmandu' },
  // UTC+06:00
  { value: 'Asia/Dhaka', label: '(UTC+06:00) Dhaka' },
  { value: 'Asia/Almaty', label: '(UTC+06:00) Astana, Almaty' },
  { value: 'Asia/Omsk', label: '(UTC+06:00) Omsk' },
  { value: 'Indian/Chagos', label: '(UTC+06:00) Chagos' },
  // UTC+06:30
  { value: 'Asia/Yangon', label: '(UTC+06:30) Yangon (Rangoon)' },
  { value: 'Indian/Cocos', label: '(UTC+06:30) Cocos Islands' },
  // UTC+07:00
  { value: 'Asia/Bangkok', label: '(UTC+07:00) Bangkok, Hanoi, Jakarta' },
  { value: 'Asia/Ho_Chi_Minh', label: '(UTC+07:00) Ho Chi Minh City' },
  { value: 'Asia/Krasnoyarsk', label: '(UTC+07:00) Krasnoyarsk' },
  { value: 'Asia/Novosibirsk', label: '(UTC+07:00) Novosibirsk' },
  { value: 'Asia/Jakarta', label: '(UTC+07:00) Jakarta' },
  // UTC+08:00
  { value: 'Asia/Shanghai', label: '(UTC+08:00) Beijing, Chongqing, Hong Kong, Urumqi' },
  { value: 'Asia/Singapore', label: '(UTC+08:00) Singapore' },
  { value: 'Asia/Taipei', label: '(UTC+08:00) Taipei' },
  { value: 'Asia/Hong_Kong', label: '(UTC+08:00) Hong Kong' },
  { value: 'Asia/Kuala_Lumpur', label: '(UTC+08:00) Kuala Lumpur' },
  { value: 'Asia/Manila', label: '(UTC+08:00) Manila' },
  { value: 'Australia/Perth', label: '(UTC+08:00) Perth' },
  { value: 'Asia/Irkutsk', label: '(UTC+08:00) Irkutsk' },
  { value: 'Asia/Makassar', label: '(UTC+08:00) Makassar' },
  { value: 'Asia/Brunei', label: '(UTC+08:00) Brunei' },
  // UTC+08:45
  { value: 'Australia/Eucla', label: '(UTC+08:45) Eucla' },
  // UTC+09:00
  { value: 'Asia/Tokyo', label: '(UTC+09:00) Osaka, Sapporo, Tokyo' },
  { value: 'Asia/Seoul', label: '(UTC+09:00) Seoul' },
  { value: 'Asia/Yakutsk', label: '(UTC+09:00) Yakutsk' },
  { value: 'Asia/Jayapura', label: '(UTC+09:00) Jayapura' },
  { value: 'Pacific/Palau', label: '(UTC+09:00) Palau' },
  { value: 'Asia/Dili', label: '(UTC+09:00) Dili' },
  // UTC+09:30
  { value: 'Australia/Darwin', label: '(UTC+09:30) Darwin' },
  { value: 'Australia/Adelaide', label: '(UTC+09:30) Adelaide' },
  // UTC+10:00
  { value: 'Australia/Brisbane', label: '(UTC+10:00) Brisbane' },
  { value: 'Australia/Sydney', label: '(UTC+10:00) Canberra, Melbourne, Sydney' },
  { value: 'Australia/Hobart', label: '(UTC+10:00) Hobart' },
  { value: 'Pacific/Guam', label: '(UTC+10:00) Guam, Port Moresby' },
  { value: 'Asia/Vladivostok', label: '(UTC+10:00) Vladivostok' },
  { value: 'Pacific/Port_Moresby', label: '(UTC+10:00) Port Moresby' },
  // UTC+10:30
  { value: 'Australia/Lord_Howe', label: '(UTC+10:30) Lord Howe Island' },
  // UTC+11:00
  { value: 'Pacific/Guadalcanal', label: '(UTC+11:00) Solomon Islands, New Caledonia' },
  { value: 'Pacific/Noumea', label: '(UTC+11:00) Noumea' },
  { value: 'Asia/Magadan', label: '(UTC+11:00) Magadan' },
  { value: 'Pacific/Norfolk', label: '(UTC+11:00) Norfolk Island' },
  { value: 'Pacific/Bougainville', label: '(UTC+11:00) Bougainville' },
  // UTC+12:00
  { value: 'Pacific/Auckland', label: '(UTC+12:00) Auckland, Wellington' },
  { value: 'Pacific/Fiji', label: '(UTC+12:00) Fiji' },
  { value: 'Asia/Kamchatka', label: '(UTC+12:00) Petropavlovsk-Kamchatsky' },
  { value: 'Pacific/Tarawa', label: '(UTC+12:00) Tarawa' },
  { value: 'Pacific/Majuro', label: '(UTC+12:00) Marshall Islands' },
  // UTC+12:45
  { value: 'Pacific/Chatham', label: '(UTC+12:45) Chatham Islands' },
  // UTC+13:00
  { value: 'Pacific/Tongatapu', label: "(UTC+13:00) Nuku'alofa" },
  { value: 'Pacific/Apia', label: '(UTC+13:00) Samoa' },
  { value: 'Pacific/Fakaofo', label: '(UTC+13:00) Tokelau' },
  // UTC+14:00
  { value: 'Pacific/Kiritimati', label: '(UTC+14:00) Kiritimati Island' },
] as const;

export type TimezoneValue = (typeof TIMEZONE_OPTIONS)[number]['value'];

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
 * Get the display label for a timezone value.
 * Returns the full Windows-style label like "(UTC-05:00) Eastern Time (US & Canada)"
 */
export function getTimezoneDisplayLabel(timezone: string): string {
  const option = TIMEZONE_OPTIONS.find((opt) => opt.value === timezone);
  return option?.label ?? timezone;
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
