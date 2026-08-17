import { THEMES } from "../lib/data";
import { parentDisplayName } from "../lib/derived";
import type { ThemeId } from "../lib/types";
import { usePlan } from "../state/PlanContext";

export function Topbar() {
  const { state, actions } = usePlan();

  let title = "Let's get started";
  if (state.screen === "builder") title = state.guidedActive ? "Quick guide" : "Build the schedule";
  if (state.screen === "tools") title = `${parentDisplayName(state, 0)} & ${parentDisplayName(state, 1)}`;

  return (
    <div className="topbar">
      <div className="topbar-title">
        <span className="brand">Parenting Plan Builder</span>
        <h1>{title}</h1>
      </div>
      <div className="topbar-actions">
        <div className="theme-switcher">
          {THEMES.map((t) => (
            <button
              key={t}
              type="button"
              className={`theme-dot ${state.theme === t ? "active" : ""}`}
              data-theme-opt={t}
              aria-label={`${t} theme`}
              onClick={() => actions.setTheme(t as ThemeId)}
            />
          ))}
        </div>
        {state.screen !== "intake" && (
          <button
            type="button"
            className="icon-btn"
            aria-label="Start over"
            onClick={() => {
              if (window.confirm("Start over? This clears the current plan from this browser.")) {
                actions.resetPlan();
              }
            }}
          >
            &#8634;
          </button>
        )}
      </div>
    </div>
  );
}
