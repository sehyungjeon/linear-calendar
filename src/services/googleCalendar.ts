import type { CalendarEvent } from '../types';

const SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.profile';
const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
const LOCAL_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone; // e.g. "America/Denver"

let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let accessToken: string | null = null;

/** Load Google Identity Services script */
function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById('google-gis')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gis';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

/** Initialize the token client */
export async function initGoogleAuth(): Promise<void> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID is not set in .env');
  }

  await loadGisScript();

  return new Promise((resolve) => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: () => {
        resolve();
      },
    });
    resolve();
  });
}

/** Request access token (opens Google sign-in popup) */
export function requestAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google auth not initialized'));
      return;
    }

    tokenClient.callback = (response: google.accounts.oauth2.TokenResponse) => {
      if (response.error) {
        reject(new Error(response.error));
        return;
      }
      accessToken = response.access_token;
      resolve(response.access_token);
    };

    tokenClient.requestAccessToken({ prompt: accessToken ? '' : 'consent' });
  });
}

/** Revoke the current token */
export function revokeToken(): void {
  if (accessToken) {
    google.accounts.oauth2.revoke(accessToken, () => {});
    accessToken = null;
  }
}

export function isSignedIn(): boolean {
  return accessToken !== null;
}

/** Fetch events from Google Calendar for a date range */
export async function fetchGoogleEvents(
  timeMin: string,
  timeMax: string,
  calendarId: string = 'primary'
): Promise<CalendarEvent[]> {
  if (!accessToken) {
    throw new Error('Not signed in');
  }

  const params = new URLSearchParams({
    timeMin: `${timeMin}T00:00:00Z`,
    timeMax: `${timeMax}T23:59:59Z`,
    timeZone: LOCAL_TIMEZONE,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '2500',
  });

  const res = await fetch(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (res.status === 401) {
    accessToken = null;
    throw new Error('Token expired');
  }

  if (!res.ok) {
    throw new Error(`Google Calendar API error: ${res.status}`);
  }

  const data = await res.json();
  return (data.items || [])
    .filter((item: any) => item.start?.date || item.start?.dateTime)
    .map((item: any) => googleEventToLocal(item, calendarId));
}

/** Create a new event on Google Calendar */
export async function createGoogleEvent(
  calendarId: string,
  event: { title: string; startDate: string; endDate: string; description?: string }
): Promise<CalendarEvent> {
  if (!accessToken) throw new Error('Not signed in');

  const endExclusive = new Date(event.endDate + 'T00:00:00');
  endExclusive.setDate(endExclusive.getDate() + 1);

  const body = {
    summary: event.title,
    description: event.description,
    start: { date: event.startDate, timeZone: LOCAL_TIMEZONE },
    end: { date: endExclusive.toISOString().slice(0, 10), timeZone: LOCAL_TIMEZONE },
  };

  const res = await fetch(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (res.status === 401) {
    accessToken = null;
    throw new Error('Token expired');
  }
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(`Google Calendar API error: ${res.status} - ${errBody?.error?.message || JSON.stringify(errBody)}`);
  }

  const created = await res.json();
  return googleEventToLocal(created, calendarId);
}

/** Update a Google Calendar event */
export async function updateGoogleEvent(
  calendarId: string,
  googleEventId: string,
  updates: { title?: string; startDate?: string; endDate?: string; description?: string }
): Promise<void> {
  if (!accessToken) throw new Error('Not signed in');

  const body: any = {};
  if (updates.title !== undefined) body.summary = updates.title;
  if (updates.description !== undefined) body.description = updates.description;
  if (updates.startDate !== undefined) body.start = { date: updates.startDate, timeZone: LOCAL_TIMEZONE };
  if (updates.endDate !== undefined) {
    // Google's all-day end date is exclusive, so add 1 day
    const endExclusive = new Date(updates.endDate + 'T00:00:00');
    endExclusive.setDate(endExclusive.getDate() + 1);
    body.end = { date: endExclusive.toISOString().slice(0, 10), timeZone: LOCAL_TIMEZONE };
  }
  // If only start or only end provided, we need both for the API
  if (body.start && !body.end) {
    body.end = body.start; // will be patched anyway
  }
  if (body.end && !body.start) {
    body.start = body.end; // will be patched anyway
  }

  const res = await fetch(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (res.status === 401) {
    accessToken = null;
    throw new Error('Token expired');
  }
  if (!res.ok) {
    throw new Error(`Google Calendar API error: ${res.status}`);
  }
}

/** Delete a Google Calendar event */
export async function deleteGoogleEvent(
  calendarId: string,
  googleEventId: string
): Promise<void> {
  if (!accessToken) throw new Error('Not signed in');

  const res = await fetch(
    `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (res.status === 401) {
    accessToken = null;
    throw new Error('Token expired');
  }
  // 204 = success, 410 = already deleted
  if (!res.ok && res.status !== 410) {
    throw new Error(`Google Calendar API error: ${res.status}`);
  }
}

/** Fetch list of user's calendars */
export async function fetchCalendarList(): Promise<Array<{ id: string; summary: string; backgroundColor: string }>> {
  if (!accessToken) {
    throw new Error('Not signed in');
  }

  const res = await fetch(`${CALENDAR_API_BASE}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Google Calendar API error: ${res.status}`);
  }

  const data = await res.json();
  return (data.items || []).map((cal: any) => ({
    id: cal.id,
    summary: cal.summary,
    backgroundColor: cal.backgroundColor || '#3b82f6',
  }));
}

/** Convert a Google Calendar event to our local format */
function googleEventToLocal(gEvent: any, calendarId: string): CalendarEvent {
  const isAllDay = !!gEvent.start.date;
  let startDate: string;
  let endDate: string;

  if (isAllDay) {
    startDate = gEvent.start.date;
    // Google's all-day end date is exclusive, so subtract 1 day
    const endExclusive = new Date(gEvent.end.date + 'T00:00:00');
    endExclusive.setDate(endExclusive.getDate() - 1);
    endDate = endExclusive.toISOString().slice(0, 10);
  } else {
    startDate = gEvent.start.dateTime.slice(0, 10);
    endDate = gEvent.end.dateTime.slice(0, 10);
  }

  return {
    id: `google-${gEvent.id}`,
    title: gEvent.summary || '(No title)',
    startDate,
    endDate,
    color: gEvent.colorId ? googleColorMap[gEvent.colorId] || '#3b82f6' : '#3b82f6',
    description: gEvent.description,
    calendarId,
  };
}

/** Fetch user profile info */
export async function fetchUserProfile(): Promise<{ name: string; email: string; picture: string }> {
  if (!accessToken) throw new Error('Not signed in');
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch user profile');
  const data = await res.json();
  return { name: data.name || '', email: data.email || '', picture: data.picture || '' };
}

// Google Calendar event color IDs mapped to hex
const googleColorMap: Record<string, string> = {
  '1': '#7986cb', // Lavender
  '2': '#33b679', // Sage
  '3': '#8e24aa', // Grape
  '4': '#e67c73', // Flamingo
  '5': '#f6bf26', // Banana
  '6': '#f4511e', // Tangerine
  '7': '#039be5', // Peacock
  '8': '#616161', // Graphite
  '9': '#3f51b5', // Blueberry
  '10': '#0b8043', // Basil
  '11': '#d50000', // Tomato
};
