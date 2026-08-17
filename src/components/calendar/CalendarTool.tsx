import { useState } from "react";
import { parentColorHex, parentDisplayName } from "../../lib/derived";
import { getAssignedParent } from "../../lib/schedule";
import { addDaysStr, getMonthMatrix, MONTH_LONG, parseDateStr, todayStr, WEEKDAY_SHORT } from "../../lib/utils";
import { usePlan } from "../../state/PlanContext";
import { DayModal } from "./DayModal";

function Legend() {
  const { state } = usePlan();
  return (
    <div className="legend">
      {[0, 1].map((idx) => (
        <div className="legend-item" key={idx}>
          <span className="dot" style={{ background: parentColorHex(state, idx as 0 | 1) }} />
          {parentDisplayName(state, idx as 0 | 1)}
        </div>
      ))}
      <div className="legend-item">&#9670; Exchange</div>
      <div className="legend-item">&#9733; Holiday</div>
    </div>
  );
}

function CalendarDay({ dateStr, inMonth, onOpen }: { dateStr: string; inMonth: boolean; onOpen: (d: string) => void }) {
  const { state } = usePlan();
  const a = getAssignedParent(dateStr, state);
  const prevA = getAssignedParent(addDaysStr(dateStr, -1), state);
  const isExchange = a.parentIdx !== prevA.parentIdx;
  const isHoliday = a.source === "holiday";
  const isToday = dateStr === todayStr();
  const dayNum = parseDateStr(dateStr).getDate();
  const color = parentColorHex(state, a.parentIdx);

  return (
    <button
      type="button"
      className={`cal-day ${inMonth ? "" : "outside"} ${isToday ? "today" : ""}`}
      style={{ background: color }}
      title={dateStr}
      onClick={() => onOpen(dateStr)}
    >
      {isExchange && <span className="exchange-flag">&#9670;</span>}
      {isHoliday && <span className="holiday-star">&#9733;</span>}
      <span>{dayNum}</span>
    </button>
  );
}

export function CalendarTool() {
  const { state, actions } = usePlan();
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [y, m] = state.calendarViewMonth.split("-").map(Number);
  const days = getMonthMatrix(y, m - 1);

  return (
    <>
      <div className="cal-nav">
        <button type="button" className="icon-btn" aria-label="Previous month" onClick={() => actions.shiftCalendarMonth(-1)}>&larr;</button>
        <h2>{MONTH_LONG[m - 1]} {y}</h2>
        <button type="button" className="icon-btn" aria-label="Next month" onClick={() => actions.shiftCalendarMonth(1)}>&rarr;</button>
      </div>
      <Legend />
      <div className="cal-grid-head">
        {WEEKDAY_SHORT.map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="cal-grid">
        {days.map((d) => (
          <CalendarDay key={d.dateStr} dateStr={d.dateStr} inMonth={d.inMonth} onOpen={setOpenDate} />
        ))}
      </div>
      {openDate && <DayModal dateStr={openDate} onClose={() => setOpenDate(null)} />}
    </>
  );
}
