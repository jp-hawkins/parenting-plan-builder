import { PARENT_COLORS } from "./data";
import type { AppState, ParentIdx } from "./types";

export function parentDisplayName(state: AppState, idx: ParentIdx): string {
  const p = state.parents[idx];
  return (p && p.name && p.name.trim()) || `Parent ${idx === 0 ? "A" : "B"}`;
}

export function parentColorHex(state: AppState, idx: ParentIdx): string {
  const p = state.parents[idx];
  const c = PARENT_COLORS.find((c) => c.id === (p && p.color));
  return c ? c.hex : "#999999";
}

export function isIntakeComplete(state: AppState): boolean {
  return state.parents.every((p) => p.name.trim().length > 0) &&
    state.kids.some((k) => k.name.trim().length > 0);
}

export function isScheduleComplete(state: AppState): boolean {
  return !!state.template.id && !!state.template.startDate;
}
