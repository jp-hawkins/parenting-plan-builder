// ============================================================
// Summary tool: live math on overnights, weekends, exchanges
// ============================================================

function renderSplitBar(pct) {
  return `
    <div class="split-summary">
      <div class="split-summary-seg" style="width:${pct[0]}%;background:${parentColorHex(0)}">${pct[0] ? Math.round(pct[0]) + "%" : ""}</div>
      <div class="split-summary-seg" style="width:${pct[1]}%;background:${parentColorHex(1)}">${pct[1] ? Math.round(pct[1]) + "%" : ""}</div>
    </div>`;
}

function renderBarRow(label, valueA, valueB) {
  const total = valueA + valueB || 1;
  const pctA = (valueA / total) * 100;
  const pctB = (valueB / total) * 100;
  return `
    <div class="bar-row">
      <div class="bar-row-head"><span>${label}</span><span class="text-muted">${valueA} / ${valueB}</span></div>
      <div class="bar-track">
        <div class="bar-seg" style="width:${pctA}%;background:${parentColorHex(0)}"></div>
        <div class="bar-seg" style="width:${pctB}%;background:${parentColorHex(1)}"></div>
      </div>
    </div>`;
}

function renderSummaryTool() {
  const year = state.summaryYear;
  const rangeStart = `${year}-01-01`;
  const rangeEnd = `${year}-12-31`;
  const s = computeSummary(state, rangeStart, rangeEnd);

  return `
    <div class="year-select-row">
      <button type="button" class="icon-btn" data-action="summary-prev-year" aria-label="Previous year">&larr;</button>
      <h2 class="spacer" style="text-align:center">${year} Custody Year</h2>
      <button type="button" class="icon-btn" data-action="summary-next-year" aria-label="Next year">&rarr;</button>
    </div>

    <div class="card">
      <div class="section-title">Overnight split</div>
      ${renderSplitBar(s.pct)}
      <div class="flex-row mt-8" style="justify-content:space-between">
        <div class="legend-item"><span class="dot" style="background:${parentColorHex(0)}"></span>${parentDisplayName(0)}: ${s.nights[0]} nights</div>
        <div class="legend-item"><span class="dot" style="background:${parentColorHex(1)}"></span>${parentDisplayName(1)}: ${s.nights[1]} nights</div>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Total nights</div>
        <div class="stat-value">${s.total}</div>
        <div class="stat-sub">in ${year}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Exchanges</div>
        <div class="stat-value">${s.exchanges}</div>
        <div class="stat-sub">handoffs this year</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Longest stretch</div>
        <div class="stat-value">${Math.max(s.longestRun[0], s.longestRun[1])}</div>
        <div class="stat-sub">consecutive nights</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg. stretch</div>
        <div class="stat-value">${(((s.avgRun[0] + s.avgRun[1]) / 2) || 0).toFixed(1)}</div>
        <div class="stat-sub">nights per turn</div>
      </div>
    </div>

    <div class="card">
      <div class="section-title">Weekend nights (Fri–Sun)</div>
      ${renderBarRow("Weekend nights", s.weekendNights[0], s.weekendNights[1])}
    </div>

    <div class="card">
      <div class="section-title">Holiday nights</div>
      ${renderBarRow("Holiday nights", s.holidayNights[0], s.holidayNights[1])}
    </div>
  `;
}
