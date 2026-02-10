import { memo } from 'react';
import { DAY_HEADER_HEIGHT } from '../../utils/constants';

export const DayColumnHeaders = memo(function DayColumnHeaders() {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div
      className="flex items-center sticky top-0 z-20 bg-[var(--color-background)] border-b-2 border-[var(--color-border)]"
      style={{ height: DAY_HEADER_HEIGHT }}
    >
      {/* Spacer for month label column */}
      <div className="w-[80px] min-w-[80px] h-full border-r border-[var(--color-border)]" />

      {/* Day number headers */}
      <div className="flex-1 grid grid-cols-[repeat(31,1fr)] h-full">
        {days.map((day) => (
          <div
            key={day}
            className="flex items-center justify-center text-xs font-medium text-[var(--color-text-secondary)] border-r border-[var(--color-border)]"
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
});
