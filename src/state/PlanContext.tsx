import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type {
  AppState, DateRange, GuidedOption, ParentIdx, ParentRole, ScreenId, ThemeId, ToolId,
} from "../lib/types";
import { todayStr, uid, parseDateStr } from "../lib/utils";

const STORAGE_KEY = "ppb-state-v2";

function defaultState(): AppState {
  const start = todayStr();
  return {
    screen: "intake",
    activeTool: "calendar",
    theme: "clay",

    parents: [
      { id: "p0", name: "", color: "terracotta", role: "" },
      { id: "p1", name: "", color: "slate", role: "" },
    ],
    kids: [{ id: uid("kid"), name: "" }],

    template: { id: null, startDate: start, startParent: 0 },

    overrides: {},
    holidayOverrides: {},
    holidayCustomDates: {},
    holidayAlternateBaseYear: null,
    holidayAlternateStartParent: 0,

    calendarViewMonth: start.slice(0, 7),
    summaryYear: parseDateStr(start).getFullYear(),
    holidayYear: parseDateStr(start).getFullYear(),

    guidedActive: false,
    guidedQuestionId: "start",
    editingHolidayKey: null,
  };
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultState(), parsed);
  } catch {
    return defaultState();
  }
}

export interface PlanActions {
  setTheme: (theme: ThemeId) => void;
  goToScreen: (screen: ScreenId) => void;
  setActiveTool: (tool: ToolId) => void;
  updateParent: (idx: ParentIdx, patch: Partial<AppState["parents"][number]>) => void;
  setParentRole: (idx: ParentIdx, role: ParentRole) => void;
  addKid: () => void;
  updateKid: (id: string, name: string) => void;
  removeKid: (id: string) => void;
  selectTemplate: (templateId: string) => void;
  setTemplateConfig: (patch: Partial<AppState["template"]>) => void;
  startGuided: () => void;
  exitGuided: () => void;
  answerGuided: (option: GuidedOption) => void;
  setDayOverride: (dateStr: string, parentIdx: ParentIdx) => void;
  clearDayOverride: (dateStr: string) => void;
  setHolidayOverride: (key: string, parentIdx: ParentIdx | null) => void;
  setHolidayCustomRange: (key: string, range: DateRange) => void;
  setCalendarMonth: (yyyymm: string) => void;
  shiftCalendarMonth: (delta: number) => void;
  setSummaryYear: (year: number) => void;
  setHolidayYear: (year: number) => void;
  setEditingHolidayKey: (key: string | null) => void;
  resetPlan: () => void;
}

interface PlanContextValue {
  state: AppState;
  actions: PlanActions;
}

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota errors */
    }
  }, [state]);

  useEffect(() => {
    document.body.setAttribute("data-theme", state.theme);
  }, [state.theme]);

  const actions = useMemo<PlanActions>(() => ({
    setTheme: (theme) => setState((s) => ({ ...s, theme })),
    goToScreen: (screen) => setState((s) => ({ ...s, screen })),
    setActiveTool: (activeTool) => setState((s) => ({ ...s, activeTool })),

    updateParent: (idx, patch) => setState((s) => {
      const parents = [...s.parents] as AppState["parents"];
      parents[idx] = { ...parents[idx], ...patch };
      return { ...s, parents };
    }),

    setParentRole: (idx, role) => setState((s) => {
      const parents = s.parents.map((p, i) => {
        if (i === idx) return { ...p, role };
        if (role && p.role === role) return { ...p, role: "" as ParentRole };
        return p;
      }) as AppState["parents"];
      return { ...s, parents };
    }),

    addKid: () => setState((s) => ({ ...s, kids: [...s.kids, { id: uid("kid"), name: "" }] })),

    updateKid: (id, name) => setState((s) => ({
      ...s,
      kids: s.kids.map((k) => (k.id === id ? { ...k, name } : k)),
    })),

    removeKid: (id) => setState((s) => ({ ...s, kids: s.kids.filter((k) => k.id !== id) })),

    selectTemplate: (templateId) => setState((s) => ({
      ...s,
      template: { ...s.template, id: templateId },
      holidayAlternateBaseYear: s.holidayAlternateBaseYear ?? parseDateStr(s.template.startDate).getFullYear(),
    })),

    setTemplateConfig: (patch) => setState((s) => ({ ...s, template: { ...s.template, ...patch } })),

    startGuided: () => setState((s) => ({ ...s, guidedActive: true, guidedQuestionId: "start" })),
    exitGuided: () => setState((s) => ({ ...s, guidedActive: false })),

    answerGuided: (option) => setState((s) => {
      if (option.result) {
        return {
          ...s,
          template: { ...s.template, id: option.result },
          holidayAlternateBaseYear: s.holidayAlternateBaseYear ?? parseDateStr(s.template.startDate).getFullYear(),
          guidedActive: false,
        };
      }
      if (option.next) {
        return { ...s, guidedQuestionId: option.next };
      }
      return s;
    }),

    setDayOverride: (dateStr, parentIdx) => setState((s) => ({
      ...s, overrides: { ...s.overrides, [dateStr]: parentIdx },
    })),
    clearDayOverride: (dateStr) => setState((s) => {
      const overrides = { ...s.overrides };
      delete overrides[dateStr];
      return { ...s, overrides };
    }),

    setHolidayOverride: (key, parentIdx) => setState((s) => {
      const holidayOverrides = { ...s.holidayOverrides };
      if (parentIdx == null) delete holidayOverrides[key];
      else holidayOverrides[key] = parentIdx;
      return { ...s, holidayOverrides };
    }),

    setHolidayCustomRange: (key, range) => setState((s) => ({
      ...s, holidayCustomDates: { ...s.holidayCustomDates, [key]: range },
    })),

    setCalendarMonth: (yyyymm) => setState((s) => ({ ...s, calendarViewMonth: yyyymm })),
    shiftCalendarMonth: (delta) => setState((s) => {
      const [y, m] = s.calendarViewMonth.split("-").map(Number);
      const d = new Date(y, m - 1 + delta, 1);
      return { ...s, calendarViewMonth: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` };
    }),

    setSummaryYear: (year) => setState((s) => ({ ...s, summaryYear: year })),
    setHolidayYear: (year) => setState((s) => ({ ...s, holidayYear: year })),
    setEditingHolidayKey: (key) => setState((s) => ({ ...s, editingHolidayKey: key })),

    resetPlan: () => setState(defaultState()),
  }), []);

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within a PlanProvider");
  return ctx;
}
