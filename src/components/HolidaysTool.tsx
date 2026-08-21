import { useState } from "react";
import { HOLIDAY_DEFS, SCHOOL_CALENDAR_ELIGIBLE } from "../lib/data";
import { parentColorHex, parentDisplayName } from "../lib/derived";
import { computeDefaultHolidayParent, computeHolidayRange, getHolidayDefById } from "../lib/schedule";
import type { DateRange, HolidayDef, ParentIdx } from "../lib/types";
import { formatDisplayDate, formatShortDate, initials } from "../lib/utils";
import { usePlan } from "../state/PlanContext";

function formatHolidayRangeLabel(range: DateRange | null): string {
  if (!range) return "Date not set";
  if (range.start === range.end) return formatDisplayDate(range.start, { weekday: false });
  return `${formatShortDate(range.start)} – ${formatDisplayDate(range.end, { weekday: false })}`;
}

function treatmentValue(id: string, state: ReturnType<typeof usePlan>["state"]): string {
  const t = state.holidayTreatments[id];
  if (t && t.mode === "fixed-parent" && t.fixedParent !== null) return `fixed-${t.fixedParent}`;
  return "alternate";
}

function TreatmentSelect({ def }: { def: HolidayDef }) {
  const { state, actions } = usePlan();
  return (
    <select
      value={treatmentValue(def.id, state)}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "alternate") actions.setHolidayTreatment(def.id, { mode: "alternate", fixedParent: null });
        else actions.setHolidayTreatment(def.id, { mode: "fixed-parent", fixedParent: (v === "fixed-0" ? 0 : 1) as ParentIdx });
      }}
    >
      <option value="alternate">Alternates yearly</option>
      <option value="fixed-0">Every year with {parentDisplayName(state, 0)}</option>
      <option value="fixed-1">Every year with {parentDisplayName(state, 1)}</option>
    </select>
  );
}

function HolidayItem({ def, isCustom }: { def: HolidayDef; isCustom: boolean }) {
  const { state, actions } = usePlan();
  const year = state.holidayYear;
  const dateMode = state.holidayDateMode[def.id];
  const isSchoolCalendarEligible = SCHOOL_CALENDAR_ELIGIBLE.includes(def.id);
  const usesManualDates = def.rule.type === "manual" || dateMode === "school-calendar";
  const range = computeHolidayRange(def, year, state);
  const overrideKey = `${def.id}-${year}`;
  const isEditing = state.editingHolidayKey === overrideKey;

  const deleteButton = (
    <button
      type="button"
      className="icon-btn"
      aria-label={`Remove ${def.name}`}
      title="Remove this holiday"
      onClick={() => (isCustom ? actions.removeCustomHoliday(def.id) : actions.removeHoliday(def.id))}
    >
      &#128465;
    </button>
  );

  if (usesManualDates && (!range || isEditing)) {
    const existing = state.holidayCustomDates[overrideKey] || { start: "", end: "" };
    return (
      <div className="holiday-item" style={{ flexDirection: "column", alignItems: "stretch" }}>
        <div className="flex-row" style={{ justifyContent: "space-between" }}>
          <div className="holiday-info">
            <span className="holiday-name">{def.name}</span>
            <span className="holiday-date">
              {isSchoolCalendarEligible ? "Follows the school calendar — " : ""}
              {range ? "editing dates" : `no dates set for ${year}`}
            </span>
          </div>
          {deleteButton}
        </div>
        <div className="flex-row mt-8">
          <div className="field" style={{ flex: 1 }}>
            <label>Start</label>
            <input
              type="date"
              defaultValue={existing.start}
              onChange={(e) => {
                const value = e.target.value;
                if (!value) return;
                const cur = state.holidayCustomDates[overrideKey] || {};
                actions.setHolidayCustomRange(overrideKey, { start: value, end: cur.end || value });
              }}
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>End</label>
            <input
              type="date"
              defaultValue={existing.end}
              onChange={(e) => {
                const value = e.target.value;
                if (!value) return;
                const cur = state.holidayCustomDates[overrideKey] || {};
                actions.setHolidayCustomRange(overrideKey, { start: cur.start || value, end: value });
                actions.setEditingHolidayKey(null);
              }}
            />
          </div>
        </div>
        {isSchoolCalendarEligible && def.rule.type !== "manual" && (
          <button type="button" className="btn btn-ghost btn-sm mt-8" style={{ justifyContent: "flex-start", padding: 0 }}
            onClick={() => actions.setHolidayDateMode(def.id, "auto")}>
            Use standard dates instead
          </button>
        )}
        <div className="mt-8"><TreatmentSelect def={def} /></div>
      </div>
    );
  }

  const overrideParent = state.holidayOverrides[overrideKey];
  const parentIdx = overrideParent != null ? overrideParent : computeDefaultHolidayParent(def, year, state);

  return (
    <div className="holiday-item" style={{ flexDirection: "column", alignItems: "stretch" }}>
      <div className="flex-row" style={{ justifyContent: "space-between" }}>
        <div className="holiday-info">
          <span className="holiday-name">{def.name}</span>
          <span className="holiday-date">
            {formatHolidayRangeLabel(range)}{overrideParent == null ? "" : " · overridden this year"}
          </span>
        </div>
        {deleteButton}
      </div>
      <div className="flex-row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <TreatmentSelect def={def} />
        <div className="holiday-assign">
          {([0, 1] as ParentIdx[]).map((idx) => (
            <button
              key={idx}
              type="button"
              className={`assign-btn ${parentIdx === idx ? "active" : ""}`}
              style={{ background: parentColorHex(state, idx) }}
              title={`Override ${year} only: assign to ${parentDisplayName(state, idx)}`}
              onClick={() => actions.setHolidayOverride(overrideKey, idx)}
            >
              {initials(parentDisplayName(state, idx))[0]}
            </button>
          ))}
          {overrideParent != null && (
            <button
              type="button"
              className="icon-btn"
              title={`Clear ${year} override`}
              onClick={() => actions.setHolidayOverride(overrideKey, null)}
            >
              &#8635;
            </button>
          )}
        </div>
      </div>
      {def.rule.type === "manual" && (
        <button type="button" className="btn btn-ghost btn-sm" style={{ padding: "2px 0", justifyContent: "flex-start" }}
          onClick={() => actions.setEditingHolidayKey(overrideKey)}>
          Edit dates
        </button>
      )}
      {isSchoolCalendarEligible && def.rule.type !== "manual" && (
        <button type="button" className="btn btn-ghost btn-sm" style={{ padding: "2px 0", justifyContent: "flex-start" }}
          onClick={() => actions.setHolidayDateMode(def.id, "school-calendar")}>
          Follow the school calendar instead
        </button>
      )}
    </div>
  );
}

function AddSpecialOccasion() {
  const { actions } = usePlan();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  if (!adding) {
    return (
      <button type="button" className="add-kid-btn" onClick={() => setAdding(true)}>
        + Add special occasion
      </button>
    );
  }

  const submit = () => {
    if (name.trim()) actions.addCustomHoliday(name.trim());
    setName("");
    setAdding(false);
  };

  return (
    <div className="holiday-item" style={{ flexDirection: "column", alignItems: "stretch" }}>
      <div className="field">
        <label>Occasion name</label>
        <input
          type="text"
          placeholder="e.g. Grandma's Birthday"
          value={name}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        />
      </div>
      <div className="flex-row mt-8">
        <button type="button" className="btn btn-secondary" onClick={() => { setAdding(false); setName(""); }}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={submit} disabled={!name.trim()}>Add</button>
      </div>
    </div>
  );
}

function RemovedHolidays() {
  const { state, actions } = usePlan();
  if (state.removedHolidayIds.length === 0) return null;
  return (
    <div className="card mt-16">
      <div className="section-title">Removed</div>
      <div className="flex-row" style={{ flexWrap: "wrap" }}>
        {state.removedHolidayIds.map((id) => {
          const def = getHolidayDefById(id, state);
          if (!def) return null;
          return (
            <span className="pill" key={id}>
              {def.name}
              <button type="button" className="btn btn-ghost btn-sm" style={{ padding: "0 0 0 4px" }}
                onClick={() => actions.restoreHoliday(id)}>
                Add back
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function HolidaysTool() {
  const { state, actions } = usePlan();
  const visibleBuiltIns = HOLIDAY_DEFS.filter((d) => !state.removedHolidayIds.includes(d.id));
  const visibleCustom = state.customHolidays.filter((d) => !state.removedHolidayIds.includes(d.id));

  return (
    <>
      <div className="year-select-row">
        <button type="button" className="icon-btn" aria-label="Previous year" onClick={() => actions.setHolidayYear(state.holidayYear - 1)}>&larr;</button>
        <h2 className="spacer" style={{ textAlign: "center" }}>{state.holidayYear}</h2>
        <button type="button" className="icon-btn" aria-label="Next year" onClick={() => actions.setHolidayYear(state.holidayYear + 1)}>&rarr;</button>
      </div>
      <p className="section-sub">
        Holidays default to alternating between parents each year. Change how any holiday is treated, override a
        specific year, or remove ones you don't need.
      </p>
      <div>
        {visibleBuiltIns.map((def) => <HolidayItem key={def.id} def={def} isCustom={false} />)}
      </div>

      <div className="section-title mt-16">Special Occasions</div>
      {visibleCustom.length > 0 && (
        <div>
          {visibleCustom.map((def) => <HolidayItem key={def.id} def={def} isCustom />)}
        </div>
      )}
      <div className="mt-8"><AddSpecialOccasion /></div>

      <RemovedHolidays />
    </>
  );
}
