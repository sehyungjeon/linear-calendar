# Linear Calendar

A minimal, linear year-at-a-glance calendar synced with Google Calendar.

**Live:** https://stayoung.io/calendar

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| CSS | Tailwind CSS 4 (`@tailwindcss/vite` plugin) |
| State | Zustand 5 (with `persist` middleware) |
| Holidays | `date-holidays` |
| Date utils | `date-fns` |
| Hosting | Hostinger (static files) |

---

## Project Structure

```
src/
  App.tsx                          # Root: auth gating, keyboard shortcuts, theme
  main.tsx                         # React entry point
  index.css                        # Global CSS, CSS variables, print styles

  components/
    auth/
      LandingPage.tsx              # Google sign-in landing page
    calendar/
      CalendarGrid.tsx             # 12-month grid renderer (year view)
      MonthRow.tsx                 # Single month row (label + day cells + events)
      DayCell.tsx                  # Individual day cell (click to create event)
      EventBar.tsx                 # Horizontal event bar spanning days
    events/
      EventModal.tsx               # Create/edit event dialog
    layout/
      Header.tsx                   # Top bar: year nav, buttons, user menu
      DayColumnHeaders.tsx         # Sticky day-of-month column headers (1-31)
    navigation/
      JumpToDialog.tsx             # Jump to specific month/year dialog
    ads/
      AdBanner.tsx                 # Google AdSense component (placeholder)

  hooks/
    useGoogleCalendar.ts           # Google Calendar CRUD + sync logic
    useAutoReconnect.ts            # Silent re-auth on page reload
    useEventDrag.ts                # Drag-and-drop event state
    useHolidays.ts                 # Holiday data via date-holidays

  services/
    googleCalendar.ts              # Google API calls (auth, events, profile)

  store/
    calendarStore.ts               # Zustand store (events, theme, nav, google)

  contexts/
    DragContext.tsx                 # Drag-and-drop context provider

  types/
    index.ts                       # All TypeScript interfaces
    google.d.ts                    # Google Identity Services type declarations

  utils/
    constants.ts                   # Layout constants, month names, colors
    dateHelpers.ts                 # Date formatting/parsing utilities
    eventLayout.ts                 # Event lane positioning algorithm

public/
  .htaccess                        # SPA routing, security headers, caching
  privacy.html                     # Privacy policy page
  terms.html                       # Terms of service page
```

---

## Core Architecture

### 1-Year Paginated View

- `CalendarGrid` renders 12 `MonthRow` components for `currentYear`
- Year navigation via `prevYear`/`nextYear` (range: 2000-2049)
- No virtual scroll; simple direct rendering
- Each month row has `id="month-row-{1-12}"` for `scrollIntoView` navigation

### State Management (Zustand)

```
calendarStore
  ├── events[]              # Local events (persisted to localStorage)
  ├── theme                 # "light" | "dark" (persisted)
  ├── currentYear           # Number (persisted)
  ├── modal                 # { isOpen, mode, eventId?, prefillDate? }
  ├── googleEvents[]        # Events from Google Calendar (not persisted)
  ├── googleConnected       # Boolean
  ├── googleCalendars[]     # { id, summary, backgroundColor, enabled }
  └── googleUser            # { name, email, picture } | null
```

**Persisted to localStorage** (`linear-calendar-storage`): `events`, `theme`, `currentYear`

### Google Calendar Integration

**Auth flow:**
1. `LandingPage` → user clicks "Sign in with Google"
2. `useGoogleCalendar.connect()` → `initGoogleAuth()` → `requestAccessToken()`
3. OAuth token stored in memory only (never persisted)
4. `localStorage` flag `linear-calendar-google-connected` enables auto-reconnect

**Auto-reconnect** (`useAutoReconnect`):
- On page load, if flag exists, attempts silent `requestAccessToken()`
- On failure, removes flag → shows `LandingPage`

**API operations** (`services/googleCalendar.ts`):
- `fetchGoogleEvents(timeMin, timeMax, calendarId)` — list events
- `createGoogleEvent(calendarId, event)` — create
- `updateGoogleEvent(calendarId, eventId, event)` — update
- `deleteGoogleEvent(calendarId, eventId)` — delete
- `fetchCalendarList()` — list user's calendars
- `fetchUserProfile()` — get name/email/picture

**Scopes:** `calendar` (read/write) + `userinfo.profile`

**Year change:** `useEffect` in `useGoogleCalendar` watches `currentYear` and re-fetches events for the new year range.

### Event Layout Algorithm (`utils/eventLayout.ts`)

- Multi-day events are positioned in horizontal lanes
- Lane assignment uses greedy algorithm to avoid vertical overlap
- Events spanning across months are split at month boundaries with `isStart`/`isEnd` flags

### CSS & Theming

**CSS Variables** (defined in `index.css` `:root` / `.dark`):
```
--color-background, --color-surface, --color-surface-alt
--color-text, --color-text-secondary
--color-accent, --color-accent-soft
--color-border, --color-weekend-bg
--color-holiday-text, --color-year-divider
--shadow-sm, --shadow-md, --shadow-lg
```

**Theme toggle:** `toggleTheme()` → `document.documentElement.classList.toggle('dark')`

### Layout Constants (`utils/constants.ts`)

| Constant | Value | Description |
|----------|-------|-------------|
| `MONTH_LABEL_WIDTH` | 80px | Width of month name column |
| `DAY_CELL_WIDTH` | 36px | Width of each day column |
| `EVENT_HEIGHT` | 20px | Height per event lane |
| `EVENT_GAP` | 2px | Gap between event lanes |
| `DAY_HEADER_HEIGHT` | 30px | Sticky day header height |

---

## Features

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `T` | Jump to today (current year + scroll to current month) |
| `D` | Toggle dark/light theme |
| `ArrowLeft` | Previous year |
| `ArrowRight` | Next year |
| `Escape` | Close modal |

### Print
- Print button in header calls `window.print()`
- `@media print` in `index.css`: hides header (`.no-print`), forces light theme, page breaks every 6 months
- `.print-year-title` shows year title only in print

### Holidays
- `useHolidays(year)` → uses `date-holidays` library
- Displays Korean public holidays by default
- Holiday dates shown in red (`--color-holiday-text`)

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID |

Copy `.env.example` to `.env` and fill in your Client ID.

---

## Development

```bash
npm install
npm run dev          # http://localhost:5173/calendar/
npm run build        # Production build → dist/
npm run preview      # Preview production build
```

**Note:** `base: '/calendar/'` is set in `vite.config.ts` for the `/calendar/` subfolder deployment. Change this if deploying to a different path.

---

## Deployment (Hostinger)

1. `npm run build`
2. Upload `dist/` contents to `public_html/calendar/` via File Manager
3. `.htaccess` handles SPA routing + security headers + caching

### Google Cloud Console Setup

- **Authorized JavaScript origins:** `https://stayoung.io`
- **Authorized redirect URIs:** `https://stayoung.io`
- **OAuth consent screen:**
  - App homepage: `https://stayoung.io/calendar`
  - Privacy policy: `https://stayoung.io/calendar/privacy.html`
  - Terms of service: `https://stayoung.io/calendar/terms.html`
  - Authorized domains: `stayoung.io`

---

## Security

- **No backend:** All data stays in the user's browser
- **OAuth tokens:** Memory-only, never persisted to disk
- **localStorage:** Only non-sensitive data (theme, year, local events)
- **CSP headers:** Configured in `.htaccess`
- **HTTPS:** Enforced via Hostinger SSL
- **XSS:** React auto-escaping

---

## Future Considerations

- [ ] Google OAuth verification (publish app for all users)
- [ ] Google AdSense integration (replace placeholder in `AdBanner.tsx`)
- [ ] Token expiry handling (`expires_in` check in `googleCalendar.ts`)
- [ ] Mobile responsive layout
- [ ] `@tanstack/react-virtual` can be removed from `package.json` (unused)
- [ ] `@dnd-kit/core` and `@react-oauth/google` — verify if still used or removable
