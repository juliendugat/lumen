import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

export type ISODate = string; // YYYY-MM-DD

export function toISO(d: Date): ISODate {
  return format(d, 'yyyy-MM-dd');
}

export function fromISO(s: ISODate): Date {
  return parseISO(s);
}

export function todayISO(now: Date = new Date()): ISODate {
  return toISO(now);
}

export function addDaysISO(d: ISODate, n: number): ISODate {
  return toISO(addDays(fromISO(d), n));
}

export function diffDays(a: ISODate, b: ISODate): number {
  return differenceInCalendarDays(fromISO(a), fromISO(b));
}
