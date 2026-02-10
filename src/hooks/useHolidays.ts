import { useMemo } from 'react';
import Holidays from 'date-holidays';
import type { Holiday } from '../types';

const hd = new Holidays('US');

export function useHolidays(year: number): Map<string, Holiday> {
  return useMemo(() => {
    const map = new Map<string, Holiday>();
    const holidays = hd.getHolidays(year);
    for (const h of holidays) {
      if (h.type === 'public' || h.type === 'bank') {
        const dateStr = h.date.slice(0, 10); // "YYYY-MM-DD"
        map.set(dateStr, {
          date: dateStr,
          name: h.name,
          type: h.type,
        });
      }
    }
    return map;
  }, [year]);
}
