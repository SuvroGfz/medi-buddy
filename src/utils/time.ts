import { format, parse, isAfter, isBefore, isEqual, addMinutes } from 'date-fns';

/** Format HH:mm (24h) → display string like "9:00 AM" */
export function formatTime(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return format(date, 'h:mm a');
}

/** Parse "h:mm a" → "HH:mm" */
export function parseDisplayTime(display: string): string {
  const date = parse(display, 'h:mm a', new Date());
  return format(date, 'HH:mm');
}

/** Get current time as HH:mm */
export function nowTime(): string {
  return format(new Date(), 'HH:mm');
}

/** Get today's ISO date string */
export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/** Get current ISO timestamp */
export function nowISO(): string {
  return new Date().toISOString();
}

/** Compare two HH:mm times: returns -1, 0, or 1 */
export function compareTimes(a: string, b: string): number {
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  if (ah !== bh) return ah < bh ? -1 : 1;
  if (am !== bm) return am < bm ? -1 : 1;
  return 0;
}

/** Check if time HH:mm has passed today */
export function hasTimePassed(time24: string): boolean {
  return compareTimes(time24, nowTime()) < 0;
}

/** Get a Date object for today at HH:mm */
export function todayAt(time24: string): Date {
  const [hours, minutes] = time24.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/** Get a Date object for the next occurrence of HH:mm (today or tomorrow) */
export function nextOccurrence(time24: string): Date {
  const target = todayAt(time24);
  if (target <= new Date()) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

/** Get day of week as 1=Mon..7=Sun (ISO standard) */
export function todayDayOfWeek(): number {
  const day = new Date().getDay(); // 0=Sun..6=Sat
  return day === 0 ? 7 : day;
}

/** Check if today matches the days_of_week CSV string */
export function isTodayScheduled(daysOfWeek: string): boolean {
  const today = todayDayOfWeek().toString();
  return daysOfWeek.split(',').includes(today);
}

/** Add minutes to a Date */
export function addMins(date: Date, mins: number): Date {
  return addMinutes(date, mins);
}
