export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD" (inclusive)
  color: string;     // hex color
  description?: string;
  calendarId?: string; // Google Calendar ID (for Google events)
}

export interface Holiday {
  date: string;   // "YYYY-MM-DD"
  name: string;
  type: string;   // "public" | "bank" | "observance" etc.
}

export interface MonthCell {
  year: number;
  month: number; // 1-12
  day: number;   // 1-31
  isValid: boolean;
  isWeekend: boolean;
  isToday: boolean;
  dateStr: string; // "YYYY-MM-DD"
}

export interface PositionedEvent {
  event: CalendarEvent;
  startCol: number; // 0-based column index within month row
  endCol: number;   // 0-based column index (inclusive)
  lane: number;     // vertical stacking lane (0, 1, 2...)
  isStart: boolean; // does event start in this month?
  isEnd: boolean;   // does event end in this month?
}

export interface ModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  eventId?: string;
  prefillDate?: string; // "YYYY-MM-DD" for pre-filling on cell click
}

export interface GoogleCalendarInfo {
  id: string;
  summary: string;
  backgroundColor: string;
  enabled: boolean;
}

export interface ThemeConfig {
  id: string;
  name: string;
  variables: Record<string, string>;
}

export interface CalendarStore {
  // Events
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;

  // Modal
  modal: ModalState;
  openCreateModal: (prefillDate?: string) => void;
  openEditModal: (eventId: string) => void;
  closeModal: () => void;

  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Navigation
  currentYear: number;
  setYear: (year: number) => void;
  prevYear: () => void;
  nextYear: () => void;
  jumpToToday: () => void;

  // Google Calendar
  googleEvents: CalendarEvent[];
  googleConnected: boolean;
  googleLoading: boolean;
  googleCalendars: GoogleCalendarInfo[];
  googleUser: { name: string; email: string; picture: string } | null;
  setGoogleEvents: (events: CalendarEvent[]) => void;
  setGoogleConnected: (connected: boolean) => void;
  setGoogleLoading: (loading: boolean) => void;
  setGoogleCalendars: (calendars: GoogleCalendarInfo[]) => void;
  setGoogleUser: (user: { name: string; email: string; picture: string } | null) => void;
  toggleGoogleCalendar: (calendarId: string) => void;
}
