import { BottomBar } from "./components/BottomBar";
import { PrintableReport } from "./components/PrintableReport";
import { ProgressSteps } from "./components/ProgressSteps";
import { ToastProvider } from "./components/Toast";
import { Topbar } from "./components/Topbar";
import { BuilderScreen } from "./screens/BuilderScreen";
import { IntakeScreen } from "./screens/IntakeScreen";
import { ToolsScreen } from "./screens/ToolsScreen";
import { PlanProvider, usePlan } from "./state/PlanContext";

function ScreenBody() {
  const { state } = usePlan();
  if (state.screen === "intake") return <IntakeScreen />;
  if (state.screen === "builder") return <BuilderScreen />;
  return <ToolsScreen />;
}

function AppShell() {
  return (
    <div className="app-shell">
      <Topbar />
      <ProgressSteps />
      <div className="screen">
        <ScreenBody />
      </div>
      <BottomBar />
      <PrintableReport />
    </div>
  );
}

function App() {
  return (
    <PlanProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </PlanProvider>
  );
}

export default App;
