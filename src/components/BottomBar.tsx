import { isIntakeComplete, isScheduleComplete } from "../lib/derived";
import { usePlan } from "../state/PlanContext";
import { useToast } from "./Toast";

export function BottomBar() {
  const { state, actions } = usePlan();
  const { showToast } = useToast();

  if (state.screen === "intake") {
    return (
      <div className="bottom-bar">
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!isIntakeComplete(state)}
          onClick={() => actions.goToScreen("builder")}
        >
          Continue
        </button>
      </div>
    );
  }

  if (state.screen === "builder" && !state.guidedActive) {
    return (
      <div className="bottom-bar">
        <button type="button" className="btn btn-secondary" onClick={() => actions.goToScreen("intake")}>
          Back
        </button>
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!isScheduleComplete(state)}
          onClick={() => actions.goToScreen("tools")}
        >
          Continue to Calendar
        </button>
      </div>
    );
  }

  if (state.screen === "tools") {
    return (
      <div className="bottom-bar">
        <button type="button" className="btn btn-secondary" onClick={() => actions.goToScreen("builder")}>
          Edit Setup
        </button>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => showToast("PDF export is coming soon — this demo build doesn't generate a file yet.")}
        >
          Export Plan as PDF
        </button>
      </div>
    );
  }

  return null;
}
