import type {
  DecisionCategory, GuidedQuestion, HolidayDef, ParentColor, PlanDetails, ScheduleTemplate, StandardProvision,
} from "./types";
import { uid } from "./utils";

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

// Holidays whose dates can optionally be left to the school calendar
// instead of a computed default (their exact dates vary district to district).
export const SCHOOL_CALENDAR_ELIGIBLE = ["winter-break", "thanksgiving", "spring-break"];

export function newCustomHoliday(name: string): HolidayDef {
  return { id: uid("occasion"), name, rule: { type: "manual" }, assignDefault: "alternate" };
}

// ------------------------------------------------------------
// Plan Details defaults (case info, decision-making, dispute
// resolution, transportation — mirrors FL All Family 140)
// ------------------------------------------------------------
export function defaultDecisionCategories(): DecisionCategory[] {
  return [
    { id: "school", label: "School/Educational", isFixed: true, mode: null, limitedParent: null },
    { id: "healthcare", label: "Healthcare (not emergency)", isFixed: true, mode: null, limitedParent: null },
  ];
}

export const MAX_DECISION_CATEGORIES = 5;

export function newDecisionCategory(): DecisionCategory {
  return { id: uid("cat"), label: "", isFixed: false, mode: null, limitedParent: null };
}

// ------------------------------------------------------------
// Standard "Other" provisions — common boilerplate clauses a
// parent can opt into for section 10, grouped by topic. More
// will be added over time, so categories may start out thin.
// ------------------------------------------------------------
export const STANDARD_PROVISIONS: StandardProvision[] = [
  {
    id: "flexibility",
    category: "Plan Administration",
    label: "Flexibility in Residential Schedule",
    text: "The parties are encouraged to implement the residential schedule flexibly.",
  },
  {
    id: "no-waiver",
    category: "Plan Administration",
    label: "No Waiver of Deviations",
    text: "Acceptance or waiver of any deviations from the provisions of the Parenting Plan shall not constitute acceptance or waiver of subsequent deviations. The provisions of this plan shall remain in effect until modified by an appropriate written order entered by a court of competent jurisdiction.",
  },
  {
    id: "conditioning-performance",
    category: "Plan Administration",
    label: "Conditioning Performance of Parenting Plan",
    text: "Pursuant to RCW 26.09.160, an attempt by any parent, in any negotiation for the performance of this Parenting Plan, to condition one aspect of the Parenting Plan upon another, may be deemed to be in bad faith. If the court finds that a parent acted in bad faith in an attempt to condition parental functions, in a refusal to perform the duties provided in the Parenting Plan, or in the hindrance of performance of the other parent, the court may punish that conduct by a private award or other remedies including criminal or civil contempt and attorney's fees.",
  },
  {
    id: "telephone",
    category: "Communication",
    label: "Telephone Access",
    text: "The child(ren) shall have liberal telephone privileges with the parent with whom the child(ren) is/are not then residing (or vacationing), without interference of the other parent. Both parents shall make all reasonable efforts to ensure the child(ren) understand how to make phone calls to the other parent. Neither parent may monitor the other parent's phone conversations with the child(ren).",
  },
  {
    id: "no-derogatory-comments",
    category: "Co-Parenting Conduct",
    label: "No Derogatory Comments",
    text: "Neither parent shall make derogatory comments about the other parent or allow anyone else to do the same in the child(ren)'s presence. Neither parent shall allow or encourage the child(ren) to make derogatory comments about the other parent. Each parent agrees to exert every reasonable effort to promote the emotions of affection, love, and respect between the child(ren) and the other parent. Each parent agrees to refrain from words or conduct, and both parents agree to discourage other persons from uttering words or engaging in conduct, which would have a tendency to estrange the child(ren) from the other parent, to damage the opinion of the child(ren) as to the other parent, or which would impair the natural development of the child(ren)'s love and respect for the other parent.",
  },
  {
    id: "respect-parenting-style",
    category: "Co-Parenting Conduct",
    label: "Respect for Parenting Style, Privacy & Authority",
    text: "Each parent agrees to honor one another's parenting style, privacy and authority. Neither parent shall interfere in the parenting style of the other nor shall either parent make plans or arrangements that would impinge upon the other parent's authority or time with the child(ren) without the express agreement of the other. Each parent shall encourage the child(ren) to discuss her grievance against a parent directly with the parent in question. It is the intent of both parents to encourage direct parent-child bonding and communication.",
  },
  {
    id: "religion",
    category: "Religion",
    label: "Religion",
    text: "Each parent shall be entitled to have the child(ren) participate with him/her in his/her religious activities. Neither parent shall disparage the other parent's religious activities or attempt to sway the child(ren) to his/her respective religious or philosophical viewpoint.",
  },
  {
    id: "emergency-contact",
    category: "Safety & Notice",
    label: "Emergency Contact Number and Address",
    text: "Each parent will keep the other informed at all times of emergency telephone contact numbers and the residential address of the child(ren).",
  },
  {
    id: "away-from-residence",
    category: "Safety & Notice",
    label: "Child(ren) Away from Residence",
    text: "Each parent will inform the other when that parent plans to be away from his or her residence with the child(ren) for more than two nights. The information to be provided should include duration of the period, and the name(s), address(es), and telephone number(s) of the destination(s).",
  },
];

export function getStandardProvision(id: string): StandardProvision | undefined {
  return STANDARD_PROVISIONS.find((p) => p.id === id);
}

export function getProvisionCategories(): string[] {
  const seen: string[] = [];
  for (const p of STANDARD_PROVISIONS) {
    if (!seen.includes(p.category)) seen.push(p.category);
  }
  return seen;
}

export function getProvisionsByCategory(category: string): StandardProvision[] {
  return STANDARD_PROVISIONS.filter((p) => p.category === category);
}

export function defaultPlanDetails(): PlanDetails {
  return {
    county: "",
    causeNumber: "",
    hasLimitations: null,
    limitationsExplanation: "",
    custodianParentIdx: null,
    decisionCategories: defaultDecisionCategories(),
    disputeResolution: {
      method: null,
      providerType: "mediation",
      providerName: "",
      noticeMethod: "certified-mail",
      noticeOther: "",
      costSplit: "fixed-percent",
      costPercent: [50, 50],
    },
    selectedProvisions: [],
    transportation: {
      location: null,
      locationOther: "",
      responsible: null,
      otherDetails: "",
    },
    otherProvisions: "",
  };
}
