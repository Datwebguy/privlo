import { lazy, Suspense } from "react";
import { useAccount } from "wagmi";
import { WalletRequired } from "../components/wallet/wallet-required";

const CreateCampaignFlow = lazy(() =>
  import("./create-campaign-flow").then((module) => ({
    default: module.CreateCampaignFlow,
  })),
);

export function CreateCampaign() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <WalletRequired
        title="Connect to create a campaign"
        copy="Connect your wallet on Sepolia to build a confidential distribution."
      />
    );
  }

  return (
    <Suspense
      fallback={
        <div className="grid min-h-64 place-items-center text-sm text-slate-500">
          Loading campaign builder…
        </div>
      }
    >
      <CreateCampaignFlow />
    </Suspense>
  );
}