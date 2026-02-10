import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CalendarStore, ModalState } from '../types';

const initialModal: ModalState = {
  isOpen: false,
  mode: 'create',
};

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set) => ({
      // ── Events ──
      events: [],

      addEvent: (eventData) =>
        set((state) => ({
          events: [
            ...state.events,
            { ...eventData, id: crypto.randomUUID() },
          ],
        })),

      updateEvent: (id, updates) =>
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),

      deleteEvent: (id) =>
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
        })),

      // ── Modal ──
      modal: initialModal,

      openCreateModal: (prefillDate) =>
        set({
          modal: { isOpen: true, mode: 'create', prefillDate },
        }),

      openEditModal: (eventId) =>
        set({
          modal: { isOpen: true, mode: 'edit', eventId },
        }),

      closeModal: () =>
        set({ modal: initialModal }),

      // ── Theme ──
      theme: 'light',

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),

      // ── Navigation ──
      currentYear: new Date().getFullYear(),

      setYear: (year) =>
        set({ currentYear: Math.max(2000, Math.min(2049, year)) }),

      prevYear: () =>
        set((state) => ({ currentYear: Math.max(2000, state.currentYear - 1) })),

      nextYear: () =>
        set((state) => ({ currentYear: Math.min(2049, state.currentYear + 1) })),

      jumpToToday: () =>
        set({ currentYear: new Date().getFullYear() }),

      // ── Google Calendar ──
      googleEvents: [],
      googleConnected: false,
      googleLoading: false,
      googleCalendars: [],
      googleUser: null,

      setGoogleEvents: (events) =>
        set({ googleEvents: events }),

      setGoogleConnected: (connected) =>
        set({ googleConnected: connected }),

      setGoogleLoading: (loading) =>
        set({ googleLoading: loading }),

      setGoogleCalendars: (calendars) =>
        set({ googleCalendars: calendars }),

      setGoogleUser: (user) =>
        set({ googleUser: user }),

      toggleGoogleCalendar: (calendarId) =>
        set((state) => ({
          googleCalendars: state.googleCalendars.map((c) =>
            c.id === calendarId ? { ...c, enabled: !c.enabled } : c
          ),
        })),
    }),
    {
      name: 'linear-calendar-storage',
      partialize: (state) => ({
        events: state.events,
        theme: state.theme,
        currentYear: state.currentYear,
      }),
    }
  )
);
