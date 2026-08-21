export type ParentIdx = 0 | 1;
export type ParentRole = "" | "mother" | "father";
export type ThemeId = "clay" | "dusk" | "harvest";
export type ScreenId = "intake" | "builder" | "tools";
export type ToolId = "calendar" | "summary" | "holidays" | "plan-details";

export interface Parent {
  id: string;
  name: string;
  color: string;
  role: ParentRole;
}

export interface Kid {
  id: string;
  name: string;
  age: string;
}

// ------------------------------------------------------------
// Plan Details — the non-schedule sections of the WA State
// Parenting Plan (FL All Family 140) that aren't already covered
// by the residential schedule / holiday tools.
// ------------------------------------------------------------
export interface DecisionCategory {
  id: string;
  label: string;
  isFixed: boolean; // School/Educational and Healthcare rows can't be removed
  mode: "joint" | "limited" | null;
  limitedParent: ParentIdx | null;
}

export type DisputeMethod = "provider" | "court" | null;
export type DisputeProviderType = "mediation" | "arbitration" | "counseling";
export type DisputeNoticeMethod = "certified-mail" | "other";
export type DisputeCostSplit = "fixed-percent" | "income-based" | "dispute-decided";

export interface DisputeResolution {
  method: DisputeMethod;
  providerType: DisputeProviderType;
  providerName: string;
  noticeMethod: DisputeNoticeMethod;
  noticeOther: string;
  costSplit: DisputeCostSplit;
  costPercent: [number, number];
}

export type HolidayTreatmentMode = "alternate" | "fixed-parent";
export interface HolidayTreatment {
  mode: HolidayTreatmentMode;
  fixedParent: ParentIdx | null;
}
export type HolidayDateMode = "auto" | "school-calendar";

export type ExchangeLocation = "each-home" | "school-daycare" | "other" | null;
export type TransportResponsible = "picking-up" | "dropping-off" | null;

export interface Transportation {
  location: ExchangeLocation;
  locationOther: string;
  responsible: TransportResponsible;
  otherDetails: string;
}

export interface PlanDetails {
  county: string;
  causeNumber: string;
  hasLimitations: boolean | null;
  limitationsExplanation: string;
  custodianParentIdx: ParentIdx | null;
  decisionCategories: DecisionCategory[];
  disputeResolution: DisputeResolution;
  transportation: Transportation;
  selectedProvisions: string[];
  otherProvisions: string;
}

export interface StandardProvision {
  id: string;
  category: string;
  label: string;
  text: string;
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
  removedHolidayIds: string[];
  holidayTreatments: Record<string, HolidayTreatment>;
  holidayDateMode: Record<string, HolidayDateMode>;
  customHolidays: HolidayDef[];

  calendarViewMonth: string; // 'YYYY-MM'
  summaryYear: number;
  holidayYear: number;
  printCalendarStyle: "compact" | "full";

  guidedActive: boolean;
  guidedQuestionId: string;
  editingHolidayKey: string | null;

  planDetails: PlanDetails;
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
