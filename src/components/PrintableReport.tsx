import type { CSSProperties } from "react";
import { parentColorHex, parentDisplayName } from "../lib/derived";
import { computeSummary, getAssignedParent } from "../lib/schedule";
import { getMonthMatrix, MONTH_LONG, WEEKDAY_SHORT } from "../lib/utils";
import { usePlan } from "../state/PlanContext";
import { PlanDocument } from "./plandetails/PlanDocument";

const HOLIDAY_BORDER = "#b8860b";

function MiniMonth({ year, monthIndex }: { year: number; monthIndex: number }) {
  const { state } = usePlan();
  const days = getMonthMatrix(year, monthIndex);
  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 6, padding: 6 }}>
      <div style={{ fontWeight: 700, fontSize: "0.72rem", textAlign: "center", marginBottom: 4 }}>
        {MONTH_LONG[monthIndex]}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
        {WEEKDAY_SHORT.map((d) => (
          <div key={d} style={{ fontSize: "0.55rem", textAlign: "center", color: "#777" }}>{d[0]}</div>
        ))}
        {days.map((d) => {
          const a = getAssignedParent(d.dateStr, state);
          const isHoliday = a.source === "holiday";
          const dayNum = Number(d.dateStr.slice(-2));
          return (
            <div key={d.dateStr} style={{
              fontSize: "0.55rem",
              textAlign: "center",
              padding: "2px 0",
              borderRadius: 3,
              color: "#fff",
              background: parentColorHex(state, a.parentIdx),
              border: isHoliday ? `2px solid ${HOLIDAY_BORDER}` : "2px solid transparent",
              boxSizing: "border-box",
              opacity: d.inMonth ? 1 : 0.25,
            }}>
              {dayNum}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FullMonth({ year, monthIndex }: { year: number; monthIndex: number }) {
  const { state } = usePlan();
  const days = getMonthMatrix(year, monthIndex);
  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 14, flex: 1 }}>
      <div style={{ fontWeight: 700, fontSize: "1.05rem", textAlign: "center", marginBottom: 10 }}>
        {MONTH_LONG[monthIndex]} {year}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {WEEKDAY_SHORT.map((d) => (
          <div key={d} style={{ fontSize: "0.7rem", fontWeight: 700, textAlign: "center", color: "#777" }}>{d}</div>
        ))}
        {days.map((d) => {
          const a = getAssignedParent(d.dateStr, state);
          const isHoliday = a.source === "holiday";
          const dayNum = Number(d.dateStr.slice(-2));
          return (
            <div key={d.dateStr} style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              textAlign: "center",
              padding: "9px 0",
              borderRadius: 5,
              color: "#fff",
              background: parentColorHex(state, a.parentIdx),
              border: isHoliday ? `2px solid ${HOLIDAY_BORDER}` : "2px solid transparent",
              boxSizing: "border-box",
              opacity: d.inMonth ? 1 : 0.3,
            }}>
              {dayNum}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarLegend() {
  const { state } = usePlan();
  const dotStyle = (color: string): CSSProperties => ({
    width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block", flex: "none",
  });
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8, fontSize: "0.78rem", alignItems: "center" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={dotStyle(parentColorHex(state, 0))} /> {parentDisplayName(state, 0)}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={dotStyle(parentColorHex(state, 1))} /> {parentDisplayName(state, 1)}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ width: 10, height: 10, borderRadius: 3, border: `2px solid ${HOLIDAY_BORDER}`, display: "inline-block", flex: "none" }} />
        Holiday
      </span>
    </div>
  );
}

function FullCalendarPages({ year }: { year: number }) {
  const months = Array.from({ length: 12 }, (_, i) => i);
  const groups: number[][] = [];
  for (let i = 0; i < 12; i += 4) groups.push(months.slice(i, i + 4));
  return (
    <>
      {groups.map((group, i) => (
        <div key={i} className={i > 0 ? "print-page-break" : ""}>
          {i > 0 && <div style={{ height: 4 }} />}
          <CalendarLegend />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 8 }}>
            {group.map((m) => <FullMonth key={m} year={year} monthIndex={m} />)}
          </div>
        </div>
      ))}
    </>
  );
}

function PrintSummary() {
  const { state } = usePlan();
  const year = state.summaryYear;
  const s = computeSummary(state, `${year}-01-01`, `${year}-12-31`);
  return (
    <table>
      <thead><tr><th></th><th>{parentDisplayName(state, 0)}</th><th>{parentDisplayName(state, 1)}</th></tr></thead>
      <tbody>
        <tr><td>Overnights ({year})</td><td>{s.nights[0]} ({Math.round(s.pct[0])}%)</td><td>{s.nights[1]} ({Math.round(s.pct[1])}%)</td></tr>
        <tr><td>Weekend nights</td><td>{s.weekendNights[0]}</td><td>{s.weekendNights[1]}</td></tr>
        <tr><td>Holiday nights</td><td>{s.holidayNights[0]}</td><td>{s.holidayNights[1]}</td></tr>
        <tr><td>Longest stretch</td><td colSpan={2}>{Math.max(s.longestRun[0], s.longestRun[1])} consecutive nights</td></tr>
        <tr><td>Exchanges per year</td><td colSpan={2}>{s.exchanges}</td></tr>
      </tbody>
    </table>
  );
}

export function PrintableReport() {
  const { state } = usePlan();
  const months = Array.from({ length: 12 }, (_, i) => i);
  const isFull = state.printCalendarStyle === "full";

  return (
    <div className="printable-report">
      <div className="plan-doc">
        <h2>{parentDisplayName(state, 0)} &amp; {parentDisplayName(state, 1)}</h2>
        <div className="doc-subtitle">Parenting Plan Summary — {state.summaryYear}</div>

        {!isFull && (
          <div className="doc-section">
            <div className="doc-section-title">Residential Calendar — {state.summaryYear}</div>
            <CalendarLegend />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {months.map((m) => <MiniMonth key={m} year={state.summaryYear} monthIndex={m} />)}
            </div>
          </div>
        )}

        <div className="doc-section">
          <div className="doc-section-title">Summary</div>
          <PrintSummary />
        </div>
      </div>

      <PlanDocument />

      {isFull && (
        <div className="plan-doc print-page-break">
          <div className="doc-section-title">Residential Calendar — {state.summaryYear}</div>
          <FullCalendarPages year={state.summaryYear} />
        </div>
      )}
    </div>
  );
}
