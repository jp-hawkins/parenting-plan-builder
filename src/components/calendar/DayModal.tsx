import { parentColorHex, parentDisplayName } from "../../lib/derived";
import { getAssignedParent } from "../../lib/schedule";
import type { ParentIdx } from "../../lib/types";
import { formatDisplayDate, formatShortDate } from "../../lib/utils";
import { usePlan } from "../../state/PlanContext";

export function DayModal({ dateStr, onClose }: { dateStr: string; onClose: () => void }) {
  const { state, actions } = usePlan();
  const a = getAssignedParent(dateStr, state);
  const isManual = state.overrides[dateStr] != null;

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>{formatDisplayDate(dateStr)}</h3>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>&times;</button>
        </div>
        {a.source === "holiday" && a.holiday && (
          <div className="pill">&#9733; {a.holiday.def.name}</div>
        )}
        <div className="section-title">Overnight parent</div>
        <div className="assign-options">
          {([0, 1] as ParentIdx[]).map((idx) => (
            <button
              key={idx}
              type="button"
              className={`assign-option ${a.parentIdx === idx ? "selected" : ""}`}
              onClick={() => actions.setDayOverride(dateStr, idx)}
            >
              <span className="dot" style={{ background: parentColorHex(state, idx) }} />
              {parentDisplayName(state, idx)}
            </button>
          ))}
        </div>
        {isManual && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => actions.clearDayOverride(dateStr)}>
            Reset to schedule default
          </button>
        )}
        <p className="section-sub">
          Changing this day only affects {formatShortDate(dateStr)}. The regular rotation resumes the next day unless you adjust it too.
        </p>
      </div>
    </div>
  );
}
