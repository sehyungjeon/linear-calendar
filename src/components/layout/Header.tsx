import { useState, useRef, useEffect } from 'react';
import { useCalendarStore } from '../../store/calendarStore';
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';
import { JumpToDialog } from '../navigation/JumpToDialog';

export function Header() {
  const theme = useCalendarStore((s) => s.theme);
  const toggleTheme = useCalendarStore((s) => s.toggleTheme);
  const jumpToToday = useCalendarStore((s) => s.jumpToToday);
  const currentYear = useCalendarStore((s) => s.currentYear);
  const prevYear = useCalendarStore((s) => s.prevYear);
  const nextYear = useCalendarStore((s) => s.nextYear);
  const googleUser = useCalendarStore((s) => s.googleUser);
  const [showJump, setShowJump] = useState(false);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { disconnect, refresh, toggleCalendar, googleLoading, googleCalendars } = useGoogleCalendar();

  // Close calendar picker on outside click
  useEffect(() => {
    if (!showCalendarPicker) return;
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowCalendarPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showCalendarPicker]);

  // Close user menu on outside click
  useEffect(() => {
    if (!showUserMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showUserMenu]);

  const handleToday = () => {
    jumpToToday();
    requestAnimationFrame(() => {
      const currentMonth = new Date().getMonth() + 1;
      document.getElementById(`month-row-${currentMonth}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  return (
    <>
      <header className="flex items-center justify-between px-5 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)] no-print" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-[var(--color-accent)] flex items-center justify-center">
            <span className="text-white text-xs font-bold">L</span>
          </div>
          <h1 className="text-sm font-semibold tracking-tight text-[var(--color-text)]">
            Linear Calendar
          </h1>

          <div className="w-px h-5 bg-[var(--color-border)] mx-1" />

          {/* Year navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={prevYear}
              className="h-7 w-7 flex items-center justify-center rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-all"
              title="Previous year"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <span className="text-sm font-bold text-[var(--color-text)] min-w-[48px] text-center tabular-nums">
              {currentYear}
            </span>
            <button
              onClick={nextYear}
              className="h-7 w-7 flex items-center justify-center rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-all"
              title="Next year"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Calendar picker */}
          <div className="relative flex items-center gap-0.5" ref={pickerRef}>
            <button
              onClick={() => setShowCalendarPicker((v) => !v)}
              disabled={googleLoading}
              className="text-xs font-medium rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)] hover:brightness-95 transition-all disabled:opacity-50"
              style={{ height: 34, padding: '0 16px' }}
            >
              {googleLoading ? 'Syncing...' : `Calendars (${googleCalendars.filter(c => c.enabled).length})`}
            </button>
            <button
              onClick={refresh}
              disabled={googleLoading}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
            </button>

            {showCalendarPicker && googleCalendars.length > 0 && (
              <div className="absolute top-full right-0 mt-2 w-60 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden z-50" style={{ boxShadow: 'var(--shadow-lg)' }}>
                <div className="px-3 py-2.5 text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Calendars
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {googleCalendars.map((cal) => (
                    <label
                      key={cal.id}
                      className="flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--color-surface-alt)] cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={cal.enabled}
                        onChange={() => toggleCalendar(cal.id)}
                        className="w-3.5 h-3.5 rounded"
                        style={{ accentColor: cal.backgroundColor }}
                      />
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cal.backgroundColor }}
                      />
                      <span className="text-xs text-[var(--color-text)] truncate">
                        {cal.summary}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-[var(--color-border)] mx-1" />

          <button
            onClick={handleToday}
            className="text-xs font-semibold rounded-lg bg-[var(--color-accent)] text-white hover:brightness-110 transition-all"
            style={{ height: 34, padding: '0 16px' }}
          >
            Today
          </button>

          <button
            onClick={() => setShowJump(true)}
            className="text-xs font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-all"
            style={{ height: 34, padding: '0 16px' }}
          >
            Jump to...
          </button>

          <button
            onClick={toggleTheme}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-all"
            title={theme === 'light' ? 'Dark mode' : 'Light mode'}
          >
            {theme === 'light' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
              </svg>
            )}
          </button>

          {/* Print button */}
          <button
            onClick={() => window.print()}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-all"
            title="Print"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <path d="M6 9V3h12v6" />
              <rect x="6" y="14" width="12" height="8" rx="1" />
            </svg>
          </button>

          {/* User avatar + menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              className="h-8 w-8 rounded-full overflow-hidden border-2 border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors"
              title={googleUser?.name || 'Account'}
            >
              {googleUser?.picture ? (
                <img src={googleUser.picture} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-[var(--color-accent)] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {(googleUser?.name || '?')[0].toUpperCase()}
                  </span>
                </div>
              )}
            </button>

            {showUserMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden z-50" style={{ boxShadow: 'var(--shadow-lg)' }}>
                {googleUser && (
                  <div className="px-3 py-2.5 border-b border-[var(--color-border)]">
                    <div className="text-xs font-medium text-[var(--color-text)] truncate">{googleUser.name}</div>
                    <div className="text-[11px] text-[var(--color-text-secondary)] truncate">{googleUser.email}</div>
                  </div>
                )}
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    disconnect();
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs text-[var(--color-holiday-text)] hover:bg-[var(--color-surface-alt)] transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <JumpToDialog isOpen={showJump} onClose={() => setShowJump(false)} />
    </>
  );
}
