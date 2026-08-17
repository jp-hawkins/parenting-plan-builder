// ============================================================
// Date & general utilities (no dependencies)
// ============================================================

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Construct a Date at local noon to avoid DST/timezone edge issues when doing day math.
function makeDate(year, monthIndex, day) {
  return new Date(year, monthIndex, day, 12, 0, 0, 0);
}

function parseDateStr(str) {
  // 'YYYY-MM-DD' -> Date at local noon
  const [y, m, d] = str.split("-").map(Number);
  return makeDate(y, m - 1, d);
}

function formatDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date, n) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n, 12, 0, 0, 0);
}

function addDaysStr(str, n) {
  return formatDateStr(addDays(parseDateStr(str), n));
}

function diffDays(dateA, dateB) {
  // number of days from dateB to dateA
  return Math.round((dateA - dateB) / DAY_MS);
}

function diffDaysStr(strA, strB) {
  return diffDays(parseDateStr(strA), parseDateStr(strB));
}

function todayStr() {
  return formatDateStr(new Date());
}

function formatDisplayDate(str, opts) {
  const d = parseDateStr(str);
  opts = opts || {};
  const weekday = opts.weekday === false ? "" : WEEKDAY_LONG[d.getDay()] + ", ";
  return `${weekday}${MONTH_LONG[d.getMonth()]} ${d.getDate()}${opts.year === false ? "" : ", " + d.getFullYear()}`;
}

function formatShortDate(str) {
  const d = parseDateStr(str);
  return `${MONTH_LONG[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

// nth weekday of month (1-indexed n). weekday: 0=Sun..6=Sat
function nthWeekdayOfMonth(year, monthIndex, weekday, n) {
  const first = makeDate(year, monthIndex, 1);
  let offset = (weekday - first.getDay() + 7) % 7;
  const day = 1 + offset + (n - 1) * 7;
  return makeDate(year, monthIndex, day);
}

// last weekday of month
function lastWeekdayOfMonth(year, monthIndex, weekday) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const last = makeDate(year, monthIndex, lastDay);
  let offset = (last.getDay() - weekday + 7) % 7;
  return addDays(last, -offset);
}

// Build a 6-row x 7-col month matrix (array of {dateStr, inMonth}) starting on Sunday
function getMonthMatrix(year, monthIndex) {
  const first = makeDate(year, monthIndex, 1);
  const startOffset = first.getDay(); // 0=Sun
  const gridStart = addDays(first, -startOffset);
  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = addDays(gridStart, i);
    days.push({
      dateStr: formatDateStr(d),
      inMonth: d.getMonth() === monthIndex,
    });
  }
  return days;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function escapeHtml(str) {
  return String(str == null ? "" : str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
