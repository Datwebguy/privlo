import { lazy, Suspense } from "react";
import { DashboardPreview } from "./dashboard-preview";
import { useWalletActivation } from "../providers/wallet-activation-context";

const DashboardWallet = lazy(() =>
  import("./dashboard-wallet").then((module) => ({
    default: module.DashboardWallet,
  })),
);

export function Dashboard() {
  const { isActive } = useWalletActivation();

  if (!isActive) return <DashboardPreview />;

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