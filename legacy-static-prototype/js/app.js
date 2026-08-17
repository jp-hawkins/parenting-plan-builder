// ============================================================
// App entry point: layout composition + event delegation
// ============================================================

function renderTopbar() {
  let title = "Let's get started";
  if (state.screen === "builder") title = state.guidedActive ? "Quick guide" : "Build the schedule";
  if (state.screen === "tools") title = `${parentDisplayName(0)} &amp; ${parentDisplayName(1)}`;

  return `
    <div class="topbar">
      <div class="topbar-title">
        <span class="brand">Parenting Plan Builder</span>
        <h1>${title}</h1>
      </div>
      <div class="topbar-actions">
        <div class="theme-switcher">
          ${THEMES.map((t) => `<button type="button" class="theme-dot ${state.theme === t ? "active" : ""}" data-theme-opt="${t}" data-action="set-theme" data-theme-val="${t}" aria-label="${t} theme"></button>`).join("")}
        </div>
        ${state.screen !== "intake" ? `<button type="button" class="icon-btn" data-action="reset-plan" aria-label="Start over">&#8634;</button>` : ""}
      </div>
    </div>`;
}

function renderProgress() {
  if (state.screen === "tools") return "";
  const stepIdx = state.screen === "intake" ? 0 : 1;
  return `
    <div class="screen" style="padding-bottom:0;gap:10px">
      <div class="progress-steps">
        ${["Parents & kids", "Schedule", "Calendar & summary"].map((label, i) => `
          <div class="step ${i < stepIdx ? "done" : ""} ${i === stepIdx ? "active" : ""}"></div>
        `).join("")}
      </div>
    </div>`;
}

function renderBottomBar() {
  if (state.screen === "intake") {
    return `
      <div class="bottom-bar">
        <button type="button" id="continue-btn" class="btn btn-primary btn-block" data-action="goto-builder" ${isIntakeComplete() ? "" : "disabled"}>Continue</button>
      </div>`;
  }
  if (state.screen === "builder" && !state.guidedActive) {
    return `
      <div class="bottom-bar">
        <button type="button" class="btn btn-secondary" data-action="goto-intake">Back</button>
        <button type="button" id="continue-btn" class="btn btn-primary btn-block" data-action="goto-tools" ${isScheduleComplete() ? "" : "disabled"}>Continue to Calendar</button>
      </div>`;
  }
  if (state.screen === "tools") {
    return `
      <div class="bottom-bar">
        <button type="button" class="btn btn-secondary" data-action="goto-builder">Edit Setup</button>
        <button type="button" class="btn btn-primary btn-block" data-action="export-pdf">Export Plan as PDF</button>
      </div>`;
  }
  return "";
}

function renderToolsScreen() {
  const tabs = [
    { id: "calendar", label: "Calendar" },
    { id: "summary", label: "Summary" },
    { id: "holidays", label: "Holidays" },
  ];
  let body = "";
  if (state.activeTool === "calendar") body = renderCalendarTool();
  else if (state.activeTool === "summary") body = renderSummaryTool();
  else body = renderHolidaysTool();

  return `
    <div class="tool-tabs">
      ${tabs.map((t) => `<button type="button" class="tool-tab ${state.activeTool === t.id ? "active" : ""}" data-action="switch-tool" data-tool="${t.id}">${t.label}</button>`).join("")}
    </div>
    ${body}
  `;
}

function renderScreenBody() {
  if (state.screen === "intake") return renderIntakeScreen();
  if (state.screen === "builder") return renderBuilderScreen();
  return renderToolsScreen();
}

function mainRender() {
  const app = document.getElementById("app");
  app.innerHTML = `
    ${renderTopbar()}
    ${renderProgress()}
    <div class="screen">${renderScreenBody()}</div>
    ${renderBottomBar()}
  `;
}
setRenderFn(mainRender);

// ------------------------------------------------------------
// Modal
// ------------------------------------------------------------
function openDayModal(dateStr) {
  const backdrop = document.getElementById("day-modal-backdrop");
  const modal = document.getElementById("day-modal");
  modal.innerHTML = renderDayModal(dateStr);
  modal.dataset.date = dateStr;
  backdrop.classList.remove("hidden");
}
function closeDayModal() {
  document.getElementById("day-modal-backdrop").classList.add("hidden");
}

// ------------------------------------------------------------
// Toast (used for the PDF export stub)
// ------------------------------------------------------------
let toastTimer = null;
function showToast(msg) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.style.cssText = "position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:var(--text);color:var(--surface);padding:12px 18px;border-radius:12px;font-size:0.88rem;font-weight:600;z-index:200;box-shadow:0 6px 20px rgba(0,0,0,0.25);max-width:88%;text-align:center;";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = "1";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.opacity = "0"; }, 2600);
}

// ------------------------------------------------------------
// Live DOM patches for text inputs (avoid full re-render / focus loss)
// ------------------------------------------------------------
function patchContinueButton() {
  const btn = document.getElementById("continue-btn");
  if (!btn) return;
  if (state.screen === "intake") btn.disabled = !isIntakeComplete();
  if (state.screen === "builder") btn.disabled = !isScheduleComplete();
}

// ------------------------------------------------------------
// Event delegation
// ------------------------------------------------------------
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;

  switch (action) {
    case "set-theme":
      setTheme(el.dataset.themeVal);
      break;
    case "reset-plan":
      if (window.confirm("Start over? This clears the current plan from this browser.")) resetPlan();
      break;
    case "set-parent-color":
      updateParent(Number(el.dataset.idx), { color: el.dataset.color });
      break;
    case "set-parent-role": {
      const idx = Number(el.dataset.idx);
      const role = el.dataset.role;
      // roles are exclusive across the two parents
      state.parents.forEach((p, i) => { if (p.role === role && role) state.parents[i].role = ""; });
      updateParent(idx, { role });
      break;
    }
    case "add-kid":
      addKid();
      break;
    case "remove-kid":
      removeKid(el.dataset.id);
      break;
    case "goto-builder":
      if (!isIntakeComplete()) return;
      goToScreen("builder");
      break;
    case "goto-intake":
      goToScreen("intake");
      break;
    case "select-template":
      selectTemplate(el.dataset.id);
      break;
    case "start-guided":
      startGuided();
      break;
    case "exit-guided":
      exitGuided();
      break;
    case "answer-guided": {
      const q = GUIDED_QUESTIONS[el.dataset.qid];
      const opt = q.options[Number(el.dataset.oi)];
      answerGuided(opt);
      break;
    }
    case "set-start-parent":
      setTemplateConfig({ startParent: Number(el.dataset.idx) });
      break;
    case "goto-tools":
      if (!isScheduleComplete()) return;
      goToScreen("tools");
      break;
    case "switch-tool":
      setActiveTool(el.dataset.tool);
      break;
    case "cal-prev":
      shiftCalendarMonth(-1);
      break;
    case "cal-next":
      shiftCalendarMonth(1);
      break;
    case "open-day":
      openDayModal(el.dataset.date);
      break;
    case "close-modal":
      closeDayModal();
      break;
    case "set-day-parent":
      setDayOverride(el.dataset.date, Number(el.dataset.idx));
      openDayModal(el.dataset.date);
      break;
    case "clear-day-override":
      clearDayOverride(el.dataset.date);
      openDayModal(el.dataset.date);
      break;
    case "summary-prev-year":
      setSummaryYear(state.summaryYear - 1);
      break;
    case "summary-next-year":
      setSummaryYear(state.summaryYear + 1);
      break;
    case "holiday-prev-year":
      setHolidayYear(state.holidayYear - 1);
      break;
    case "holiday-next-year":
      setHolidayYear(state.holidayYear + 1);
      break;
    case "set-holiday-parent":
      setHolidayOverride(el.dataset.key, Number(el.dataset.idx));
      break;
    case "clear-holiday-override":
      setHolidayOverride(el.dataset.key, null);
      break;
    case "edit-holiday-dates":
      state.editingHolidayKey = el.dataset.key;
      commit();
      break;
    case "export-pdf":
      showToast("PDF export is coming soon — this demo build doesn't generate a file yet.");
      break;
  }
});

document.addEventListener("input", (e) => {
  const field = e.target.dataset.field;
  if (!field) return;
  const [kind, key] = field.split(":");
  if (kind === "parentName") {
    const idx = Number(key);
    state.parents[idx].name = e.target.value;
    saveState();
    const avatar = document.querySelector(`[data-avatar="${idx}"]`);
    if (avatar) avatar.textContent = initials(e.target.value);
    patchContinueButton();
  } else if (kind === "kidName") {
    const kid = state.kids.find((k) => k.id === key);
    if (kid) kid.name = e.target.value;
    saveState();
    patchContinueButton();
  }
});

document.addEventListener("change", (e) => {
  const action = e.target.dataset.actionChange;
  if (!action) return;
  const value = e.target.value;
  switch (action) {
    case "set-start-date":
      if (value) setTemplateConfig({ startDate: value });
      break;
    case "set-holiday-custom-start": {
      const key = e.target.dataset.key;
      const existing = state.holidayCustomDates[key] || {};
      setHolidayCustomRange(key, { start: value, end: existing.end || value });
      break;
    }
    case "set-holiday-custom-end": {
      const key = e.target.dataset.key;
      const existing = state.holidayCustomDates[key] || {};
      setHolidayCustomRange(key, { start: existing.start || value, end: value });
      state.editingHolidayKey = null;
      commit();
      break;
    }
  }
});

document.getElementById("day-modal-backdrop").addEventListener("click", (e) => {
  if (e.target.id === "day-modal-backdrop") closeDayModal();
});

// ------------------------------------------------------------
// Init
// ------------------------------------------------------------
document.body.setAttribute("data-theme", state.theme);
mainRender();
