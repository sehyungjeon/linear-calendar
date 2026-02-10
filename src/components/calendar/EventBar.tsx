import { memo, useCallback } from 'react';
import type { PositionedEvent } from '../../types';
import { EVENT_HEIGHT, EVENT_GAP } from '../../utils/constants';
import { useDragContext } from '../../contexts/DragContext';

interface EventBarProps {
  positioned: PositionedEvent;
  onClickEvent: (eventId: string) => void;
}

export const EventBar = memo(function EventBar({ positioned, onClickEvent }: EventBarProps) {
  const { event, startCol, endCol, lane, isStart, isEnd } = positioned;
  const { startDrag, dragEventId } = useDragContext();
  const colSpan = endCol - startCol + 1;
  const isBeingDragged = dragEventId === event.id;

  const left = `${(startCol / 31) * 100}%`;
  const width = `${(colSpan / 31) * 100}%`;
  const top = lane * (EVENT_HEIGHT + EVENT_GAP);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.id);
    startDrag(event.id, 'move', event.startDate);
  }, [event.id, event.startDate, startDrag]);

  const handleResizeStartDrag = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.id);
    startDrag(event.id, 'resize-start', event.startDate);
  }, [event.id, event.startDate, startDrag]);

  const handleResizeEndDrag = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.id);
    startDrag(event.id, 'resize-end', event.endDate);
  }, [event.id, event.endDate, startDrag]);

  return (
    <div
      className={`absolute cursor-grab active:cursor-grabbing text-white text-[10px] leading-tight flex items-center overflow-hidden whitespace-nowrap hover:brightness-110 transition-all select-none ${
        isBeingDragged ? 'opacity-40' : ''
      }`}
      draggable
      onDragStart={handleDragStart}
      style={{
        left,
        width,
        top: `${top}px`,
        height: `${EVENT_HEIGHT}px`,
        backgroundColor: event.color,
        borderRadius: `${isStart ? 3 : 0}px ${isEnd ? 3 : 0}px ${isEnd ? 3 : 0}px ${isStart ? 3 : 0}px`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClickEvent(event.id);
      }}
      title={event.title}
    >
      {/* Left resize handle */}
      {isStart && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[6px] cursor-col-resize hover:bg-white/30 z-10"
          draggable
          onDragStart={handleResizeStartDrag}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      <span className="truncate font-medium px-1.5">{isStart ? event.title : ''}</span>

      {/* Right resize handle */}
      {isEnd && (
        <div
          className="absolute right-0 top-0 bottom-0 w-[6px] cursor-col-resize hover:bg-white/30 z-10"
          draggable
          onDragStart={handleResizeEndDrag}
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
});
