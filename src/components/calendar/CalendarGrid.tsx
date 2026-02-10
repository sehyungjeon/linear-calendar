import { MonthRow } from './MonthRow';
import { DayColumnHeaders } from '../layout/DayColumnHeaders';
import { useCalendarStore } from '../../store/calendarStore';
import { useEventDrag } from '../../hooks/useEventDrag';
import { DragContext } from '../../contexts/DragContext';

const months = Array.from({ length: 12 }, (_, i) => i + 1);

export function CalendarGrid() {
  const currentYear = useCalendarStore((s) => s.currentYear);
  const { isDragging, dragEventId, startDrag, endDrag, cancelDrag } = useEventDrag();

  return (
    <DragContext.Provider value={{ isDragging, dragEventId, startDrag, endDrag, cancelDrag }}>
      <div className="flex-1 overflow-auto">
        <div className="relative w-full">
          <DayColumnHeaders />
          {/* Print-only year title */}
          <div className="hidden print-year-title">{currentYear}</div>
          {months.map((month) => (
            <div
              key={month}
              id={`month-row-${month}`}
              className="w-full border-b border-[var(--color-border)] month-row"
            >
              <MonthRow year={currentYear} month={month} />
            </div>
          ))}
        </div>
      </div>
    </DragContext.Provider>
  );
}
