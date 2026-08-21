import { parentColorHex, parentDisplayName } from "../lib/derived";
import { computeSummary } from "../lib/schedule";
import { usePlan } from "../state/PlanContext";

function SplitBar({ pct }: { pct: [number, number] }) {
  const { state } = usePlan();
  return (
    <div className="split-summary">
      <div className="split-summary-seg" style={{ width: `${pct[0]}%`, background: parentColorHex(state, 0) }}>
        {pct[0] ? `${Math.round(pct[0])}%` : ""}
      </div>
      <div className="split-summary-seg" style={{ width: `${pct[1]}%`, background: parentColorHex(state, 1) }}>
        {pct[1] ? `${Math.round(pct[1])}%` : ""}
      </div>
    </div>
  );
}

function BarRow({ label, valueA, valueB }: { label: string; valueA: number; valueB: number }) {
  const { state } = usePlan();
  const total = valueA + valueB || 1;
  const pctA = (valueA / total) * 100;
  const pctB = (valueB / total) * 100;
  return (
    <div className="bar-row">
      <div className="bar-row-head"><span>{label}</span><span className="text-muted">{valueA} / {valueB}</span></div>
      <div className="bar-track">
        <div className="bar-seg" style={{ width: `${pctA}%`, background: parentColorHex(state, 0) }} />
        <div className="bar-seg" style={{ width: `${pctB}%`, background: parentColorHex(state, 1) }} />
      </div>
    </div>
  );
}

export function SummaryTool() {
  const { state, actions } = usePlan();
  const year = state.summaryYear;
  const rangeStart = `${year}-01-01`;
  const rangeEnd = `${year}-12-31`;
  const s = computeSummary(state, rangeStart, rangeEnd);

  return (
    <>
      <div className="year-select-row">
        <button type="button" className="icon-btn" aria-label="Previous year" onClick={() => actions.setSummaryYear(year - 1)}>&larr;</button>
        <h2 className="spacer" style={{ textAlign: "center" }}>{year} Custody Year</h2>
        <button type="button" className="icon-btn" aria-label="Next year" onClick={() => actions.setSummaryYear(year + 1)}>&rarr;</button>
      </div>

      <div className="card">
        <div className="section-title">Overnight split</div>
        <SplitBar pct={s.pct} />
        <div className="flex-row mt-8" style={{ justifyContent: "space-between" }}>
          <div className="legend-item"><span className="dot" style={{ background: parentColorHex(state, 0) }} />{parentDisplayName(state, 0)}: {s.nights[0]} nights</div>
          <div className="legend-item"><span className="dot" style={{ background: parentColorHex(state, 1) }} />{parentDisplayName(state, 1)}: {s.nights[1]} nights</div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total nights</div>
          <div className="stat-value">{s.total}</div>
          <div className="stat-sub">in {year}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Exchanges</div>
          <div className="stat-value">{s.exchanges}</div>
          <div className="stat-sub">handoffs this year</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Longest stretch</div>
          <div className="stat-value">{Math.max(s.longestRun[0], s.longestRun[1])}</div>
          <div className="stat-sub">consecutive nights</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg. stretch</div>
          <div className="stat-value">{(((s.avgRun[0] + s.avgRun[1]) / 2) || 0).toFixed(1)}</div>
          <div className="stat-sub">nights per turn</div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Weekend nights (Fri–Sun)</div>
        <BarRow label="Weekend nights" valueA={s.weekendNights[0]} valueB={s.weekendNights[1]} />
      </div>

      <div className="card">
        <div className="section-title">Holiday nights</div>
        <BarRow label="Holiday nights" valueA={s.holidayNights[0]} valueB={s.holidayNights[1]} />
      </div>

      <div className="card">
        <div className="section-title">Printout calendar</div>
        <p className="section-sub">Choose how the calendar looks in the exported PDF.</p>
        <div className="role-select mt-8">
          <button type="button" className={`role-chip ${state.printCalendarStyle === "compact" ? "active" : ""}`}
            onClick={() => actions.setPrintCalendarStyle("compact")}>
            Compact (fits with summary)
          </button>
          <button type="button" className={`role-chip ${state.printCalendarStyle === "full" ? "active" : ""}`}
            onClick={() => actions.setPrintCalendarStyle("full")}>
            Full size (2 months/page)
          </button>
        </div>
      </div>
    </>
  );
}
