import { memo, useCallback, useState } from 'react';
import type { MonthCell, Holiday } from '../../types';
import { useDragContext } from '../../contexts/DragContext';

interface DayCellProps {
  cell: MonthCell;
  holiday?: Holiday;
  onClick?: (dateStr: string) => void;
}

export const DayCell = memo(function DayCell({ cell, holiday, onClick }: DayCellProps) {
  const { endDrag } = useDragContext();
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    if (cell.isValid) {
      endDrag(cell.dateStr);
    }
  }, [cell.isValid, cell.dateStr, endDrag]);

  if (!cell.isValid) {
    return <div className="h-full bg-[var(--color-surface-alt)] opacity-30" />;
  }

  return (
    <div
      className={`
        relative h-full border-r border-[var(--color-border)] cursor-pointer
        transition-colors duration-100
        hover:bg-[var(--color-accent)]/10
        ${cell.isWeekend ? 'bg-[var(--color-weekend-bg)]' : ''}
        ${cell.isToday ? 'ring-2 ring-inset ring-[var(--color-accent)]' : ''}
        ${isOver ? 'bg-[var(--color-accent)]/20' : ''}
        ${holiday ? 'bg-red-50 dark:bg-red-950/30' : ''}
      `}
      onClick={() => onClick?.(cell.dateStr)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      title={holiday ? `${cell.dateStr} - ${holiday.name}` : cell.dateStr}
    >
      {/* Date number */}
      <span
        className={`
          absolute top-0.5 left-0.5 text-[9px] leading-none
          ${cell.isToday ? 'text-[var(--color-accent)] font-bold' : 'text-[var(--color-text-secondary)] opacity-60'}
          ${holiday ? 'text-[var(--color-holiday-text)] font-semibold opacity-100' : ''}
        `}
      >
        {cell.day}
      </span>

      {holiday && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-holiday-text)]" />
      )}
    </div>
  );
});
