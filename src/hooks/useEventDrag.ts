import { useState, useCallback, useRef } from 'react';
import { useCalendarStore } from '../store/calendarStore';
import { parseDateISO, formatDateISO } from '../utils/dateHelpers';
import { updateGoogleEvent } from '../services/googleCalendar';

export type DragType = 'move' | 'resize-start' | 'resize-end';

interface DragState {
  eventId: string;
  type: DragType;
  startDateStr: string; // date where drag started
}

export function useEventDrag() {
  const updateEvent = useCalendarStore((s) => s.updateEvent);
  const events = useCalendarStore((s) => s.events);
  const googleEvents = useCalendarStore((s) => s.googleEvents);
  const setGoogleEvents = useCalendarStore((s) => s.setGoogleEvents);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const startDrag = useCallback((eventId: string, type: DragType, startDateStr: string) => {
    const state = { eventId, type, startDateStr };
    setDragState(state);
    dragRef.current = state;
  }, []);

  const endDrag = useCallback((targetDateStr: string) => {
    const state = dragRef.current;
    if (!state || !targetDateStr) {
      setDragState(null);
      dragRef.current = null;
      return;
    }

    const isGoogle = state.eventId.startsWith('google-');
    const allEvents = isGoogle ? googleEvents : events;
    const event = allEvents.find((e) => e.id === state.eventId);
    if (!event) {
      setDragState(null);
      dragRef.current = null;
      return;
    }

    const originDate = new Date(state.startDateStr + 'T00:00:00');
    const targetDate = new Date(targetDateStr + 'T00:00:00');
    const dayDiff = Math.round((targetDate.getTime() - originDate.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDiff !== 0) {
      let newStartDate = event.startDate;
      let newEndDate = event.endDate;

      if (state.type === 'move') {
        const start = parseDateISO(event.startDate);
        const end = parseDateISO(event.endDate);
        const newStart = new Date(start.year, start.month - 1, start.day + dayDiff);
        const newEnd = new Date(end.year, end.month - 1, end.day + dayDiff);
        newStartDate = formatDateISO(newStart.getFullYear(), newStart.getMonth() + 1, newStart.getDate());
        newEndDate = formatDateISO(newEnd.getFullYear(), newEnd.getMonth() + 1, newEnd.getDate());
      } else if (state.type === 'resize-start') {
        const s = parseDateISO(event.startDate);
        const newStart = new Date(s.year, s.month - 1, s.day + dayDiff);
        const candidate = formatDateISO(newStart.getFullYear(), newStart.getMonth() + 1, newStart.getDate());
        if (candidate <= event.endDate) {
          newStartDate = candidate;
        }
      } else if (state.type === 'resize-end') {
        const e = parseDateISO(event.endDate);
        const newEnd = new Date(e.year, e.month - 1, e.day + dayDiff);
        const candidate = formatDateISO(newEnd.getFullYear(), newEnd.getMonth() + 1, newEnd.getDate());
        if (candidate >= event.startDate) {
          newEndDate = candidate;
        }
      }

      if (newStartDate !== event.startDate || newEndDate !== event.endDate) {
        if (isGoogle && event.calendarId) {
          // Optimistically update local state, then sync to Google
          const currentGoogleEvents = useCalendarStore.getState().googleEvents;
          setGoogleEvents(
            currentGoogleEvents.map((e) =>
              e.id === event.id ? { ...e, startDate: newStartDate, endDate: newEndDate } : e
            )
          );
          const googleId = event.id.replace(/^google-/, '');
          updateGoogleEvent(event.calendarId, googleId, {
            startDate: newStartDate,
            endDate: newEndDate,
          }).catch((err) => {
            console.error('Failed to sync drag to Google:', err);
          });
        } else {
          updateEvent(event.id, { startDate: newStartDate, endDate: newEndDate });
        }
      }
    }

    setDragState(null);
    dragRef.current = null;
  }, [events, googleEvents, updateEvent, setGoogleEvents]);

  const cancelDrag = useCallback(() => {
    setDragState(null);
    dragRef.current = null;
  }, []);

  return {
    dragState,
    startDrag,
    endDrag,
    cancelDrag,
    isDragging: dragState !== null,
    dragEventId: dragState?.eventId ?? null,
  };
}
