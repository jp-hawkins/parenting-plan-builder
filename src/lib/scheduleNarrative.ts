// ============================================================
// Plain-English descriptions of the schedule, for the assembled
// Parenting Plan document (mirrors Attachment R's structure)
// ============================================================

import { getTemplate, SCHOOL_CALENDAR_ELIGIBLE } from "./data";
import { parentDisplayName } from "./derived";
import { computeDefaultHolidayParent, computeSummary, getEffectiveHolidayOrder, getHolidayDefById } from "./schedule";
import type { AppState } from "./types";
import { formatDisplayDate } from "./utils";

export function describeResidentialSchedule(state: AppState): string {
  const template = getTemplate(state.template.id);
  if (!template) return "No schedule has been selected yet.";
  const startParentName = parentDisplayName(state, state.template.startParent);
  const year = new Date().getFullYear();
  const summary = computeSummary(state, `${year}-01-01`, `${year}-12-31`);

  const base = `The children follow a ${template.name} residential schedule (${template.tagline.toLowerCase()}): `
    + `${template.description} `
    + `${startParentName} has the children beginning ${formatDisplayDate(state.template.startDate, { weekday: false })}.`;

  const split = `Based on this schedule, ${parentDisplayName(state, 0)} has approximately ${Math.round(summary.pct[0])}% `
    + `and ${parentDisplayName(state, 1)} has approximately ${Math.round(summary.pct[1])}% of overnights in a typical year, `
    + `with about ${summary.exchanges} exchanges per year.`;

  return `${base} ${split}`;
}

export interface HolidayNarrativeRow {
  name: string;
  description: string;
}

export function describeHolidaySchedule(state: AppState): HolidayNarrativeRow[] {
  const year = state.holidayAlternateBaseYear ?? new Date().getFullYear();
  const order = getEffectiveHolidayOrder(state);
  return order.map((id) => {
    const def = getHolidayDefById(id, state);
    if (!def) return null;

    const usesManualDates = def.rule.type === "manual" || state.holidayDateMode[def.id] === "school-calendar";
    const treatment = state.holidayTreatments[def.id];
    const dateNote = usesManualDates
      ? (SCHOOL_CALENDAR_ELIGIBLE.includes(def.id) ? "Follows the school calendar — dates set each year. " : "Dates vary by year — set in the Holidays tab. ")
      : "";

    if (treatment && treatment.mode === "fixed-parent" && treatment.fixedParent !== null) {
      return { name: def.name, description: `${dateNote}Every year with ${parentDisplayName(state, treatment.fixedParent)}.` };
    }
    if (def.assignDefault.startsWith("role:")) {
      const role = def.assignDefault.split(":")[1];
      const idx = state.parents.findIndex((p) => p.role === role);
      if (idx !== -1) {
        return { name: def.name, description: `${dateNote}Every year with ${parentDisplayName(state, idx as 0 | 1)}.` };
      }
    }
    const evenYearParent = computeDefaultHolidayParent(def, year, state);
    const oddYearParent = (1 - evenYearParent) as 0 | 1;
    return {
      name: def.name,
      description: `${dateNote}Even years with ${parentDisplayName(state, evenYearParent)}; odd years with ${parentDisplayName(state, oddYearParent)}.`,
    };
  }).filter((row): row is HolidayNarrativeRow => row !== null);
}
