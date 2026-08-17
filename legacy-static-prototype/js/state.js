// ============================================================
// Central application state + persistence + action functions
// Depends on: utils.js, data.js
// ============================================================

const STORAGE_KEY = "ppb-state-v2";
let renderFn = null; // set by app.js once the render loop is ready
function setRenderFn(fn) { renderFn = fn; }
function rerender() { if (renderFn) renderFn(); }

function defaultState() {
  const start = todayStr();
  return {
    screen: "intake", // intake | builder | tools
    activeTool: "calendar", // calendar | summary | holidays
    theme: "clay",

    parents: [
      { id: "p0", name: "", color: "terracotta", role: "" },
      { id: "p1", name: "", color: "slate", role: "" },
    ],
    kids: [{ id: uid("kid"), name: "" }],

    template: { id: null, startDate: start, startParent: 0 },

    overrides: {},           // dateStr -> parentIdx
    holidayOverrides: {},    // "<holidayId>-<year>" -> parentIdx
    holidayCustomDates: {},  // "<holidayId>-<year>" -> {start,end}  (manual-rule holidays)
    holidayAlternateBaseYear: null,
    holidayAlternateStartParent: 0,

    calendarViewMonth: start.slice(0, 7), // 'YYYY-MM'
    summaryYear: parseDateStr(start).getFullYear(),
    holidayYear: parseDateStr(start).getFullYear(),

    guidedActive: false,
    guidedQuestionId: "start",
    editingHolidayKey: null,
  };
}

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultState(), parsed);
  } catch (e) {
    return defaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { /* ignore quota errors */ }
}

function commit() {
  saveState();
  rerender();
}

// ------------------------------------------------------------
// Actions
// ------------------------------------------------------------
function setTheme(theme) {
  state.theme = theme;
  document.body.setAttribute("data-theme", theme);
  commit();
}

function goToScreen(screen) {
  state.screen = screen;
  commit();
}

function setActiveTool(tool) {
  state.activeTool = tool;
  commit();
}

function updateParent(idx, patch) {
  state.parents[idx] = Object.assign({}, state.parents[idx], patch);
  commit();
}

function addKid() {
  state.kids.push({ id: uid("kid"), name: "" });
  commit();
}
function updateKid(id, name) {
  const k = state.kids.find((k) => k.id === id);
  if (k) k.name = name;
  commit();
}
function removeKid(id) {
  state.kids = state.kids.filter((k) => k.id !== id);
  commit();
}

function selectTemplate(templateId) {
  state.template.id = templateId;
  if (state.holidayAlternateBaseYear == null) {
    state.holidayAlternateBaseYear = parseDateStr(state.template.startDate).getFullYear();
  }
  commit();
}

function setTemplateConfig(patch) {
  state.template = Object.assign({}, state.template, patch);
  commit();
}

function startGuided() {
  state.guidedActive = true;
  state.guidedQuestionId = "start";
  commit();
}
function exitGuided() {
  state.guidedActive = false;
  commit();
}
function answerGuided(option) {
  if (option.result) {
    selectTemplate(option.result);
    state.guidedActive = false;
    commit();
  } else if (option.next) {
    state.guidedQuestionId = option.next;
    commit();
  }
}

function setDayOverride(dateStr, parentIdx) {
  if (parentIdx == null) delete state.overrides[dateStr];
  else state.overrides[dateStr] = parentIdx;
  commit();
}
function clearDayOverride(dateStr) {
  delete state.overrides[dateStr];
  commit();
}

function setHolidayOverride(key, parentIdx) {
  if (parentIdx == null) delete state.holidayOverrides[key];
  else state.holidayOverrides[key] = parentIdx;
  commit();
}

function setHolidayCustomRange(key, range) {
  state.holidayCustomDates[key] = range;
  commit();
}

function setCalendarMonth(yyyymm) {
  state.calendarViewMonth = yyyymm;
  commit();
}

function shiftCalendarMonth(delta) {
  const [y, m] = state.calendarViewMonth.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  state.calendarViewMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  commit();
}

function setSummaryYear(year) {
  state.summaryYear = year;
  commit();
}

function setHolidayYear(year) {
  state.holidayYear = year;
  commit();
}

function resetPlan() {
  state = defaultState();
  document.body.setAttribute("data-theme", state.theme);
  commit();
}

// ------------------------------------------------------------
// Derived helpers
// ------------------------------------------------------------
function parentDisplayName(idx) {
  const p = state.parents[idx];
  return (p && p.name && p.name.trim()) || `Parent ${idx === 0 ? "A" : "B"}`;
}
function parentColorHex(idx) {
  const p = state.parents[idx];
  const c = PARENT_COLORS.find((c) => c.id === (p && p.color));
  return c ? c.hex : "#999999";
}
function isIntakeComplete() {
  return state.parents.every((p) => p.name.trim().length > 0) &&
    state.kids.some((k) => k.name.trim().length > 0);
}
function isScheduleComplete() {
  return !!state.template.id && !!state.template.startDate;
}
