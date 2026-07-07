import { Wallet } from "lucide-react";
import { lazy, Suspense } from "react";
import { useWalletActivation } from "../../providers/wallet-activation-context";
import { Button } from "../ui/button";

const ConnectButtonActive = lazy(() =>
  import("./connect-button-active").then((module) => ({
    default: module.ConnectButtonActive,
  })),
);

export function ConnectButton() {
  const { isActive, activate, requestPicker } = useWalletActivation();

  if (!isActive) {
    return (
      <Button
        className="h-10 rounded-full"
        onClick={() => {
          activate();
          requestPicker();
        }}
      >
        <Wallet size={15} />
        Connect wallet
      </Button>
    );
  }

  return (
    <Suspense
      fallback={
        <Button disabled className="h-10 rounded-full">
          <Wallet size={15} />
          Preparing wallets…
        </Button>
      }
    >
      <ConnectButtonActive />
    </Suspense>
  );
}