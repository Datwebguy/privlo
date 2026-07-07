import { lazy, Suspense } from "react";
import { WalletRequired } from "../components/wallet/wallet-required";
import { useWalletActivation } from "../providers/wallet-activation-context";

const MyClaimsFlow = lazy(() =>
  import("./my-claims-flow").then((module) => ({
    default: module.MyClaimsFlow,
  })),
);

export function MyClaims() {
  const { isActive } = useWalletActivation();

  if (!isActive) {
    return (
      <WalletRequired
        title="Connect to view your claims"
        copy="Privlo only initializes wallet software after you click connect."
      />
    );
  }

  return (
    <Suspense
      fallback={
        <div className="grid min-h-64 place-items-center text-sm text-slate-500">
          Loading claims…
        </div>
      }
    >
      <MyClaimsFlow />
    </Suspense>
  );
}