import type { CalendarEvent, PositionedEvent } from '../types';
import { getDaysInMonthCount, formatDateISO } from './dateHelpers';

/**
 * Given a list of events and a specific year/month,
 * compute which events are visible in that month and
 * assign each a lane (vertical position) to avoid overlaps.
 */
export function layoutEventsForMonth(
  events: CalendarEvent[],
  year: number,
  month: number
): PositionedEvent[] {
  const daysInMonth = getDaysInMonthCount(year, month);
  const monthStart = formatDateISO(year, month, 1);
  const monthEnd = formatDateISO(year, month, daysInMonth);

  // Filter events that overlap with this month
  const relevant = events.filter(
    (e) => e.startDate <= monthEnd && e.endDate >= monthStart
  );

  if (relevant.length === 0) return [];

  // Sort by start date, then by longer duration first (for better packing)
  relevant.sort((a, b) => {
    if (a.startDate !== b.startDate) return a.startDate < b.startDate ? -1 : 1;
    // Longer events first
    return b.endDate < a.endDate ? -1 : b.endDate > a.endDate ? 1 : 0;
  });

  const positioned: PositionedEvent[] = [];
  // lanes[i] = end column of the last event placed in lane i
  const lanes: number[] = [];

  for (const event of relevant) {
    // Compute column positions within this month
    const eventStartDay = event.startDate < monthStart ? 1 : parseInt(event.startDate.slice(8), 10);
    const eventEndDay = event.endDate > monthEnd ? daysInMonth : parseInt(event.endDate.slice(8), 10);

    const startCol = eventStartDay - 1; // 0-based
    const endCol = eventEndDay - 1;     // 0-based inclusive

    const isStart = event.startDate >= monthStart;
    const isEnd = event.endDate <= monthEnd;

    // Find the first lane where this event fits
    let lane = 0;
    while (lane < lanes.length && lanes[lane] >= startCol) {
      lane++;
    }

    if (lane >= lanes.length) {
      lanes.push(endCol);
    } else {
      lanes[lane] = endCol;
    }

    positioned.push({
      event,
      startCol,
      endCol,
      lane,
      isStart,
      isEnd,
    });
  }

  return positioned;
}
