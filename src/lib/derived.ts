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

// ------------------------------------------------------------
// Plan Details section completion (drives the checklist tool)
// ------------------------------------------------------------
export function isChildrenAgesComplete(state: AppState): boolean {
  return state.kids.every((k) => k.age.trim().length > 0);
}

export function isLimitationsComplete(state: AppState): boolean {
  return state.planDetails.hasLimitations !== null;
}

export function isCustodianComplete(state: AppState): boolean {
  return state.planDetails.custodianParentIdx !== null;
}

export function isDecisionMakingComplete(state: AppState): boolean {
  return state.planDetails.decisionCategories.every((c) => {
    if (!c.label.trim()) return false;
    if (c.mode === null) return false;
    if (c.mode === "limited" && c.limitedParent === null) return false;
    return true;
  });
}

export function isDisputeResolutionComplete(state: AppState): boolean {
  const d = state.planDetails.disputeResolution;
  return d.method !== null; // provider name is optional — a court can name one later
}

export function isTransportationComplete(state: AppState): boolean {
  const t = state.planDetails.transportation;
  if (t.location === null || t.responsible === null) return false;
  if (t.location === "other" && !t.locationOther.trim()) return false;
  return true;
}

export function planDetailsSectionsComplete(state: AppState): boolean[] {
  return [
    true, // case info (county/cause number) is optional — often not yet filed
    isChildrenAgesComplete(state),
    isLimitationsComplete(state),
    isCustodianComplete(state),
    isDecisionMakingComplete(state),
    isDisputeResolutionComplete(state),
    isTransportationComplete(state),
  ];
}

export function isPlanDetailsComplete(state: AppState): boolean {
  return planDetailsSectionsComplete(state).every(Boolean);
}
