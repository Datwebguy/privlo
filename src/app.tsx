import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/app-shell";
import { CreateCampaign } from "./pages/create-campaign";
import { Dashboard } from "./pages/dashboard";
import { Landing } from "./pages/landing";
import { MyClaims } from "./pages/my-claims";
import { Web3Provider } from "./providers/web3-provider";

function ProtectedAppShell() {
  return (
    <Web3Provider>
      <AppShell />
    </Web3Provider>
  );
}

export function App() {
  return (
    <Routes>
      <Route index element={<Landing />} />
      <Route element={<ProtectedAppShell />}>
        <Route path="app" element={<Dashboard />} />
        <Route path="app/campaigns/new" element={<CreateCampaign />} />
        <Route path="app/claims" element={<MyClaims />} />
      </Route>
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
