import { useCallback, useEffect } from 'react';
import { useCalendarStore } from '../store/calendarStore';
import type { GoogleCalendarInfo } from '../types';
import {
  initGoogleAuth,
  requestAccessToken,
  revokeToken,
  fetchGoogleEvents,
  fetchCalendarList,
  fetchUserProfile,
  isSignedIn,
  updateGoogleEvent,
  deleteGoogleEvent,
  createGoogleEvent,
} from '../services/googleCalendar';

export function useGoogleCalendar() {
  const setGoogleEvents = useCalendarStore((s) => s.setGoogleEvents);
  const setGoogleConnected = useCalendarStore((s) => s.setGoogleConnected);
  const setGoogleLoading = useCalendarStore((s) => s.setGoogleLoading);
  const setGoogleCalendars = useCalendarStore((s) => s.setGoogleCalendars);
  const googleConnected = useCalendarStore((s) => s.googleConnected);
  const googleLoading = useCalendarStore((s) => s.googleLoading);
  const googleCalendars = useCalendarStore((s) => s.googleCalendars);
  const currentYear = useCalendarStore((s) => s.currentYear);

  const fetchEventsForEnabled = useCallback(async (calendars: GoogleCalendarInfo[]) => {
    const enabled = calendars.filter((c) => c.enabled);
    if (enabled.length === 0) {
      setGoogleEvents([]);
      return;
    }

    const year = useCalendarStore.getState().currentYear;
    const timeMin = `${year}-01-01`;
    const timeMax = `${year}-12-31`;

    const allEvents = await Promise.all(
      enabled.map((cal) =>
        fetchGoogleEvents(timeMin, timeMax, cal.id).then((events) =>
          events.map((e) => ({ ...e, color: cal.backgroundColor }))
        ).catch(() => [])
      )
    );
    setGoogleEvents(allEvents.flat());
  }, [setGoogleEvents]);

  const setGoogleUser = useCalendarStore((s) => s.setGoogleUser);

  const connect = useCallback(async () => {
    try {
      setGoogleLoading(true);
      await initGoogleAuth();
      await requestAccessToken();
      setGoogleConnected(true);
      localStorage.setItem('linear-calendar-google-connected', 'true');

      // Fetch user profile and calendar list in parallel
      const [profile, calList] = await Promise.all([
        fetchUserProfile().catch(() => null),
        fetchCalendarList(),
      ]);
      if (profile) setGoogleUser(profile);

      const calendars: GoogleCalendarInfo[] = calList.map((c) => ({
        ...c,
        enabled: true,
      }));
      setGoogleCalendars(calendars);

      await fetchEventsForEnabled(calendars);
    } catch (err) {
      console.error('Google Calendar connect error:', err);
      setGoogleConnected(false);
      localStorage.removeItem('linear-calendar-google-connected');
    } finally {
      setGoogleLoading(false);
    }
  }, [setGoogleEvents, setGoogleConnected, setGoogleLoading, setGoogleCalendars, setGoogleUser, fetchEventsForEnabled]);

  const disconnect = useCallback(() => {
    revokeToken();
    setGoogleConnected(false);
    setGoogleEvents([]);
    setGoogleCalendars([]);
    setGoogleUser(null);
    localStorage.removeItem('linear-calendar-google-connected');
  }, [setGoogleConnected, setGoogleEvents, setGoogleCalendars, setGoogleUser]);

  const refresh = useCallback(async () => {
    if (!isSignedIn()) return;

    try {
      setGoogleLoading(true);
      await fetchEventsForEnabled(googleCalendars);
    } catch (err) {
      console.error('Google Calendar refresh error:', err);
      if (String(err).includes('Token expired')) {
        setGoogleConnected(false);
        setGoogleEvents([]);
      }
    } finally {
      setGoogleLoading(false);
    }
  }, [googleCalendars, setGoogleEvents, setGoogleConnected, setGoogleLoading, fetchEventsForEnabled]);

  const toggleCalendar = useCallback(async (calendarId: string) => {
    const updated = googleCalendars.map((c) =>
      c.id === calendarId ? { ...c, enabled: !c.enabled } : c
    );
    setGoogleCalendars(updated);

    if (isSignedIn()) {
      try {
        setGoogleLoading(true);
        await fetchEventsForEnabled(updated);
      } finally {
        setGoogleLoading(false);
      }
    }
  }, [googleCalendars, setGoogleCalendars, setGoogleLoading, fetchEventsForEnabled]);

  // Re-fetch events when the displayed year changes
  useEffect(() => {
    if (googleConnected && isSignedIn() && googleCalendars.length > 0) {
      setGoogleLoading(true);
      fetchEventsForEnabled(googleCalendars).finally(() => setGoogleLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentYear]);

  /** Update a Google Calendar event via API, then optimistically update local state */
  const editGoogleEvent = useCallback(async (
    eventId: string,
    updates: { title?: string; startDate?: string; endDate?: string; description?: string }
  ) => {
    const currentEvents = useCalendarStore.getState().googleEvents;
    const event = currentEvents.find((e) => e.id === eventId);
    if (!event || !event.calendarId) return;

    const googleId = eventId.replace(/^google-/, '');
    await updateGoogleEvent(event.calendarId, googleId, updates);

    // Optimistically update local state
    setGoogleEvents(
      currentEvents.map((e) =>
        e.id === eventId ? { ...e, ...updates } : e
      )
    );
  }, [setGoogleEvents]);

  /** Create a new event on Google primary calendar */
  const addGoogleEvent = useCallback(async (
    event: { title: string; startDate: string; endDate: string; description?: string }
  ) => {
    const created = await createGoogleEvent('primary', event);
    // Find primary calendar's color
    const cals = useCalendarStore.getState().googleCalendars;
    const primaryCal = cals.find((c) => c.id === 'primary') || cals[0];
    const colored = primaryCal
      ? { ...created, color: primaryCal.backgroundColor }
      : created;

    const currentEvents = useCalendarStore.getState().googleEvents;
    setGoogleEvents([...currentEvents, colored]);
  }, [setGoogleEvents]);

  /** Delete a Google Calendar event via API, then remove from local state */
  const removeGoogleEvent = useCallback(async (eventId: string) => {
    const currentEvents = useCalendarStore.getState().googleEvents;
    const event = currentEvents.find((e) => e.id === eventId);
    if (!event || !event.calendarId) return;

    const googleId = eventId.replace(/^google-/, '');
    await deleteGoogleEvent(event.calendarId, googleId);

    setGoogleEvents(currentEvents.filter((e) => e.id !== eventId));
  }, [setGoogleEvents]);

  return {
    connect,
    disconnect,
    refresh,
    toggleCalendar,
    addGoogleEvent,
    editGoogleEvent,
    removeGoogleEvent,
    googleConnected,
    googleLoading,
    googleCalendars,
  };
}
