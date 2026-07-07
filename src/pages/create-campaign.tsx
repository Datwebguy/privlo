import { lazy, Suspense } from "react";
import { WalletRequired } from "../components/wallet/wallet-required";
import { useWalletActivation } from "../providers/wallet-activation-context";

const CreateCampaignFlow = lazy(() =>
  import("./create-campaign-flow").then((module) => ({
    default: module.CreateCampaignFlow,
  })),
);

export function CreateCampaign() {
  const { isActive } = useWalletActivation();

  if (!isActive) {
    return (
      <WalletRequired
        title="Connect to create a campaign"
        copy="Privlo only initializes wallet software after you click connect."
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