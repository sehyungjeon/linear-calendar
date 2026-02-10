import { useEffect, useRef } from 'react';
import { useCalendarStore } from '../store/calendarStore';
import { useGoogleCalendar } from './useGoogleCalendar';

const STORAGE_KEY = 'linear-calendar-google-connected';

export function useAutoReconnect() {
  const attempted = useRef(false);
  const googleConnected = useCalendarStore((s) => s.googleConnected);
  const { connect } = useGoogleCalendar();

  useEffect(() => {
    if (attempted.current || googleConnected) return;
    attempted.current = true;

    const wasConnected = localStorage.getItem(STORAGE_KEY);
    if (!wasConnected) return;

    // Attempt silent reconnect
    connect().catch(() => {
      localStorage.removeItem(STORAGE_KEY);
    });
  }, [googleConnected, connect]);
}
