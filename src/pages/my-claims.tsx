import { lazy, Suspense } from "react";
import { useAccount } from "wagmi";
import { WalletRequired } from "../components/wallet/wallet-required";

const MyClaimsFlow = lazy(() =>
  import("./my-claims-flow").then((module) => ({
    default: module.MyClaimsFlow,
  })),
);

export function MyClaims() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <WalletRequired
        title="Connect to receive tokens"
        copy="Connect the recipient wallet on Sepolia to view disperse balances or claim confidential airdrops."
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