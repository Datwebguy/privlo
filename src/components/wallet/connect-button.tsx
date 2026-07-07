import { Wallet } from "lucide-react";
import { lazy, Suspense } from "react";
import { Button } from "../ui/button";

const ConnectButtonActive = lazy(() =>
  import("./connect-button-active").then((module) => ({
    default: module.ConnectButtonActive,
  })),
);

export function ConnectButton() {
  return (
    <Suspense
      fallback={
        <Button disabled className="h-10 rounded-full">
          <Wallet size={15} />
          Connect wallet
        </Button>
      }
    >
      <ConnectButtonActive />
    </Suspense>
  );
}