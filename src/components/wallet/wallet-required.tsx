import { LockKeyhole } from "lucide-react";
import { useWalletActivation } from "../../providers/wallet-activation-context";
import { Button } from "../ui/button";

export function WalletRequired({
  title,
  copy,
}: {
  title: string;
  copy: string;
}) {
  const { activate, requestPicker } = useWalletActivation();

  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white/[.04] text-slate-400">
        <LockKeyhole size={24} />
      </span>
      <h1 className="mt-6 font-display text-3xl font-semibold tracking-[-.04em]">
        {title}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
        {copy}
      </p>
      <Button
        className="mt-8 h-12 rounded-full px-6"
        onClick={() => {
          activate();
          requestPicker();
        }}
      >
        Connect wallet
      </Button>
    </div>
  );
}