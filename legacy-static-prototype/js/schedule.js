// ============================================================
// Schedule resolution: rotation pattern + holidays + manual overrides
// Depends on: utils.js, data.js
// ============================================================

// ---- Base rotation ----------------------------------------------------
function getTemplateParent(dateStr, templateCfg, template) {
  const patLen = template.pattern.length;
  const offset = diffDaysStr(dateStr, templateCfg.startDate);
  const idx = ((offset % patLen) + patLen) % patLen;
  const slot = template.pattern[idx]; // 0 or 1, authored relative to "startParent"
  return slot === 0 ? templateCfg.startParent : 1 - templateCfg.startParent;
}

// ---- Holiday date-range computation ------------------------------------
function computeHolidayRange(def, year, state) {
  const rule = def.rule;
  let start;
  switch (rule.type) {
    case "fixed":
      start = makeDate(year, rule.month, rule.day);
      return { start: formatDateStr(start), end: formatDateStr(start) };
    case "fixedRange":
      start = makeDate(year, rule.month, rule.day);
      return { start: formatDateStr(start), end: formatDateStr(addDays(start, rule.days - 1)) };
    case "nthWeekday":
      start = nthWeekdayOfMonth(year, rule.month, rule.weekday, rule.n);
      return { start: formatDateStr(start), end: formatDateStr(start) };
    case "lastWeekday":
      start = lastWeekdayOfMonth(year, rule.month, rule.weekday);
      return { start: formatDateStr(start), end: formatDateStr(start) };
    case "nthWeekdayRange": {
      const anchor = nthWeekdayOfMonth(year, rule.month, rule.weekday, rule.n);
      if (rule.direction === "backward") {
        return { start: formatDateStr(addDays(anchor, -(rule.days - 1))), end: formatDateStr(anchor) };
      }
      return { start: formatDateStr(anchor), end: formatDateStr(addDays(anchor, rule.days - 1)) };
    }
    case "manual": {
      const custom = state.holidayCustomDates && state.holidayCustomDates[`${def.id}-${year}`];
      if (!custom) return null;
      return { start: custom.start, end: custom.end || custom.start };
    }
    default:
      return null;
  }
}

function computeDefaultHolidayParent(def, year, state) {
  if (def.assignDefault && def.assignDefault.startsWith("role:")) {
    const role = def.assignDefault.split(":")[1];
    const idx = state.parents.findIndex((p) => p.role === role);
    if (idx !== -1) return idx;
  }
  const base = state.holidayAlternateBaseYear != null
    ? state.holidayAlternateBaseYear
    : parseDateStr(state.template.startDate).getFullYear();
  const startParent = state.holidayAlternateStartParent || 0;
  const diff = year - base;
  const isEven = ((diff % 2) + 2) % 2 === 0;
  // Stagger each holiday's starting parent by its position in the list so a
  // single year isn't lopsided — every other named holiday favors each parent.
  const phaseIdx = HOLIDAY_DEFS.findIndex((h) => h.id === def.id);
  const holidayStartParent = phaseIdx % 2 === 0 ? startParent : 1 - startParent;
  return isEven ? holidayStartParent : 1 - holidayStartParent;
}

// Find the holiday (if any) covering a given date. Checks candidate years
// around the date's year since ranges like Winter Break cross Dec->Jan.
function resolveHolidayForDate(dateStr, state) {
  const year = parseDateStr(dateStr).getFullYear();
  for (const holidayId of HOLIDAY_PRIORITY) {
    const def = getHolidayDef(holidayId);
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
function getAssignedParent(dateStr, state) {
  if (state.overrides[dateStr] != null) {
    return { parentIdx: state.overrides[dateStr], source: "manual" };
  }
  const holiday = resolveHolidayForDate(dateStr, state);
  if (holiday) {
    return { parentIdx: holiday.parentIdx, source: "holiday", holiday };
  }
  const template = getTemplate(state.template.id);
  const parentIdx = getTemplateParent(dateStr, state.template, template);
  return { parentIdx, source: "rotation" };
}

// ---- Summary math over a date range (inclusive) -------------------------
function computeSummary(state, rangeStart, rangeEnd) {
  const nights = [0, 0];
  const weekendNights = [0, 0];
  const holidayNights = [0, 0];
  let exchanges = 0;
  const runs = [];

  let prevParent = getAssignedParent(addDaysStr(rangeStart, -1), state).parentIdx;
  let runParent = null;
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
  const longest = [0, 0];
  const runCounts = [0, 0];
  const runSums = [0, 0];
  runs.forEach((r) => {
    if (r.length > longest[r.parentIdx]) longest[r.parentIdx] = r.length;
    runCounts[r.parentIdx]++;
    runSums[r.parentIdx] += r.length;
  });
  const avgRun = [
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
