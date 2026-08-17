// ============================================================
// Intake screen: parents, kids, hand-off into the builder
// ============================================================

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function renderColorSwatches(idx, currentColor) {
  return `<div class="color-swatches">${PARENT_COLORS.map((c) => `
    <button type="button" class="swatch ${c.id === currentColor ? "active" : ""}"
      style="background:${c.hex}" data-action="set-parent-color" data-idx="${idx}" data-color="${c.id}"
      aria-label="${c.id}"></button>
  `).join("")}</div>`;
}

function renderRoleChips(idx, currentRole) {
  const roles = [{ id: "", label: "None" }, { id: "mother", label: "Mother" }, { id: "father", label: "Father" }];
  return `<div class="role-select">${roles.map((r) => `
    <button type="button" class="role-chip ${r.id === (currentRole || "") ? "active" : ""}"
      data-action="set-parent-role" data-idx="${idx}" data-role="${r.id}">${r.label}</button>
  `).join("")}</div>`;
}

function renderParentRow(idx) {
  const p = state.parents[idx];
  const hex = PARENT_COLORS.find((c) => c.id === p.color).hex;
  return `
    <div class="parent-row">
      <div class="parent-avatar" style="background:${hex}" data-avatar="${idx}">${initials(p.name)}</div>
      <div class="parent-fields">
        <input type="text" placeholder="Parent ${idx === 0 ? "A" : "B"} name" value="${escapeHtml(p.name)}"
          data-field="parentName:${idx}" maxlength="40" />
        ${renderColorSwatches(idx, p.color)}
        <div class="field">
          <label>Role (used for Mother's / Father's Day defaults — optional)</label>
          ${renderRoleChips(idx, p.role)}
        </div>
      </div>
    </div>`;
}

function renderKidChip(kid) {
  return `
    <div class="kid-chip">
      <input type="text" placeholder="Child's name" value="${escapeHtml(kid.name)}" data-field="kidName:${kid.id}" maxlength="40" />
      ${state.kids.length > 1 ? `<button type="button" class="kid-remove" data-action="remove-kid" data-id="${kid.id}" aria-label="Remove">&times;</button>` : ""}
    </div>`;
}

function renderIntakeScreen() {
  return `
    <div class="card">
      <div class="section-title">Parents</div>
      ${renderParentRow(0)}
      ${renderParentRow(1)}
    </div>
    <div class="card">
      <div class="section-title">Children</div>
      ${state.kids.map(renderKidChip).join("")}
      <button type="button" class="add-kid-btn mt-8" data-action="add-kid">+ Add another child</button>
    </div>
    <p class="section-sub">Names and colors are used throughout the calendar, summary, and holiday schedule so the plan stays easy to read at a glance.</p>
  `;
}
