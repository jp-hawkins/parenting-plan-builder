export type ParentIdx = 0 | 1;
export type ParentRole = "" | "mother" | "father";
export type ThemeId = "clay" | "dusk" | "harvest";
export type ScreenId = "intake" | "builder" | "tools";
export type ToolId = "calendar" | "summary" | "holidays";

export interface Parent {
  id: string;
  name: string;
  color: string;
  role: ParentRole;
}

export interface Kid {
  id: string;
  name: string;
}

export interface TemplateConfig {
  id: string | null;
  startDate: string;
  startParent: ParentIdx;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface AppState {
  screen: ScreenId;
  activeTool: ToolId;
  theme: ThemeId;

  parents: [Parent, Parent];
  kids: Kid[];

  template: TemplateConfig;

  overrides: Record<string, ParentIdx>;
  holidayOverrides: Record<string, ParentIdx>;
  holidayCustomDates: Record<string, DateRange>;
  holidayAlternateBaseYear: number | null;
  holidayAlternateStartParent: ParentIdx;

  calendarViewMonth: string; // 'YYYY-MM'
  summaryYear: number;
  holidayYear: number;

  guidedActive: boolean;
  guidedQuestionId: string;
  editingHolidayKey: string | null;
}

export interface AssignedParent {
  parentIdx: ParentIdx;
  source: "manual" | "holiday" | "rotation";
  holiday?: HolidayMatch;
}

export interface HolidayMatch {
  def: HolidayDef;
  year: number;
  range: DateRange;
  parentIdx: ParentIdx;
  overrideKey: string;
  isOverridden: boolean;
}

export interface ScheduleTemplate {
  id: string;
  name: string;
  tagline: string;
  description: string;
  pattern: (0 | 1)[];
  exchangesPerYear: string;
  primaryVariant?: boolean;
}

export interface GuidedOption {
  label: string;
  next?: string;
  result?: string;
}

export interface GuidedQuestion {
  id: string;
  text: string;
  options: GuidedOption[];
}

export type HolidayRuleType =
  | "fixed"
  | "fixedRange"
  | "nthWeekday"
  | "lastWeekday"
  | "nthWeekdayRange"
  | "manual";

export interface HolidayRule {
  type: HolidayRuleType;
  month?: number;
  day?: number;
  days?: number;
  weekday?: number;
  n?: number;
  direction?: "forward" | "backward";
}

export interface HolidayDef {
  id: string;
  name: string;
  rule: HolidayRule;
  assignDefault: string; // "alternate" | "role:mother" | "role:father"
}

export interface Summary {
  total: number;
  nights: [number, number];
  pct: [number, number];
  weekendNights: [number, number];
  holidayNights: [number, number];
  exchanges: number;
  longestRun: [number, number];
  avgRun: [number, number];
}

export interface ParentColor {
  id: string;
  hex: string;
}
