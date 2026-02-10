import { getDaysInMonth, isWeekend, isToday, format, parse } from 'date-fns';

/** Get number of days in a given year/month */
export function getDaysInMonthCount(year: number, month: number): number {
  return getDaysInMonth(new Date(year, month - 1));
}

/** Format a date as "YYYY-MM-DD" */
export function formatDateISO(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/** Check if a given date is a weekend (Sat or Sun) */
export function isWeekendDay(year: number, month: number, day: number): boolean {
  return isWeekend(new Date(year, month - 1, day));
}

/** Check if a given date is today */
export function isTodayDate(year: number, month: number, day: number): boolean {
  return isToday(new Date(year, month - 1, day));
}

/** Get a display label like "Jan 2026" */
export function getMonthLabel(year: number, month: number): string {
  return format(new Date(year, month - 1, 1), 'MMM yyyy');
}

/** Parse "YYYY-MM-DD" string into { year, month, day } */
export function parseDateISO(dateStr: string): { year: number; month: number; day: number } {
  const d = parse(dateStr, 'yyyy-MM-dd', new Date());
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}
