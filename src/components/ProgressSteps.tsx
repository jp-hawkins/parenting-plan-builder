import { usePlan } from "../state/PlanContext";

const STEP_LABELS = ["Parents & kids", "Schedule", "Calendar & summary"];

export function ProgressSteps() {
  const { state } = usePlan();
  if (state.screen === "tools") return null;
  const stepIdx = state.screen === "intake" ? 0 : 1;

  return (
    <div className="screen" style={{ paddingBottom: 0, gap: 10 }}>
      <div className="progress-steps">
        {STEP_LABELS.map((label, i) => (
          <div
            key={label}
            className={`step ${i < stepIdx ? "done" : ""} ${i === stepIdx ? "active" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
