// ============================================================
// Date & general utilities
// ============================================================

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAY_LONG = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];
export const MONTH_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Construct a Date at local noon to avoid DST/timezone edge issues when doing day math.
export function makeDate(year: number, monthIndex: number, day: number): Date {
  return new Date(year, monthIndex, day, 12, 0, 0, 0);
}

export function parseDateStr(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return makeDate(y, m - 1, d);
}

export function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n, 12, 0, 0, 0);
}

export function addDaysStr(str: string, n: number): string {
  return formatDateStr(addDays(parseDateStr(str), n));
}

export function diffDays(dateA: Date, dateB: Date): number {
  return Math.round((dateA.getTime() - dateB.getTime()) / 86400000);
}

export function diffDaysStr(strA: string, strB: string): number {
  return diffDays(parseDateStr(strA), parseDateStr(strB));
}

export function todayStr(): string {
  return formatDateStr(new Date());
}

export function formatDisplayDate(str: string, opts: { weekday?: boolean; year?: boolean } = {}): string {
  const d = parseDateStr(str);
  const weekday = opts.weekday === false ? "" : WEEKDAY_LONG[d.getDay()] + ", ";
  return `${weekday}${MONTH_LONG[d.getMonth()]} ${d.getDate()}${opts.year === false ? "" : ", " + d.getFullYear()}`;
}

export function formatShortDate(str: string): string {
  const d = parseDateStr(str);
  return `${MONTH_LONG[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

// nth weekday of month (1-indexed n). weekday: 0=Sun..6=Sat
export function nthWeekdayOfMonth(year: number, monthIndex: number, weekday: number, n: number): Date {
  const first = makeDate(year, monthIndex, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  const day = 1 + offset + (n - 1) * 7;
  return makeDate(year, monthIndex, day);
}

// last weekday of month
export function lastWeekdayOfMonth(year: number, monthIndex: number, weekday: number): Date {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const last = makeDate(year, monthIndex, lastDay);
  const offset = (last.getDay() - weekday + 7) % 7;
  return addDays(last, -offset);
}

export interface MonthDay {
  dateStr: string;
  inMonth: boolean;
}

// Build a 6-row x 7-col month matrix starting on Sunday
export function getMonthMatrix(year: number, monthIndex: number): MonthDay[] {
  const first = makeDate(year, monthIndex, 1);
  const startOffset = first.getDay();
  const gridStart = addDays(first, -startOffset);
  const days: MonthDay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = addDays(gridStart, i);
    days.push({
      dateStr: formatDateStr(d),
      inMonth: d.getMonth() === monthIndex,
    });
  }
  return days;
}

export function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
