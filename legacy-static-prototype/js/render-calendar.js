// ============================================================
// Calendar tool: month grid with parent-colored days
// ============================================================

function renderLegend() {
  return `
    <div class="legend">
      ${[0, 1].map((idx) => `
        <div class="legend-item"><span class="dot" style="background:${parentColorHex(idx)}"></span>${parentDisplayName(idx)}</div>
      `).join("")}
      <div class="legend-item">&#9670; Exchange</div>
      <div class="legend-item">&#9733; Holiday</div>
    </div>`;
}

function renderCalendarDay(dateStr, inMonth) {
  const a = getAssignedParent(dateStr, state);
  const prevA = getAssignedParent(addDaysStr(dateStr, -1), state);
  const isExchange = a.parentIdx !== prevA.parentIdx;
  const isHoliday = a.source === "holiday";
  const isToday = dateStr === todayStr();
  const dayNum = parseDateStr(dateStr).getDate();
  const color = parentColorHex(a.parentIdx);
  return `
    <button type="button" class="cal-day ${inMonth ? "" : "outside"} ${isToday ? "today" : ""}"
      style="background:${color}" data-action="open-day" data-date="${dateStr}" title="${formatDisplayDate(dateStr)}">
      ${isExchange ? `<span class="exchange-flag">&#9670;</span>` : ""}
      ${isHoliday ? `<span class="holiday-star">&#9733;</span>` : ""}
      <span>${dayNum}</span>
    </button>`;
}

function renderCalendarTool() {
  const [y, m] = state.calendarViewMonth.split("-").map(Number);
  const days = getMonthMatrix(y, m - 1);
  return `
    <div class="cal-nav">
      <button type="button" class="icon-btn" data-action="cal-prev" aria-label="Previous month">&larr;</button>
      <h2>${MONTH_LONG[m - 1]} ${y}</h2>
      <button type="button" class="icon-btn" data-action="cal-next" aria-label="Next month">&rarr;</button>
    </div>
    ${renderLegend()}
    <div class="cal-grid-head">${WEEKDAY_SHORT.map((d) => `<span>${d}</span>`).join("")}</div>
    <div class="cal-grid">${days.map((d) => renderCalendarDay(d.dateStr, d.inMonth)).join("")}</div>
  `;
}

// ---- Day detail modal ----------------------------------------------------
function renderDayModal(dateStr) {
  const a = getAssignedParent(dateStr, state);
  const isManual = state.overrides[dateStr] != null;
  return `
    <div class="modal-head">
      <h3>${formatDisplayDate(dateStr)}</h3>
      <button type="button" class="icon-btn" data-action="close-modal" aria-label="Close">&times;</button>
    </div>
    ${a.source === "holiday" ? `<div class="pill" style="background:${"var(--accent-soft)"}">&#9733; ${escapeHtml(a.holiday.def.name)}</div>` : ""}
    <div class="section-title">Overnight parent</div>
    <div class="assign-options">
      ${[0, 1].map((idx) => `
        <button type="button" class="assign-option ${a.parentIdx === idx ? "selected" : ""}" data-action="set-day-parent" data-date="${dateStr}" data-idx="${idx}">
          <span class="dot" style="background:${parentColorHex(idx)}"></span>${parentDisplayName(idx)}
        </button>`).join("")}
    </div>
    ${isManual ? `<button type="button" class="btn btn-ghost btn-sm" data-action="clear-day-override" data-date="${dateStr}">Reset to schedule default</button>` : ""}
    <p class="section-sub">Changing this day only affects ${formatShortDate(dateStr)}. The regular rotation resumes the next day unless you adjust it too.</p>
  `;
}
