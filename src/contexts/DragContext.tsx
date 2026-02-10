import { createContext, useContext } from 'react';
import type { DragType } from '../hooks/useEventDrag';

interface DragContextValue {
  isDragging: boolean;
  dragEventId: string | null;
  startDrag: (eventId: string, type: DragType, startDateStr: string) => void;
  endDrag: (targetDateStr: string) => void;
  cancelDrag: () => void;
}

export const DragContext = createContext<DragContextValue>({
  isDragging: false,
  dragEventId: null,
  startDrag: () => {},
  endDrag: () => {},
  cancelDrag: () => {},
});

export const useDragContext = () => useContext(DragContext);
