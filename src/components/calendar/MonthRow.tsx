import { memo, useMemo } from 'react';
import { DayCell } from './DayCell';
import { EventBar } from './EventBar';
import { getDaysInMonthCount, formatDateISO, isWeekendDay, isTodayDate } from '../../utils/dateHelpers';
import { layoutEventsForMonth } from '../../utils/eventLayout';
import { MONTH_NAMES, EVENT_HEIGHT, EVENT_GAP } from '../../utils/constants';
import { useHolidays } from '../../hooks/useHolidays';
import { useDragContext } from '../../contexts/DragContext';
import type { MonthCell } from '../../types';
import { useCalendarStore } from '../../store/calendarStore';

interface MonthRowProps {
  year: number;
  month: number; // 1-12
}

export const MonthRow = memo(function MonthRow({ year, month }: MonthRowProps) {
  const daysInMonth = getDaysInMonthCount(year, month);
  const localEvents = useCalendarStore((s) => s.events);
  const googleEvents = useCalendarStore((s) => s.googleEvents);
  const openCreateModal = useCalendarStore((s) => s.openCreateModal);
  const openEditModal = useCalendarStore((s) => s.openEditModal);

  // Merge local + Google events
  const events = useMemo(
    () => [...localEvents, ...googleEvents],
    [localEvents, googleEvents]
  );
  const holidays = useHolidays(year);
  const { isDragging } = useDragContext();

  const isJanuary = month === 1;

  const cells: MonthCell[] = useMemo(() => {
    const result: MonthCell[] = [];
    for (let day = 1; day <= 31; day++) {
      const isValid = day <= daysInMonth;
      result.push({
        year,
        month,
        day,
        isValid,
        isWeekend: isValid ? isWeekendDay(year, month, day) : false,
        isToday: isValid ? isTodayDate(year, month, day) : false,
        dateStr: isValid ? formatDateISO(year, month, day) : '',
      });
    }
    return result;
  }, [year, month, daysInMonth]);

  const positioned = useMemo(
    () => layoutEventsForMonth(events, year, month),
    [events, year, month]
  );

  const maxLane = positioned.length > 0
    ? Math.max(...positioned.map((p) => p.lane))
    : -1;
  const eventAreaHeight = maxLane >= 0 ? (maxLane + 1) * (EVENT_HEIGHT + EVENT_GAP) : 0;

  return (
    <div className="flex items-stretch relative" style={{ minHeight: 40 + eventAreaHeight }}>
      {/* Year divider line above January */}
      {isJanuary && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--color-year-divider)] z-10" />
      )}

      {/* Month label */}
      <div
        className={`
          w-[80px] min-w-[80px] flex flex-col items-center justify-center
          border-r border-[var(--color-border)]
          text-xs font-medium text-[var(--color-text-secondary)]
          ${isJanuary ? 'font-bold text-[var(--color-text)]' : ''}
        `}
      >
        {isJanuary && (
          <span className="text-[10px] font-bold text-[var(--color-accent)]">
            {year}
          </span>
        )}
        <span>{MONTH_NAMES[month - 1]}</span>
      </div>

      {/* Day cells grid + events overlay */}
      <div className="flex-1 relative">
        <div className="grid grid-cols-[repeat(31,1fr)] h-full">
          {cells.map((cell, i) => (
            <DayCell
              key={i}
              cell={cell}
              holiday={cell.isValid ? holidays.get(cell.dateStr) : undefined}
              onClick={cell.isValid ? openCreateModal : undefined}
            />
          ))}
        </div>

        {/* Events layer — always pointer-events-none so clicks pass through to cells */}
        {positioned.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {positioned.map((p) => (
              <div key={p.event.id} className={isDragging ? '' : 'pointer-events-auto'}>
                <EventBar
                  positioned={p}
                  onClickEvent={openEditModal}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
