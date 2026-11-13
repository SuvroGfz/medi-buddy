/** Get the current device timezone string (e.g., 'Asia/Dhaka') */
export function getDeviceTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Get UTC offset in minutes for a timezone at a given date */
export function getTimezoneOffset(timezone: string, date?: Date): number {
  const d = date ?? new Date();
  // Format the date in the target timezone and in UTC, then compute the difference
  const utcStr = d.toLocaleString('en-US', { timeZone: 'UTC' });
  const tzStr = d.toLocaleString('en-US', { timeZone: timezone });
  const utcDate = new Date(utcStr);
  const tzDate = new Date(tzStr);
  return Math.round((tzDate.getTime() - utcDate.getTime()) / 60000);
}

/** Calculate the difference in minutes between two timezones */
export function getOffsetDifference(
  homeTimezone: string,
  currentTimezone: string,
  date?: Date,
): number {
  return getTimezoneOffset(currentTimezone, date) - getTimezoneOffset(homeTimezone, date);
}

/**
 * Adjust a HH:mm time string by an offset in minutes.
 * Wraps around midnight. Returns { time, dayShift } where dayShift is -1, 0, or +1.
 */
export function adjustTime(
  time: string,
  offsetMinutes: number,
): { time: string; dayShift: number } {
  const [hours, minutes] = time.split(':').map(Number);
  let totalMinutes = hours * 60 + minutes + offsetMinutes;

  let dayShift = 0;
  if (totalMinutes >= 1440) {
    dayShift = 1;
    totalMinutes -= 1440;
  } else if (totalMinutes < 0) {
    dayShift = -1;
    totalMinutes += 1440;
  }

  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const formatted = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

  return { time: formatted, dayShift };
}

/** Check if the device timezone differs from the stored home timezone */
export function hasTimezoneChanged(homeTimezone: string): boolean {
  return getDeviceTimezone() !== homeTimezone;
}
