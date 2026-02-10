import { useState, useEffect } from 'react';
import { useCalendarStore } from '../../store/calendarStore';
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';
import { DEFAULT_EVENT_COLORS } from '../../utils/constants';

export function EventModal() {
  const modal = useCalendarStore((s) => s.modal);
  const localEvents = useCalendarStore((s) => s.events);
  const googleEvents = useCalendarStore((s) => s.googleEvents);
  const addEvent = useCalendarStore((s) => s.addEvent);
  const updateEvent = useCalendarStore((s) => s.updateEvent);
  const deleteEvent = useCalendarStore((s) => s.deleteEvent);
  const closeModal = useCalendarStore((s) => s.closeModal);
  const googleConnected = useCalendarStore((s) => s.googleConnected);
  const { addGoogleEvent, editGoogleEvent, removeGoogleEvent } = useGoogleCalendar();

  const allEvents = [...localEvents, ...googleEvents];
  const editingEvent = modal.mode === 'edit' && modal.eventId
    ? allEvents.find((e) => e.id === modal.eventId)
    : undefined;
  const isGoogleEvent = editingEvent?.id.startsWith('google-') ?? false;

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [color, setColor] = useState<string>(DEFAULT_EVENT_COLORS[0]);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (modal.isOpen) {
      if (editingEvent) {
        setTitle(editingEvent.title);
        setStartDate(editingEvent.startDate);
        setEndDate(editingEvent.endDate);
        setColor(editingEvent.color);
        setDescription(editingEvent.description || '');
      } else {
        setTitle('');
        setStartDate(modal.prefillDate || '');
        setEndDate(modal.prefillDate || '');
        setColor(DEFAULT_EVENT_COLORS[0]);
        setDescription('');
      }
      setSaving(false);
    }
  }, [modal.isOpen, editingEvent, modal.prefillDate]);

  if (!modal.isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) return;

    const adjustedEnd = endDate < startDate ? startDate : endDate;

    if (isGoogleEvent && modal.eventId) {
      setSaving(true);
      try {
        await editGoogleEvent(modal.eventId, {
          title: title.trim(),
          startDate,
          endDate: adjustedEnd,
          description: description.trim() || undefined,
        });
        closeModal();
      } catch (err: any) {
        console.error('Failed to update Google event:', err);
        alert(`Failed to update Google Calendar event.\n${err?.message || err}`);
      } finally {
        setSaving(false);
      }
    } else if (modal.mode === 'edit' && modal.eventId) {
      updateEvent(modal.eventId, {
        title: title.trim(),
        startDate,
        endDate: adjustedEnd,
        color,
        description: description.trim() || undefined,
      });
      closeModal();
    } else if (googleConnected) {
      setSaving(true);
      try {
        await addGoogleEvent({
          title: title.trim(),
          startDate,
          endDate: adjustedEnd,
          description: description.trim() || undefined,
        });
        closeModal();
      } catch (err: any) {
        console.error('Failed to create Google event:', err);
        alert(`Failed to create Google Calendar event.\n${err?.message || err}`);
      } finally {
        setSaving(false);
      }
    } else {
      addEvent({
        title: title.trim(),
        startDate,
        endDate: adjustedEnd,
        color,
        description: description.trim() || undefined,
      });
      closeModal();
    }
  };

  const handleDelete = async () => {
    if (modal.mode === 'edit' && modal.eventId) {
      if (isGoogleEvent) {
        setSaving(true);
        try {
          await removeGoogleEvent(modal.eventId);
          closeModal();
        } catch (err) {
          console.error('Failed to delete Google event:', err);
          alert('Failed to delete Google Calendar event.');
        } finally {
          setSaving(false);
        }
      } else {
        deleteEvent(modal.eventId);
        closeModal();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={closeModal}
    >
      <div
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-[360px]"
        style={{ boxShadow: 'var(--shadow-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-5">
          {modal.mode === 'edit'
            ? isGoogleEvent ? 'Edit Google Event' : 'Edit Event'
            : 'New Event'}
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] text-sm placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]"
          />

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[11px] font-medium text-[var(--color-text-secondary)] mb-1 block uppercase tracking-wider">Start</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]"
              />
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-medium text-[var(--color-text-secondary)] mb-1 block uppercase tracking-wider">End</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]"
              />
            </div>
          </div>

          {!isGoogleEvent && (
            <div>
              <label className="text-[11px] font-medium text-[var(--color-text-secondary)] mb-1.5 block uppercase tracking-wider">Color</label>
              <div className="flex gap-2">
                {DEFAULT_EVENT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-all ${
                      color === c ? 'ring-2 ring-offset-2 ring-[var(--color-accent)] scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c, ringOffsetColor: 'var(--color-surface)' } as React.CSSProperties}
                  />
                ))}
              </div>
            </div>
          )}

          {isGoogleEvent && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
              </svg>
              <span className="text-[11px] font-medium">Changes sync to Google Calendar</span>
            </div>
          )}

          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] text-sm resize-none placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]"
          />

          <div className="flex gap-2 justify-end pt-1">
            {modal.mode === 'edit' && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="h-9 px-3 text-xs font-medium rounded-lg text-[var(--color-holiday-text)] hover:bg-[var(--color-holiday-text)]/10 transition-all mr-auto disabled:opacity-50"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={closeModal}
              className="h-9 px-4 text-xs font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-9 px-4 text-xs font-semibold rounded-lg bg-[var(--color-accent)] text-white hover:brightness-110 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : modal.mode === 'edit' ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
