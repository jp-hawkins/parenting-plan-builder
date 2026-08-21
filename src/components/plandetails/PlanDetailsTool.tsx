import { useState } from "react";
import type { ReactNode } from "react";
import { getProvisionCategories, getProvisionsByCategory, MAX_DECISION_CATEGORIES } from "../../lib/data";
import {
  isChildrenAgesComplete, isCustodianComplete, isDecisionMakingComplete,
  isDisputeResolutionComplete, isLimitationsComplete, isTransportationComplete,
  parentColorHex, parentDisplayName,
} from "../../lib/derived";
import type { DisputeProviderType, ExchangeLocation, ParentIdx } from "../../lib/types";
import { usePlan } from "../../state/PlanContext";
import { PlanDocument } from "./PlanDocument";

// ------------------------------------------------------------
// Accordion shell
// ------------------------------------------------------------
function AccordionSection({
  title, done, isOpen, onToggle, children,
}: { title: string; done: boolean; isOpen: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div className="accordion-section">
      <button type="button" className="accordion-header" onClick={onToggle}>
        <span className={`status-dot ${done ? "done" : ""}`} />
        <span className="accordion-title">{title}</span>
        <span className={`accordion-chevron ${isOpen ? "open" : ""}`}>&#9656;</span>
      </button>
      {isOpen && <div className="accordion-body">{children}</div>}
    </div>
  );
}

function ParentPicker({ value, onChange }: { value: ParentIdx | null; onChange: (idx: ParentIdx) => void }) {
  const { state } = usePlan();
  return (
    <div className="role-select">
      {([0, 1] as ParentIdx[]).map((idx) => {
        const active = value === idx;
        return (
          <button
            key={idx}
            type="button"
            className={`role-chip ${active ? "active" : ""}`}
            style={active ? { background: parentColorHex(state, idx), color: "#fff", borderColor: parentColorHex(state, idx) } : undefined}
            onClick={() => onChange(idx)}
          >
            {parentDisplayName(state, idx)}
          </button>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------
// Sections
// ------------------------------------------------------------
function CaseInfoSection() {
  const { state, actions } = usePlan();
  return (
    <>
      <p className="section-sub">Optional — fill in once the case is filed. You can leave this blank for now.</p>
      <div className="field">
        <label>County</label>
        <input type="text" value={state.planDetails.county} placeholder="e.g. King"
          onChange={(e) => actions.setCaseInfo({ county: e.target.value })} />
      </div>
      <div className="field">
        <label>Cause number</label>
        <input type="text" value={state.planDetails.causeNumber} placeholder="e.g. 26-3-01234-5"
          onChange={(e) => actions.setCaseInfo({ causeNumber: e.target.value })} />
      </div>
    </>
  );
}

function ChildrenAgesSection() {
  const { state, actions } = usePlan();
  return (
    <>
      <p className="section-sub">The form asks for each child's current age.</p>
      {state.kids.map((kid) => (
        <div className="field" key={kid.id}>
          <label>{kid.name.trim() || "Unnamed child"}'s age</label>
          <input type="number" min={0} max={25} value={kid.age}
            onChange={(e) => actions.updateKidAge(kid.id, e.target.value)} style={{ maxWidth: 120 }} />
        </div>
      ))}
    </>
  );
}

function LimitationsSection() {
  const { state, actions } = usePlan();
  const val = state.planDetails.hasLimitations;
  return (
    <>
      <p className="section-sub">
        Under RCW 26.09.191/.192, a parenting plan must disclose abandonment, abuse, domestic violence,
        assault, or other problems that could limit a parent's time or decision-making.
      </p>
      <button type="button" className={`quiz-option ${val === false ? "selected" : ""}`}
        style={val === false ? { borderColor: "var(--accent)", background: "var(--accent-soft)" } : undefined}
        onClick={() => actions.setHasLimitations(false)}>
        No — neither parent has any of these issues
      </button>
      <button type="button" className={`quiz-option ${val === true ? "selected" : ""}`}
        style={val === true ? { borderColor: "var(--accent)", background: "var(--accent-soft)" } : undefined}
        onClick={() => actions.setHasLimitations(true)}>
        Yes — one or more of these applies
      </button>
      {val === true && (
        <>
          <div className="warning-box">
            This tool doesn't cover Attachments A/B/C (limitations, sex-offense findings, supervised
            visitation rules) — that's high-stakes legal territory. Work with your attorney directly on
            those sections; the generated document will flag that they're needed.
          </div>
          <div className="field">
            <label>Describe the concerns, for your attorney's review</label>
            <textarea
              placeholder="What happened, when, and why you believe it should limit the other parent's time or decision-making..."
              value={state.planDetails.limitationsExplanation}
              onChange={(e) => actions.setLimitationsExplanation(e.target.value)}
            />
          </div>
        </>
      )}
    </>
  );
}

function CustodianSection() {
  const { state, actions } = usePlan();
  return (
    <>
      <p className="section-sub">
        Washington law generally uses parenting time, not "custody," but some state and federal forms
        still require naming one parent as custodian. This doesn't change either parent's rights under
        this plan.
      </p>
      <ParentPicker value={state.planDetails.custodianParentIdx} onChange={(idx) => actions.setCustodian(idx)} />
    </>
  );
}

function DecisionMakingSection() {
  const { state, actions } = usePlan();
  const { decisionCategories } = state.planDetails;
  return (
    <>
      <p className="section-sub">Who makes major (non-emergency) decisions in each area?</p>
      {decisionCategories.map((cat) => (
        <div className="decision-row" key={cat.id}>
          <div className="decision-row-head">
            {cat.isFixed ? (
              <span className="decision-row-label">{cat.label}</span>
            ) : (
              <input type="text" placeholder="e.g. Extracurricular activities" value={cat.label}
                onChange={(e) => actions.updateDecisionCategory(cat.id, { label: e.target.value })} />
            )}
            {!cat.isFixed && (
              <button type="button" className="kid-remove" aria-label="Remove"
                onClick={() => actions.removeDecisionCategory(cat.id)}>&times;</button>
            )}
          </div>
          <div className="role-select">
            <button type="button" className={`role-chip ${cat.mode === "joint" ? "active" : ""}`}
              onClick={() => actions.updateDecisionCategory(cat.id, { mode: "joint", limitedParent: null })}>
              Joint
            </button>
            <button type="button" className={`role-chip ${cat.mode === "limited" ? "active" : ""}`}
              onClick={() => actions.updateDecisionCategory(cat.id, { mode: "limited" })}>
              One parent decides
            </button>
          </div>
          {cat.mode === "limited" && (
            <ParentPicker value={cat.limitedParent}
              onChange={(idx) => actions.updateDecisionCategory(cat.id, { limitedParent: idx })} />
          )}
        </div>
      ))}
      {decisionCategories.length < MAX_DECISION_CATEGORIES && (
        <button type="button" className="add-kid-btn" onClick={() => actions.addDecisionCategory()}>
          + Add another decision category
        </button>
      )}
    </>
  );
}

function DisputeResolutionSection() {
  const { state, actions } = usePlan();
  const d = state.planDetails.disputeResolution;
  const providerTypes: { id: DisputeProviderType; label: string }[] = [
    { id: "mediation", label: "Mediation" },
    { id: "arbitration", label: "Arbitration" },
    { id: "counseling", label: "Counseling" },
  ];
  return (
    <>
      <p className="section-sub">How will you resolve disagreements about shared decisions or what the plan means?</p>
      <div className="role-select">
        <button type="button" className={`role-chip ${d.method === "provider" ? "active" : ""}`}
          onClick={() => actions.setDisputeResolution({ method: "provider" })}>
          Use a provider first
        </button>
        <button type="button" className={`role-chip ${d.method === "court" ? "active" : ""}`}
          onClick={() => actions.setDisputeResolution({ method: "court" })}>
          Go straight to court
        </button>
      </div>

      {d.method === "provider" && (
        <>
          <div className="role-select">
            {providerTypes.map((pt) => (
              <button key={pt.id} type="button" className={`role-chip ${d.providerType === pt.id ? "active" : ""}`}
                onClick={() => actions.setDisputeResolution({ providerType: pt.id })}>
                {pt.label}
              </button>
            ))}
          </div>
          <div className="field">
            <label>Provider or agency name (optional — can be decided later)</label>
            <input type="text" value={d.providerName}
              onChange={(e) => actions.setDisputeResolution({ providerName: e.target.value })} />
          </div>
          <div className="field">
            <label>Notice method</label>
            <div className="role-select">
              <button type="button" className={`role-chip ${d.noticeMethod === "certified-mail" ? "active" : ""}`}
                onClick={() => actions.setDisputeResolution({ noticeMethod: "certified-mail" })}>
                Certified mail
              </button>
              <button type="button" className={`role-chip ${d.noticeMethod === "other" ? "active" : ""}`}
                onClick={() => actions.setDisputeResolution({ noticeMethod: "other" })}>
                Other
              </button>
            </div>
            {d.noticeMethod === "other" && (
              <input type="text" placeholder="Specify" value={d.noticeOther} className="mt-8"
                onChange={(e) => actions.setDisputeResolution({ noticeOther: e.target.value })} />
            )}
          </div>
          <div className="field">
            <label>Who pays for it?</label>
            <div className="role-select">
              <button type="button" className={`role-chip ${d.costSplit === "fixed-percent" ? "active" : ""}`}
                onClick={() => actions.setDisputeResolution({ costSplit: "fixed-percent" })}>
                Fixed split
              </button>
              <button type="button" className={`role-chip ${d.costSplit === "income-based" ? "active" : ""}`}
                onClick={() => actions.setDisputeResolution({ costSplit: "income-based" })}>
                By income share
              </button>
              <button type="button" className={`role-chip ${d.costSplit === "dispute-decided" ? "active" : ""}`}
                onClick={() => actions.setDisputeResolution({ costSplit: "dispute-decided" })}>
                Decided later
              </button>
            </div>
            {d.costSplit === "fixed-percent" && (
              <div className="flex-row mt-8">
                <span className="text-muted" style={{ fontSize: "0.85rem" }}>{parentDisplayName(state, 0)}</span>
                <input type="number" min={0} max={100} value={d.costPercent[0]} style={{ width: 70 }}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    actions.setDisputeResolution({ costPercent: [v, 100 - v] });
                  }} />
                <span className="text-muted" style={{ fontSize: "0.85rem" }}>% / {parentDisplayName(state, 1)}</span>
                <span>{d.costPercent[1]}%</span>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

function TransportationSection() {
  const { state, actions } = usePlan();
  const t = state.planDetails.transportation;
  const locations: { id: ExchangeLocation; label: string }[] = [
    { id: "each-home", label: "Each parent's home" },
    { id: "school-daycare", label: "School or daycare" },
    { id: "other", label: "Other location" },
  ];
  return (
    <>
      <div className="field">
        <label>Where will exchanges happen?</label>
        <div className="role-select">
          {locations.map((loc) => (
            <button key={loc.id} type="button" className={`role-chip ${t.location === loc.id ? "active" : ""}`}
              onClick={() => actions.setTransportation({ location: loc.id })}>
              {loc.label}
            </button>
          ))}
        </div>
        {t.location === "other" && (
          <input type="text" placeholder="Specify location" value={t.locationOther} className="mt-8"
            onChange={(e) => actions.setTransportation({ locationOther: e.target.value })} />
        )}
      </div>
      <div className="field">
        <label>Who arranges transportation?</label>
        <div className="role-select">
          <button type="button" className={`role-chip ${t.responsible === "picking-up" ? "active" : ""}`}
            onClick={() => actions.setTransportation({ responsible: "picking-up" })}>
            The picking-up parent
          </button>
          <button type="button" className={`role-chip ${t.responsible === "dropping-off" ? "active" : ""}`}
            onClick={() => actions.setTransportation({ responsible: "dropping-off" })}>
            The dropping-off parent
          </button>
        </div>
      </div>
      <div className="field">
        <label>Other details (optional)</label>
        <textarea value={t.otherDetails} onChange={(e) => actions.setTransportation({ otherDetails: e.target.value })} />
      </div>
    </>
  );
}

function ProvisionTopic({ category, activeCategory, onToggle }: {
  category: string; activeCategory: string | null; onToggle: (cat: string) => void;
}) {
  const { state, actions } = usePlan();
  const selected = state.planDetails.selectedProvisions;
  const items = getProvisionsByCategory(category);
  const selectedCount = items.filter((p) => selected.includes(p.id)).length;
  const isOpen = activeCategory === category;

  return (
    <div className="provision-topic">
      <button type="button" className="provision-topic-header" onClick={() => onToggle(category)}>
        <span className="provision-topic-name">{category}</span>
        <span className="provision-topic-count">
          {selectedCount > 0 ? `${selectedCount} selected` : `${items.length} option${items.length === 1 ? "" : "s"}`}
        </span>
        <span className={`accordion-chevron ${isOpen ? "open" : ""}`}>&#9656;</span>
      </button>
      {isOpen && (
        <div className="provision-topic-body">
          {items.map((p) => (
            <label className="provision-item" key={p.id}>
              <input type="checkbox" checked={selected.includes(p.id)} onChange={() => actions.toggleProvision(p.id)} />
              <span>
                <span className="provision-title">{p.label}</span>
                <span className="provision-text">{p.text}</span>
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function OtherSection() {
  const { state, actions } = usePlan();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const categories = getProvisionCategories();

  return (
    <>
      <p className="section-sub">Common standard provisions, organized by topic — click a topic to see and select options. More topics will be added over time.</p>
      <div className="provision-topics">
        {categories.map((cat) => (
          <ProvisionTopic
            key={cat}
            category={cat}
            activeCategory={activeCategory}
            onToggle={(c) => setActiveCategory((prev) => (prev === c ? null : c))}
          />
        ))}
      </div>
      <div className="field">
        <label>Anything else important to this family's plan?</label>
        <textarea value={state.planDetails.otherProvisions}
          onChange={(e) => actions.setOtherProvisions(e.target.value)} />
      </div>
    </>
  );
}

// ------------------------------------------------------------
// Main tool
// ------------------------------------------------------------
const SECTIONS = [
  { id: "case", title: "Case Information", Component: CaseInfoSection, done: () => true },
  { id: "children", title: "Children's Ages", Component: ChildrenAgesSection, done: isChildrenAgesComplete },
  { id: "limitations", title: "Limitations Check", Component: LimitationsSection, done: isLimitationsComplete },
  { id: "custodian", title: "Custodian", Component: CustodianSection, done: isCustodianComplete },
  { id: "decisions", title: "Decision-Making", Component: DecisionMakingSection, done: isDecisionMakingComplete },
  { id: "dispute", title: "Dispute Resolution", Component: DisputeResolutionSection, done: isDisputeResolutionComplete },
  { id: "transport", title: "Transportation", Component: TransportationSection, done: isTransportationComplete },
  { id: "other", title: "Other Provisions", Component: OtherSection, done: () => true },
];

export function PlanDetailsTool() {
  const { state } = usePlan();
  const firstIncomplete = SECTIONS.find((s) => !s.done(state))?.id ?? SECTIONS[0].id;
  const [openIds, setOpenIds] = useState<Set<string>>(new Set([firstIncomplete]));
  const [view, setView] = useState<"checklist" | "preview">("checklist");

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const doneCount = SECTIONS.filter((s) => s.done(state)).length;

  return (
    <>
      <div>
        <h2 className="section-heading">Finish the Parenting Plan</h2>
        <p className="section-sub">
          Click through each section to fill in the remaining pieces of the Washington State Parenting Plan
          (FL All Family 140). {doneCount} of {SECTIONS.length} sections done.
        </p>
      </div>
      <div className="tool-tabs">
        <button type="button" className={`tool-tab ${view === "checklist" ? "active" : ""}`} onClick={() => setView("checklist")}>
          Checklist
        </button>
        <button type="button" className={`tool-tab ${view === "preview" ? "active" : ""}`} onClick={() => setView("preview")}>
          Document Preview
        </button>
      </div>
      {view === "checklist" ? (
        <div className="accordion">
          {SECTIONS.map(({ id, title, Component, done }) => (
            <AccordionSection key={id} title={title} done={done(state)} isOpen={openIds.has(id)} onToggle={() => toggle(id)}>
              <Component />
            </AccordionSection>
          ))}
        </div>
      ) : (
        <PlanDocument />
      )}
    </>
  );
}
