import { useEffect } from 'react';
import { Header } from './components/layout/Header';
import { CalendarGrid } from './components/calendar/CalendarGrid';
import { EventModal } from './components/events/EventModal';
import { LandingPage } from './components/auth/LandingPage';
import { useCalendarStore } from './store/calendarStore';
import { useAutoReconnect } from './hooks/useAutoReconnect';

function App() {
  const theme = useCalendarStore((s) => s.theme);
  const modal = useCalendarStore((s) => s.modal);
  const closeModal = useCalendarStore((s) => s.closeModal);
  const jumpToToday = useCalendarStore((s) => s.jumpToToday);
  const toggleTheme = useCalendarStore((s) => s.toggleTheme);
  const prevYear = useCalendarStore((s) => s.prevYear);
  const nextYear = useCalendarStore((s) => s.nextYear);
  const googleConnected = useCalendarStore((s) => s.googleConnected);

  useAutoReconnect();

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      if (e.key === 'Escape' && modal.isOpen) {
        closeModal();
      } else if (e.key === 't' || e.key === 'T') {
        jumpToToday();
        requestAnimationFrame(() => {
          const currentMonth = new Date().getMonth() + 1;
          document.getElementById(`month-row-${currentMonth}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      } else if (e.key === 'd' || e.key === 'D') {
        toggleTheme();
      } else if (e.key === 'ArrowLeft') {
        prevYear();
      } else if (e.key === 'ArrowRight') {
        nextYear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modal.isOpen, closeModal, jumpToToday, toggleTheme, prevYear, nextYear]);

  if (!googleConnected) {
    return <LandingPage />;
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <CalendarGrid />
      <EventModal />
    </div>
  );
}

export default App;
