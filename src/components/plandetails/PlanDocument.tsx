import { getStandardProvision } from "../../lib/data";
import { parentDisplayName } from "../../lib/derived";
import { describeHolidaySchedule, describeResidentialSchedule } from "../../lib/scheduleNarrative";
import { usePlan } from "../../state/PlanContext";

function Check({ checked }: { checked: boolean }) {
  return <span className="doc-check">{checked ? "☒" : "☐"}</span>;
}

function decisionModeLabel(mode: "joint" | "limited" | null, limitedParentName: string): string {
  if (mode === "joint") return "Joint";
  if (mode === "limited") return `Limited — ${limitedParentName}`;
  return "Not yet decided";
}

export function PlanDocument() {
  const { state } = usePlan();
  const p = state.planDetails;
  const nameA = parentDisplayName(state, 0);
  const nameB = parentDisplayName(state, 1);
  const holidayRows = describeHolidaySchedule(state);

  return (
    <div className="plan-doc">
      <h2>Parenting Plan</h2>
      <div className="doc-subtitle">Washington State — Use form FL All Family 140 · Drafted with Parenting Plan Builder</div>

      <div className="doc-section">
        <div className="doc-line">Superior Court of Washington, County of {p.county || "____________________"}</div>
        <div className="doc-line">Cause No. {p.causeNumber || "____________________"}</div>
        <div className="doc-line">In re the parenting plan for: {nameA} and {nameB}</div>
      </div>

      <div className="doc-section">
        <div className="doc-section-title">1. This Parenting Plan is a</div>
        <div className="doc-line"><Check checked /> Proposal (request) by: {nameA}{nameB ? `, ${nameB}` : ""}. It is not a signed court order.</div>
      </div>

      <div className="doc-section">
        <div className="doc-section-title">2. Children</div>
        <table>
          <thead><tr><th>Child's name</th><th>Age</th></tr></thead>
          <tbody>
            {state.kids.map((k) => (
              <tr key={k.id}><td>{k.name || "—"}</td><td>{k.age || "—"}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="doc-section">
        <div className="doc-section-title">3. Limitations on a Parent (RCW 26.09.191/.192)</div>
        {p.hasLimitations === false && (
          <div className="doc-line"><Check checked /> Neither parent (or person living with a parent) has abandonment, abuse, domestic violence, assault, or other limiting problems.</div>
        )}
        {p.hasLimitations === true && (
          <>
            <div className="doc-line">
              <Check checked /> A parent, or person living with a parent, has one or more limiting problems.
              <strong> Complete Attachments A/B with your attorney</strong> — not covered by this drafting tool.
            </div>
            {p.limitationsExplanation && (
              <div className="doc-line"><strong>Described concerns:</strong> {p.limitationsExplanation}</div>
            )}
          </>
        )}
        {p.hasLimitations === null && <div className="doc-line text-muted">Not yet determined.</div>}
      </div>

      <div className="doc-section">
        <div className="doc-section-title">4. Custodian</div>
        <div className="doc-line">
          The custodian is: {p.custodianParentIdx !== null ? parentDisplayName(state, p.custodianParentIdx) : "____________________"}
          {" "}(solely for state/federal statutes requiring a custody designation — does not change either parent's rights under this plan).
        </div>
      </div>

      <div className="doc-section">
        <div className="doc-section-title">5. Parenting Time Schedule (Attachment R)</div>
        <div className="doc-line">{describeResidentialSchedule(state)}</div>
        <table>
          <thead><tr><th>Holiday</th><th>Schedule</th></tr></thead>
          <tbody>
            {holidayRows.map((row) => (
              <tr key={row.name}><td>{row.name}</td><td>{row.description}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="doc-section">
        <div className="doc-section-title">6. Decision-Making</div>
        <table>
          <thead><tr><th>Type of decision</th><th>Who decides</th></tr></thead>
          <tbody>
            {p.decisionCategories.map((c) => (
              <tr key={c.id}>
                <td>{c.label || "—"}</td>
                <td>{decisionModeLabel(c.mode, c.limitedParent !== null ? parentDisplayName(state, c.limitedParent) : "—")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="doc-section">
        <div className="doc-section-title">7. Dispute Resolution</div>
        {p.disputeResolution.method === "court" && <div className="doc-line">The parents will go directly to court, without mediation, arbitration, or counseling.</div>}
        {p.disputeResolution.method === "provider" && (
          <>
            <div className="doc-line">
              The parents will use {p.disputeResolution.providerType}
              {p.disputeResolution.providerName ? ` (${p.disputeResolution.providerName})` : ""} before going to court.
            </div>
            <div className="doc-line">
              Notice will be given by {p.disputeResolution.noticeMethod === "certified-mail" ? "certified mail" : p.disputeResolution.noticeOther || "other means"}.
            </div>
            <div className="doc-line">
              Cost: {p.disputeResolution.costSplit === "fixed-percent"
                ? `${nameA} pays ${p.disputeResolution.costPercent[0]}%, ${nameB} pays ${p.disputeResolution.costPercent[1]}%.`
                : p.disputeResolution.costSplit === "income-based"
                  ? "Based on each parent's proportional share of income."
                  : "As decided through the dispute resolution process."}
            </div>
          </>
        )}
        {p.disputeResolution.method === null && <div className="doc-line text-muted">Not yet decided.</div>}
      </div>

      <div className="doc-section">
        <div className="doc-section-title">8. Transportation Arrangements</div>
        <div className="doc-line">
          Exchanges will happen at: {p.transportation.location === "each-home" ? "each parent's home"
            : p.transportation.location === "school-daycare" ? "school or daycare, when in session"
              : p.transportation.location === "other" ? (p.transportation.locationOther || "a specified location")
                : "____________________"}
        </div>
        <div className="doc-line">
          Responsible for arranging transportation: {p.transportation.responsible === "picking-up"
            ? "the parent about to start parenting time (picking up)"
            : p.transportation.responsible === "dropping-off" ? "the parent whose time is ending (dropping off)" : "____________________"}
        </div>
        {p.transportation.otherDetails && <div className="doc-line">{p.transportation.otherDetails}</div>}
      </div>

      <div className="doc-section">
        <div className="doc-section-title">9. Moving with the Children (Relocation)</div>
        <div className="doc-line text-muted">
          Standard Washington relocation notice requirements apply (RCW 26.09.430–.480). A parent with a
          majority or substantially equal residential schedule who wants to relocate with the children must
          give written notice to every other person with court-ordered time.
        </div>
      </div>

      <div className="doc-section">
        <div className="doc-section-title">10. Other</div>
        {p.selectedProvisions.length === 0 && !p.otherProvisions && <div className="doc-line">—</div>}
        {p.selectedProvisions.map((id) => {
          const provision = getStandardProvision(id);
          if (!provision) return null;
          return (
            <div className="doc-line" key={id}>
              <strong>{provision.label}.</strong> {provision.text}
            </div>
          );
        })}
        {p.otherProvisions && <div className="doc-line">{p.otherProvisions}</div>}
      </div>
    </div>
  );
}
