import { useShield, useUnshield } from "@zama-fhe/react-sdk";
import { ArrowDownUp, LoaderCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { parseUnits, type Address } from "viem";
import { useAccount, useBalance } from "wagmi";
import { sepolia } from "wagmi/chains";
import type { RegistryPair } from "../../hooks/use-merged-registry-pairs";
import { formatZamaError } from "../../lib/zama-errors";
import { cn } from "../../lib/utils";
import { ConfidentialBalancePanel } from "../wallet/confidential-balance-panel";
import { Button } from "../ui/button";
import { MockFaucetPanel } from "./mock-faucet-panel";

export function WrapUnwrapPanel({ pair }: { pair: RegistryPair }) {
  const { address, chainId } = useAccount();
  const [amount, setAmount] = useState("10");
  const [mode, setMode] = useState<"wrap" | "unwrap">("wrap");
  const [error, setError] = useState<string>();
  const decimals = pair.underlying?.decimals ?? pair.confidential?.decimals ?? 6;
  const underlyingSymbol = pair.underlying?.symbol ?? "ERC-20";
  const confidentialSymbol = pair.confidential?.symbol ?? "cToken";

  const underlyingBalance = useBalance({
    address,
    token: pair.tokenAddress,
    chainId: sepolia.id,
    query: { enabled: Boolean(address) },
  });

  const shield = useShield({
    tokenAddress: pair.confidentialTokenAddress,
    wrapperAddress: pair.confidentialTokenAddress,
  });
  const unshield = useUnshield({
    tokenAddress: pair.confidentialTokenAddress,
    wrapperAddress: pair.confidentialTokenAddress,
  });

  const wrongNetwork = chainId !== undefined && chainId !== sepolia.id;
  const busy = shield.isPending || unshield.isPending;

  async function execute() {
    if (!address) return;
    setError(undefined);
    try {
      const value = parseUnits(amount.trim() || "0", decimals);
      if (value <= 0n) {
        throw new Error("Enter an amount greater than zero.");
      }
      if (mode === "wrap") {
        await shield.mutateAsync({ amount: value });
      } else {
        await unshield.mutateAsync({ amount: value });
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? formatZamaError(cause)
          : "Transaction failed.",
      );
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/[.08] bg-panel/70 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">
              {underlyingSymbol} ↔ {confidentialSymbol}
            </p>
            <p className="mt-1 font-mono text-[11px] text-slate-600">
              {pair.source === "local" ? "Local pair" : "Onchain registry"} ·{" "}
              {pair.isValid ? "Valid" : "Invalid"}
            </p>
          </div>
          <div className="flex rounded-xl border border-white/[.08] bg-black/20 p-1">
            {(["wrap", "unwrap"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setMode(tab)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition",
                  mode === tab
                    ? "bg-mint/15 text-mint"
                    : "text-slate-500 hover:text-slate-300",
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <InfoTile
            label={`${underlyingSymbol} (public)`}
            value={
              underlyingBalance.data
                ? `${Number(underlyingBalance.data.formatted).toFixed(4)}`
                : "—"
            }
            hint="Wrap from here"
          />
          <InfoTile
            label={`${confidentialSymbol} (encrypted)`}
            value="Reveal below"
            hint="Unwrap from here"
          />
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-xs font-semibold text-slate-400">
            Amount to {mode}
          </label>
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            className="field-input h-11"
            placeholder={`e.g. 10 ${underlyingSymbol}`}
          />
        </div>

        {error && (
          <p className="mt-3 text-xs text-rose-300" role="alert">
            {error}
          </p>
        )}

        <Button
          className="mt-5 h-11 w-full rounded-2xl"
          disabled={!address || wrongNetwork || busy}
          onClick={() => void execute()}
        >
          {busy ? (
            <>
              <LoaderCircle className="animate-spin" size={16} />
              {mode === "wrap" ? "Wrapping…" : "Unwrapping…"}
            </>
          ) : (
            <>
              {mode === "wrap" ? <ShieldCheck size={16} /> : <ArrowDownUp size={16} />}
              {mode === "wrap" ? "Wrap to confidential" : "Unwrap to ERC-20"}
            </>
          )}
        </Button>
        {wrongNetwork && (
          <p className="mt-3 text-center text-xs text-amber-200/80">
            Switch to Sepolia in your wallet to continue.
          </p>
        )}
      </div>

      {address && (
        <ConfidentialBalancePanel
          tokenAddress={pair.confidentialTokenAddress}
          tokenSymbol={confidentialSymbol}
          decimals={decimals}
          title="Your confidential balance"
        />
      )}

      {pair.faucetEnabled && (
        <MockFaucetPanel
          underlyingAddress={pair.tokenAddress}
          underlyingSymbol={underlyingSymbol}
          decimals={decimals}
          confidentialAddress={pair.confidentialTokenAddress}
        />
      )}
    </div>
  );
}

function InfoTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-white/[.06] bg-black/20 p-4">
      <span className="text-xs text-slate-500">{label}</span>
      <strong className="mt-2 block font-display text-xl font-semibold tracking-[-.03em]">
        {value}
      </strong>
      <span className="mt-1 block text-[11px] text-mint/70">{hint}</span>
    </div>
  );
}