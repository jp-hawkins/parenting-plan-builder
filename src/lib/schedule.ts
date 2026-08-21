import { getHolidayDef, getTemplate, HOLIDAY_DEFS, HOLIDAY_PRIORITY } from "./data";
import type { AppState, AssignedParent, DateRange, HolidayDef, HolidayMatch, ParentIdx, ScheduleTemplate, Summary, TemplateConfig } from "./types";
import { addDays, addDaysStr, diffDaysStr, formatDateStr, lastWeekdayOfMonth, makeDate, nthWeekdayOfMonth, parseDateStr } from "./utils";

// ---- Base rotation ----------------------------------------------------
export function getTemplateParent(dateStr: string, templateCfg: TemplateConfig, template: ScheduleTemplate): ParentIdx {
  const patLen = template.pattern.length;
  const offset = diffDaysStr(dateStr, templateCfg.startDate);
  const idx = ((offset % patLen) + patLen) % patLen;
  const slot = template.pattern[idx];
  return slot === 0 ? templateCfg.startParent : ((1 - templateCfg.startParent) as ParentIdx);
}

// ---- Holiday date-range computation ------------------------------------
export function computeHolidayRange(def: HolidayDef, year: number, state: AppState): DateRange | null {
  const rule = def.rule;
  if (rule.type !== "manual" && state.holidayDateMode[def.id] === "school-calendar") {
    const custom = state.holidayCustomDates[`${def.id}-${year}`];
    if (!custom) return null;
    return { start: custom.start, end: custom.end || custom.start };
  }
  let start: Date;
  switch (rule.type) {
    case "fixed":
      start = makeDate(year, rule.month!, rule.day!);
      return { start: formatDateStr(start), end: formatDateStr(start) };
    case "fixedRange":
      start = makeDate(year, rule.month!, rule.day!);
      return { start: formatDateStr(start), end: formatDateStr(addDays(start, rule.days! - 1)) };
    case "nthWeekday":
      start = nthWeekdayOfMonth(year, rule.month!, rule.weekday!, rule.n!);
      return { start: formatDateStr(start), end: formatDateStr(start) };
    case "lastWeekday":
      start = lastWeekdayOfMonth(year, rule.month!, rule.weekday!);
      return { start: formatDateStr(start), end: formatDateStr(start) };
    case "nthWeekdayRange": {
      const anchor = nthWeekdayOfMonth(year, rule.month!, rule.weekday!, rule.n!);
      if (rule.direction === "backward") {
        return { start: formatDateStr(addDays(anchor, -(rule.days! - 1))), end: formatDateStr(anchor) };
      }
      return { start: formatDateStr(anchor), end: formatDateStr(addDays(anchor, rule.days! - 1)) };
    }
    case "manual": {
      const custom = state.holidayCustomDates[`${def.id}-${year}`];
      if (!custom) return null;
      return { start: custom.start, end: custom.end || custom.start };
    }
    default:
      return null;
  }
}

export function computeDefaultHolidayParent(def: HolidayDef, year: number, state: AppState): ParentIdx {
  const treatment = state.holidayTreatments[def.id];
  if (treatment && treatment.mode === "fixed-parent" && treatment.fixedParent !== null) {
    return treatment.fixedParent;
  }
  if (def.assignDefault && def.assignDefault.startsWith("role:")) {
    const role = def.assignDefault.split(":")[1];
    const idx = state.parents.findIndex((p) => p.role === role);
    if (idx !== -1) return idx as ParentIdx;
  }
  const base = state.holidayAlternateBaseYear != null
    ? state.holidayAlternateBaseYear
    : parseDateStr(state.template.startDate).getFullYear();
  const startParent = state.holidayAlternateStartParent || 0;
  const diff = year - base;
  const isEven = ((diff % 2) + 2) % 2 === 0;
  // Stagger each holiday's starting parent by its position in the list so a
  // single year isn't lopsided — every other named holiday favors each parent.
  const allIds = [...state.customHolidays.map((h) => h.id), ...HOLIDAY_DEFS.map((h) => h.id)];
  const phaseIdx = Math.max(0, allIds.indexOf(def.id));
  const holidayStartParent = (phaseIdx % 2 === 0 ? startParent : 1 - startParent) as ParentIdx;
  return (isEven ? holidayStartParent : 1 - holidayStartParent) as ParentIdx;
}

// Custom occasions are checked first (they're specific, user-added dates),
// then built-ins in priority order, skipping anything the user removed.
export function getEffectiveHolidayOrder(state: AppState): string[] {
  const customIds = state.customHolidays.map((h) => h.id);
  return [...customIds, ...HOLIDAY_PRIORITY].filter((id) => !state.removedHolidayIds.includes(id));
}

export function getHolidayDefById(id: string, state: AppState): HolidayDef | undefined {
  return state.customHolidays.find((h) => h.id === id) ?? getHolidayDef(id);
}

// Find the holiday (if any) covering a given date. Checks candidate years
// around the date's year since ranges like Winter Break cross Dec->Jan.
export function resolveHolidayForDate(dateStr: string, state: AppState): HolidayMatch | null {
  const year = parseDateStr(dateStr).getFullYear();
  for (const holidayId of getEffectiveHolidayOrder(state)) {
    const def = getHolidayDefById(holidayId, state);
    if (!def) continue;
    for (const candidateYear of [year - 1, year, year + 1]) {
      const range = computeHolidayRange(def, candidateYear, state);
      if (!range) continue;
      if (dateStr >= range.start && dateStr <= range.end) {
        const overrideKey = `${def.id}-${candidateYear}`;
        const overrideParent = state.holidayOverrides[overrideKey];
        const parentIdx = overrideParent != null ? overrideParent : computeDefaultHolidayParent(def, candidateYear, state);
        return { def, year: candidateYear, range, parentIdx, overrideKey, isOverridden: overrideParent != null };
      }
    }
  }
  return null;
}

// ---- Full assignment resolution (manual > holiday > rotation) ----------
export function getAssignedParent(dateStr: string, state: AppState): AssignedParent {
  if (state.overrides[dateStr] != null) {
    return { parentIdx: state.overrides[dateStr], source: "manual" };
  }
  const holiday = resolveHolidayForDate(dateStr, state);
  if (holiday) {
    return { parentIdx: holiday.parentIdx, source: "holiday", holiday };
  }
  const template = getTemplate(state.template.id);
  if (!template) {
    return { parentIdx: 0, source: "rotation" };
  }
  const parentIdx = getTemplateParent(dateStr, state.template, template);
  return { parentIdx, source: "rotation" };
}

// ---- Summary math over a date range (inclusive) -------------------------
export function computeSummary(state: AppState, rangeStart: string, rangeEnd: string): Summary {
  const nights: [number, number] = [0, 0];
  const weekendNights: [number, number] = [0, 0];
  const holidayNights: [number, number] = [0, 0];
  let exchanges = 0;
  const runs: { parentIdx: ParentIdx; length: number }[] = [];

  let prevParent = getAssignedParent(addDaysStr(rangeStart, -1), state).parentIdx;
  let runParent: ParentIdx | null = null;
  let runLen = 0;

  let cursor = rangeStart;
  while (cursor <= rangeEnd) {
    const a = getAssignedParent(cursor, state);
    nights[a.parentIdx]++;
    const dow = parseDateStr(cursor).getDay();
    if (dow === 5 || dow === 6 || dow === 0) weekendNights[a.parentIdx]++;
    if (a.source === "holiday") holidayNights[a.parentIdx]++;
    if (a.parentIdx !== prevParent) exchanges++;

    if (a.parentIdx === runParent) {
      runLen++;
    } else {
      if (runParent !== null) runs.push({ parentIdx: runParent, length: runLen });
      runParent = a.parentIdx;
      runLen = 1;
    }

    prevParent = a.parentIdx;
    cursor = addDaysStr(cursor, 1);
  }
  if (runParent !== null) runs.push({ parentIdx: runParent, length: runLen });

  const total = nights[0] + nights[1];
  const longest: [number, number] = [0, 0];
  const runCounts: [number, number] = [0, 0];
  const runSums: [number, number] = [0, 0];
  runs.forEach((r) => {
    if (r.length > longest[r.parentIdx]) longest[r.parentIdx] = r.length;
    runCounts[r.parentIdx]++;
    runSums[r.parentIdx] += r.length;
  });
  const avgRun: [number, number] = [
    runCounts[0] ? runSums[0] / runCounts[0] : 0,
    runCounts[1] ? runSums[1] / runCounts[1] : 0,
  ];

  return {
    total,
    nights,
    pct: total ? [nights[0] / total * 100, nights[1] / total * 100] : [0, 0],
    weekendNights,
    holidayNights,
    exchanges,
    longestRun: longest,
    avgRun,
  };
}
