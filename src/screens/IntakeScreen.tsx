import { PARENT_COLORS } from "../lib/data";
import type { ParentIdx, ParentRole } from "../lib/types";
import { initials } from "../lib/utils";
import { usePlan } from "../state/PlanContext";

function ColorSwatches({ idx, currentColor }: { idx: ParentIdx; currentColor: string }) {
  const { actions } = usePlan();
  return (
    <div className="color-swatches">
      {PARENT_COLORS.map((c) => (
        <button
          key={c.id}
          type="button"
          className={`swatch ${c.id === currentColor ? "active" : ""}`}
          style={{ background: c.hex }}
          aria-label={c.id}
          onClick={() => actions.updateParent(idx, { color: c.id })}
        />
      ))}
    </div>
  );
}

const ROLES: { id: ParentRole; label: string }[] = [
  { id: "", label: "None" },
  { id: "mother", label: "Mother" },
  { id: "father", label: "Father" },
];

function RoleChips({ idx, currentRole }: { idx: ParentIdx; currentRole: ParentRole }) {
  const { actions } = usePlan();
  return (
    <div className="role-select">
      {ROLES.map((r) => (
        <button
          key={r.id}
          type="button"
          className={`role-chip ${r.id === (currentRole || "") ? "active" : ""}`}
          onClick={() => actions.setParentRole(idx, r.id)}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

function ParentRow({ idx }: { idx: ParentIdx }) {
  const { state, actions } = usePlan();
  const p = state.parents[idx];
  const hex = PARENT_COLORS.find((c) => c.id === p.color)!.hex;

  return (
    <div className="parent-row">
      <div className="parent-avatar" style={{ background: hex }}>{initials(p.name)}</div>
      <div className="parent-fields">
        <input
          type="text"
          className="parent-name-input"
          placeholder={`Parent ${idx === 0 ? "A" : "B"} name`}
          value={p.name}
          maxLength={40}
          onChange={(e) => actions.updateParent(idx, { name: e.target.value })}
        />
        <ColorSwatches idx={idx} currentColor={p.color} />
        <div className="field">
          <label>Role (used for Mother's / Father's Day defaults — optional)</label>
          <RoleChips idx={idx} currentRole={p.role} />
        </div>
      </div>
    </div>
  );
}

function KidChip({ kid }: { kid: { id: string; name: string } }) {
  const { state, actions } = usePlan();
  return (
    <div className="kid-chip">
      <input
        type="text"
        placeholder="Child's name"
        value={kid.name}
        maxLength={40}
        onChange={(e) => actions.updateKid(kid.id, e.target.value)}
      />
      {state.kids.length > 1 && (
        <button
          type="button"
          className="kid-remove"
          aria-label="Remove"
          onClick={() => actions.removeKid(kid.id)}
        >
          &times;
        </button>
      )}
    </div>
  );
}

export function IntakeScreen() {
  const { state, actions } = usePlan();
  return (
    <>
      <div className="card">
        <div className="section-title">Parents</div>
        <ParentRow idx={0} />
        <ParentRow idx={1} />
      </div>
      <div className="card">
        <div className="section-title">Children</div>
        {state.kids.map((kid) => <KidChip key={kid.id} kid={kid} />)}
        <button type="button" className="add-kid-btn mt-8" onClick={() => actions.addKid()}>
          + Add another child
        </button>
      </div>
      <p className="section-sub">
        Names and colors are used throughout the calendar, summary, and holiday schedule so the plan stays easy to read at a glance.
      </p>
    </>
  );
}
