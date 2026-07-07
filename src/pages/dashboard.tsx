import { lazy, Suspense } from "react";
import { useAccount } from "wagmi";
import { DashboardPreview } from "./dashboard-preview";

const DashboardWallet = lazy(() =>
  import("./dashboard-wallet").then((module) => ({
    default: module.DashboardWallet,
  })),
);

export function Dashboard() {
  const { isConnected } = useAccount();

  if (!isConnected) return <DashboardPreview />;

  return (
    <Suspense
      fallback={
        <div className="grid min-h-64 place-items-center text-sm text-slate-500">
          Loading wallet dashboard…
        </div>
      }
    >
      <DashboardWallet />
    </Suspense>
  );
}