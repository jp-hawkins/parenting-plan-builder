// ============================================================
// Holidays tool: default alternating assignment + per-year overrides
// ============================================================

function formatHolidayRangeLabel(range) {
  if (!range) return "Date not set";
  if (range.start === range.end) return formatDisplayDate(range.start, { weekday: false });
  return `${formatShortDate(range.start)} – ${formatDisplayDate(range.end, { weekday: false })}`;
}

function renderHolidayItem(def) {
  const year = state.holidayYear;
  const range = computeHolidayRange(def, year, state);
  const overrideKey = `${def.id}-${year}`;
  const isManualType = def.rule.type === "manual";
  const isEditing = state.editingHolidayKey === overrideKey;

  if (isManualType && (!range || isEditing)) {
    const existing = state.holidayCustomDates[overrideKey] || {};
    return `
      <div class="holiday-item" style="flex-direction:column;align-items:stretch">
        <div class="holiday-info"><span class="holiday-name">${def.name}</span><span class="holiday-date">${range ? "Editing dates" : `No dates set for ${year}`}</span></div>
        <div class="flex-row mt-8">
          <div class="field" style="flex:1"><label>Start</label><input type="date" value="${existing.start || ""}" data-action-change="set-holiday-custom-start" data-key="${overrideKey}" /></div>
          <div class="field" style="flex:1"><label>End</label><input type="date" value="${existing.end || ""}" data-action-change="set-holiday-custom-end" data-key="${overrideKey}" /></div>
        </div>
      </div>`;
  }

  const overrideParent = state.holidayOverrides[overrideKey];
  const parentIdx = overrideParent != null ? overrideParent : computeDefaultHolidayParent(def, year, state);

  return `
    <div class="holiday-item">
      <div class="holiday-info">
        <span class="holiday-name">${def.name}</span>
        <span class="holiday-date">${formatHolidayRangeLabel(range)}${overrideParent == null ? " · alternates yearly" : " · overridden"}</span>
        ${isManualType ? `<button type="button" class="btn btn-ghost btn-sm" style="padding:2px 0;justify-content:flex-start" data-action="edit-holiday-dates" data-key="${overrideKey}">Edit dates</button>` : ""}
      </div>
      <div class="holiday-assign">
        ${[0, 1].map((idx) => `
          <button type="button" class="assign-btn ${parentIdx === idx ? "active" : ""}" style="background:${parentColorHex(idx)}"
            data-action="set-holiday-parent" data-key="${overrideKey}" data-idx="${idx}"
            title="Assign to ${parentDisplayName(idx)}">${initials(parentDisplayName(idx))[0]}</button>
        `).join("")}
        ${overrideParent != null ? `<button type="button" class="icon-btn" data-action="clear-holiday-override" data-key="${overrideKey}" title="Reset to alternating">&#8635;</button>` : ""}
      </div>
    </div>`;
}

function renderHolidaysTool() {
  return `
    <div class="year-select-row">
      <button type="button" class="icon-btn" data-action="holiday-prev-year" aria-label="Previous year">&larr;</button>
      <h2 class="spacer" style="text-align:center">${state.holidayYear}</h2>
      <button type="button" class="icon-btn" data-action="holiday-next-year" aria-label="Next year">&rarr;</button>
    </div>
    <p class="section-sub">Holidays default to alternating between parents each year. Tap a color to override a specific year — it won't affect other years.</p>
    <div>${HOLIDAY_DEFS.map(renderHolidayItem).join("")}</div>
  `;
}
