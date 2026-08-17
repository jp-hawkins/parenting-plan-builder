import { GUIDED_QUESTIONS, TEMPLATES } from "../lib/data";
import { parentColorHex, parentDisplayName } from "../lib/derived";
import type { ParentIdx, ScheduleTemplate } from "../lib/types";
import { usePlan } from "../state/PlanContext";

function PatternPreview({ template, startParent }: { template: ScheduleTemplate; startParent: ParentIdx }) {
  const { state } = usePlan();
  return (
    <div className="pattern-preview">
      {template.pattern.map((slot, i) => {
        const parentIdx = (slot === 0 ? startParent : 1 - startParent) as ParentIdx;
        return <span key={i} className="pattern-cell" style={{ background: parentColorHex(state, parentIdx) }} />;
      })}
    </div>
  );
}

function TemplateCard({ t }: { t: ScheduleTemplate }) {
  const { state, actions } = usePlan();
  const selected = state.template.id === t.id;
  return (
    <button
      type="button"
      className={`template-card ${selected ? "selected" : ""}`}
      onClick={() => actions.selectTemplate(t.id)}
    >
      <div className="template-card-head">
        <h3>{t.name}</h3>
        <span className="template-badge">{t.exchangesPerYear} exch/yr</span>
      </div>
      <p><strong>{t.tagline}.</strong> {t.description}</p>
      <PatternPreview template={t} startParent={state.template.startParent} />
    </button>
  );
}

function GuidedQuiz() {
  const { state, actions } = usePlan();
  const q = GUIDED_QUESTIONS[state.guidedQuestionId];
  return (
    <div className="card">
      <div className="flex-row">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => actions.exitGuided()}>
          &larr; Back to list
        </button>
      </div>
      <h2 className="section-heading mt-8">{q.text}</h2>
      <div className="mt-8">
        {q.options.map((opt, i) => (
          <button key={i} type="button" className="quiz-option" onClick={() => actions.answerGuided(opt)}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TemplateConfig() {
  const { state, actions } = usePlan();
  if (!state.template.id) return null;
  const t = TEMPLATES.find((x) => x.id === state.template.id)!;

  return (
    <div className="card">
      <div className="section-title">Plan details</div>
      <div className="field">
        <label>Schedule start date</label>
        <input
          type="date"
          value={state.template.startDate}
          onChange={(e) => {
            if (e.target.value) actions.setTemplateConfig({ startDate: e.target.value });
          }}
        />
      </div>
      <div className="field mt-8">
        <label>Who has the kids on the start date?</label>
        <div className="role-select">
          {([0, 1] as ParentIdx[]).map((idx) => {
            const active = state.template.startParent === idx;
            return (
              <button
                key={idx}
                type="button"
                className={`role-chip ${active ? "active" : ""}`}
                style={active ? {
                  background: parentColorHex(state, idx), color: "#fff", borderColor: parentColorHex(state, idx),
                } : undefined}
                onClick={() => actions.setTemplateConfig({ startParent: idx })}
              >
                {parentDisplayName(state, idx)}
              </button>
            );
          })}
        </div>
      </div>
      <p className="section-sub mt-8">
        {t.name} — {t.tagline.toLowerCase()}. You can fine-tune individual days later from the calendar.
      </p>
    </div>
  );
}

export function BuilderScreen() {
  const { state, actions } = usePlan();

  if (state.guidedActive) return <GuidedQuiz />;

  return (
    <>
      <div>
        <h2 className="section-heading">Choose a residential schedule</h2>
        <p className="section-sub">Pick a starting rotation — every day can still be adjusted later from the calendar.</p>
      </div>
      <button type="button" className="guided-link" onClick={() => actions.startGuided()}>
        Not sure which to pick? Take a 30-second quiz &rarr;
      </button>
      <div className="template-grid">
        {TEMPLATES.map((t) => <TemplateCard key={t.id} t={t} />)}
      </div>
      <TemplateConfig />
    </>
  );
}
