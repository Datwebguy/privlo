import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Landing } from "./pages/landing";

const ProtectedAppShell = lazy(() =>
  import("./protected-app-shell").then((module) => ({
    default: module.ProtectedAppShell,
  })),
);
const Dashboard = lazy(() =>
  import("./pages/dashboard").then((module) => ({ default: module.Dashboard })),
);
const CreateCampaign = lazy(() =>
  import("./pages/create-campaign").then((module) => ({
    default: module.CreateCampaign,
  })),
);
const MyClaims = lazy(() =>
  import("./pages/my-claims").then((module) => ({ default: module.MyClaims })),
);

function AppRouteFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink text-sm text-slate-500">
      Loading Privlo app…
    </div>
  );
}

function PageFallback() {
  return (
    <div className="grid min-h-64 place-items-center text-sm text-slate-500">
      Loading…
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route index element={<Landing />} />
      <Route
        element={
          <Suspense fallback={<AppRouteFallback />}>
            <ProtectedAppShell />
          </Suspense>
        }
      >
        <Route
          path="app"
          element={
            <Suspense fallback={<PageFallback />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="app/campaigns/new"
          element={
            <Suspense fallback={<PageFallback />}>
              <CreateCampaign />
            </Suspense>
          }
        />
        <Route
          path="app/claims"
          element={
            <Suspense fallback={<PageFallback />}>
              <MyClaims />
            </Suspense>
          }
        />
      </Route>
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}