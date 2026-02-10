export const MONTH_LABEL_WIDTH = 80; // px
export const DAY_CELL_WIDTH = 36;    // px
export const EVENT_HEIGHT = 20;      // px per event lane
export const EVENT_GAP = 2;          // px between event lanes
export const DAY_HEADER_HEIGHT = 30; // px sticky day-column header

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export const DEFAULT_EVENT_COLORS = [
  '#6366f1', // indigo
  '#f43f5e', // rose
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#0ea5e9', // sky
  '#f97316', // orange
] as const;
