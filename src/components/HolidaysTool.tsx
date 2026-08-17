import { HOLIDAY_DEFS } from "../lib/data";
import { parentColorHex, parentDisplayName } from "../lib/derived";
import { computeDefaultHolidayParent, computeHolidayRange } from "../lib/schedule";
import type { DateRange, HolidayDef, ParentIdx } from "../lib/types";
import { formatDisplayDate, formatShortDate, initials } from "../lib/utils";
import { usePlan } from "../state/PlanContext";

function formatHolidayRangeLabel(range: DateRange | null): string {
  if (!range) return "Date not set";
  if (range.start === range.end) return formatDisplayDate(range.start, { weekday: false });
  return `${formatShortDate(range.start)} – ${formatDisplayDate(range.end, { weekday: false })}`;
}

function HolidayItem({ def }: { def: HolidayDef }) {
  const { state, actions } = usePlan();
  const year = state.holidayYear;
  const range = computeHolidayRange(def, year, state);
  const overrideKey = `${def.id}-${year}`;
  const isManualType = def.rule.type === "manual";
  const isEditing = state.editingHolidayKey === overrideKey;

  if (isManualType && (!range || isEditing)) {
    const existing = state.holidayCustomDates[overrideKey] || { start: "", end: "" };
    return (
      <div className="holiday-item" style={{ flexDirection: "column", alignItems: "stretch" }}>
        <div className="holiday-info">
          <span className="holiday-name">{def.name}</span>
          <span className="holiday-date">{range ? "Editing dates" : `No dates set for ${year}`}</span>
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
      </div>
    );
  }

  const overrideParent = state.holidayOverrides[overrideKey];
  const parentIdx = overrideParent != null ? overrideParent : computeDefaultHolidayParent(def, year, state);

  return (
    <div className="holiday-item">
      <div className="holiday-info">
        <span className="holiday-name">{def.name}</span>
        <span className="holiday-date">
          {formatHolidayRangeLabel(range)}{overrideParent == null ? " · alternates yearly" : " · overridden"}
        </span>
        {isManualType && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ padding: "2px 0", justifyContent: "flex-start" }}
            onClick={() => actions.setEditingHolidayKey(overrideKey)}
          >
            Edit dates
          </button>
        )}
      </div>
      <div className="holiday-assign">
        {([0, 1] as ParentIdx[]).map((idx) => (
          <button
            key={idx}
            type="button"
            className={`assign-btn ${parentIdx === idx ? "active" : ""}`}
            style={{ background: parentColorHex(state, idx) }}
            title={`Assign to ${parentDisplayName(state, idx)}`}
            onClick={() => actions.setHolidayOverride(overrideKey, idx)}
          >
            {initials(parentDisplayName(state, idx))[0]}
          </button>
        ))}
        {overrideParent != null && (
          <button
            type="button"
            className="icon-btn"
            title="Reset to alternating"
            onClick={() => actions.setHolidayOverride(overrideKey, null)}
          >
            &#8635;
          </button>
        )}
      </div>
    </div>
  );
}

export function HolidaysTool() {
  const { state, actions } = usePlan();
  return (
    <>
      <div className="year-select-row">
        <button type="button" className="icon-btn" aria-label="Previous year" onClick={() => actions.setHolidayYear(state.holidayYear - 1)}>&larr;</button>
        <h2 className="spacer" style={{ textAlign: "center" }}>{state.holidayYear}</h2>
        <button type="button" className="icon-btn" aria-label="Next year" onClick={() => actions.setHolidayYear(state.holidayYear + 1)}>&rarr;</button>
      </div>
      <p className="section-sub">
        Holidays default to alternating between parents each year. Tap a color to override a specific year — it won't affect other years.
      </p>
      <div>
        {HOLIDAY_DEFS.map((def) => <HolidayItem key={def.id} def={def} />)}
      </div>
    </>
  );
}
