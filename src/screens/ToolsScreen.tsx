import { CalendarTool } from "../components/calendar/CalendarTool";
import { HolidaysTool } from "../components/HolidaysTool";
import { PlanDetailsTool } from "../components/plandetails/PlanDetailsTool";
import { SummaryTool } from "../components/SummaryTool";
import type { ToolId } from "../lib/types";
import { usePlan } from "../state/PlanContext";

const TABS: { id: ToolId; label: string }[] = [
  { id: "calendar", label: "Calendar" },
  { id: "summary", label: "Summary" },
  { id: "holidays", label: "Holidays" },
  { id: "plan-details", label: "Plan Details" },
];

export function ToolsScreen() {
  const { state, actions } = usePlan();

  return (
    <>
      <div className="tool-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tool-tab ${state.activeTool === t.id ? "active" : ""}`}
            onClick={() => actions.setActiveTool(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {state.activeTool === "calendar" && <CalendarTool />}
      {state.activeTool === "summary" && <SummaryTool />}
      {state.activeTool === "holidays" && <HolidaysTool />}
      {state.activeTool === "plan-details" && <PlanDetailsTool />}
    </>
  );
}
