// ============================================================
// Schedule builder screen: template picker, guided quiz, config
// ============================================================

function renderPatternPreview(template, startParent) {
  return `<div class="pattern-preview">${template.pattern.map((slot) => {
    const parentIdx = slot === 0 ? startParent : 1 - startParent;
    return `<span class="pattern-cell" style="background:${parentColorHex(parentIdx)}"></span>`;
  }).join("")}</div>`;
}

function renderTemplateCard(t) {
  const selected = state.template.id === t.id;
  return `
    <button type="button" class="template-card ${selected ? "selected" : ""}" data-action="select-template" data-id="${t.id}">
      <div class="template-card-head">
        <h3>${t.name}</h3>
        <span class="template-badge">${t.exchangesPerYear} exch/yr</span>
      </div>
      <p><strong>${t.tagline}.</strong> ${t.description}</p>
      ${renderPatternPreview(t, state.template.startParent || 0)}
    </button>`;
}

function renderGuidedQuiz() {
  const q = GUIDED_QUESTIONS[state.guidedQuestionId];
  return `
    <div class="card">
      <div class="flex-row">
        <button type="button" class="btn btn-ghost btn-sm" data-action="exit-guided">&larr; Back to list</button>
      </div>
      <h2 class="section-heading mt-8">${q.text}</h2>
      <div class="mt-8">
        ${q.options.map((opt, i) => `
          <button type="button" class="quiz-option" data-action="answer-guided" data-qid="${q.id}" data-oi="${i}">${opt.label}</button>
        `).join("")}
      </div>
    </div>`;
}

function renderTemplateConfig() {
  if (!state.template.id) return "";
  const t = getTemplate(state.template.id);
  return `
    <div class="card">
      <div class="section-title">Plan details</div>
      <div class="field">
        <label>Schedule start date</label>
        <input type="date" value="${state.template.startDate}" data-action-change="set-start-date" />
      </div>
      <div class="field mt-8">
        <label>Who has the kids on the start date?</label>
        <div class="role-select">
          ${[0, 1].map((idx) => `
            <button type="button" class="role-chip ${state.template.startParent === idx ? "active" : ""}"
              data-action="set-start-parent" data-idx="${idx}"
              style="${state.template.startParent === idx ? `background:${parentColorHex(idx)};color:#fff;border-color:${parentColorHex(idx)}` : ""}">
              ${parentDisplayName(idx)}
            </button>`).join("")}
        </div>
      </div>
      <p class="section-sub mt-8">${t.name} — ${t.tagline.toLowerCase()}. You can fine-tune individual days later from the calendar.</p>
    </div>`;
}

function renderBuilderScreen() {
  if (state.guidedActive) return renderGuidedQuiz();
  return `
    <div>
      <h2 class="section-heading">Choose a residential schedule</h2>
      <p class="section-sub">Pick a starting rotation — every day can still be adjusted later from the calendar.</p>
    </div>
    <button type="button" class="guided-link" data-action="start-guided">Not sure which to pick? Take a 30-second quiz &rarr;</button>
    <div class="template-grid">
      ${TEMPLATES.map(renderTemplateCard).join("")}
    </div>
    ${renderTemplateConfig()}
  `;
}
