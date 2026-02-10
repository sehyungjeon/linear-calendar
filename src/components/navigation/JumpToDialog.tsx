import { useState, useRef, useEffect } from 'react';
import { useCalendarStore } from '../../store/calendarStore';
import { MONTH_NAMES } from '../../utils/constants';

interface JumpToDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JumpToDialog({ isOpen, onClose }: JumpToDialogProps) {
  const setStoreYear = useCalendarStore((s) => s.setYear);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (year >= 2000 && year <= 2049 && month >= 1 && month <= 12) {
      setStoreYear(year);
      onClose();
      requestAnimationFrame(() => {
        document.getElementById(`month-row-${month}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-[300px]"
        style={{ boxShadow: 'var(--shadow-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">
          Jump to Month
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-3">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]"
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
            <input
              ref={inputRef}
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              min={2000}
              max={2049}
              className="w-[80px] px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-xs font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 px-4 text-xs font-semibold rounded-lg bg-[var(--color-accent)] text-white hover:brightness-110 transition-all"
            >
              Go
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
