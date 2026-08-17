import type { GuidedQuestion, HolidayDef, ParentColor, ScheduleTemplate } from "./types";

export const THEMES = ["clay", "dusk", "harvest"] as const;

export const PARENT_COLORS: ParentColor[] = [
  { id: "terracotta", hex: "#c1694f" },
  { id: "slate", hex: "#5c7f8a" },
  { id: "sage", hex: "#74875f" },
  { id: "plum", hex: "#8a5e79" },
  { id: "ochre", hex: "#d1972f" },
  { id: "teal", hex: "#3f8f83" },
  { id: "berry", hex: "#a4485f" },
  { id: "moss", hex: "#56714a" },
];

// ------------------------------------------------------------
// Schedule templates
// Each template's `pattern` is authored relative to `startParent`:
// pattern value 0 -> startParent, 1 -> the other parent.
// ------------------------------------------------------------
export const TEMPLATES: ScheduleTemplate[] = [
  {
    id: "2-2-3",
    name: "2-2-3",
    tagline: "Frequent contact, equal time",
    description: "Both parents see the kids every few days. Nights repeat in blocks of 2, 2, and 3 on a two-week cycle. Popular for younger children who benefit from shorter separations.",
    pattern: [0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1],
    exchangesPerYear: "~104",
  },
  {
    id: "2-2-5-5",
    name: "2-2-5-5",
    tagline: "Fewer exchanges, still equal",
    description: "Fixed weekday nights for each parent, with alternating long weekends that stretch into 5-night blocks. Fewer handoffs than 2-2-3 while staying 50/50.",
    pattern: [0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0],
    exchangesPerYear: "~52",
  },
  {
    id: "week-on-week-off",
    name: "Week On / Week Off",
    tagline: "One exchange per week",
    description: "Each parent has the kids for a full 7-night week, then switches. Simple and predictable, with the fewest exchanges of any equal-time schedule — often used for older kids and teens.",
    pattern: [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
    exchangesPerYear: "~26",
  },
  {
    id: "3-4-4-3",
    name: "3-4-4-3",
    tagline: "Balanced with midweek contact",
    description: "Nights repeat in blocks of 3 and 4, alternating each week. Keeps both parents involved in school-week routines while staying equal over time.",
    pattern: [0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
    exchangesPerYear: "~52",
  },
  {
    id: "every-other-weekend",
    name: "Every Other Weekend",
    tagline: "One primary residence",
    description: "Kids live primarily with one parent on school nights. The other parent has alternating weekends (Friday–Sunday). Common when parents live farther apart or kids are very young.",
    pattern: [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    exchangesPerYear: "~52",
    primaryVariant: true,
  },
];

export function getTemplate(id: string | null): ScheduleTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

// ------------------------------------------------------------
// Guided picker decision tree
// ------------------------------------------------------------
export const GUIDED_QUESTIONS: Record<string, GuidedQuestion> = {
  start: {
    id: "start",
    text: "Do you want the kids' time split equally between both parents?",
    options: [
      { label: "Yes, equal time", next: "age" },
      { label: "No, one home is primary", result: "every-other-weekend" },
    ],
  },
  age: {
    id: "age",
    text: "How old are the kids?",
    options: [
      { label: "Under 5", result: "2-2-3" },
      { label: "5 to 10", result: "2-2-5-5" },
      { label: "10 and up", next: "exchanges" },
    ],
  },
  exchanges: {
    id: "exchanges",
    text: "Do you want to minimize the number of handoffs?",
    options: [
      { label: "Yes, fewer exchanges", result: "week-on-week-off" },
      { label: "No, midweek contact is important", result: "3-4-4-3" },
    ],
  },
};

// ------------------------------------------------------------
// Holidays
// ------------------------------------------------------------
export const HOLIDAY_DEFS: HolidayDef[] = [
  { id: "new-year", name: "New Year's Day", rule: { type: "fixed", month: 0, day: 1 }, assignDefault: "alternate" },
  { id: "mlk", name: "MLK Weekend", rule: { type: "nthWeekdayRange", month: 0, weekday: 1, n: 3, days: 3, direction: "backward" }, assignDefault: "alternate" },
  { id: "spring-break", name: "Spring Break", rule: { type: "manual" }, assignDefault: "alternate" },
  { id: "mothers-day", name: "Mother's Day", rule: { type: "nthWeekday", month: 4, weekday: 0, n: 2 }, assignDefault: "role:mother" },
  { id: "memorial-day", name: "Memorial Day", rule: { type: "lastWeekday", month: 4, weekday: 1 }, assignDefault: "alternate" },
  { id: "fathers-day", name: "Father's Day", rule: { type: "nthWeekday", month: 5, weekday: 0, n: 3 }, assignDefault: "role:father" },
  { id: "july-4", name: "Independence Day", rule: { type: "fixed", month: 6, day: 4 }, assignDefault: "alternate" },
  { id: "labor-day", name: "Labor Day", rule: { type: "nthWeekday", month: 8, weekday: 1, n: 1 }, assignDefault: "alternate" },
  { id: "halloween", name: "Halloween", rule: { type: "fixed", month: 9, day: 31 }, assignDefault: "alternate" },
  { id: "thanksgiving", name: "Thanksgiving Break", rule: { type: "nthWeekdayRange", month: 10, weekday: 4, n: 4, days: 4, direction: "forward" }, assignDefault: "alternate" },
  { id: "winter-break", name: "Winter Break", rule: { type: "fixedRange", month: 11, day: 21, days: 12 }, assignDefault: "alternate" },
  { id: "christmas-eve", name: "Christmas Eve", rule: { type: "fixed", month: 11, day: 24 }, assignDefault: "alternate" },
  { id: "christmas-day", name: "Christmas Day", rule: { type: "fixed", month: 11, day: 25 }, assignDefault: "alternate" },
];

// Most-specific holiday wins when date ranges overlap (e.g. Christmas Day within Winter Break)
export const HOLIDAY_PRIORITY = [
  "christmas-day", "christmas-eve", "new-year", "thanksgiving",
  "mothers-day", "fathers-day", "july-4", "halloween", "labor-day",
  "memorial-day", "mlk", "spring-break", "winter-break",
];

export function getHolidayDef(id: string): HolidayDef | undefined {
  return HOLIDAY_DEFS.find((h) => h.id === id);
}
