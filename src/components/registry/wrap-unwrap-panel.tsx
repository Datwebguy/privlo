import { useQueryClient } from "@tanstack/react-query";
import {
  useAllow,
  useConfidentialBalance as useZamaConfidentialBalance,
  useShield,
  useUnshield,
  zamaQueryKeys,
} from "@zama-fhe/react-sdk";
import { ArrowDownUp, LoaderCircle, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { useAccount, useBalance } from "wagmi";
import { sepolia } from "wagmi/chains";
import type { RegistryPair } from "../../hooks/use-merged-registry-pairs";
import { confidentialBalanceQueryKey } from "../../hooks/use-confidential-balance";
import { formatZamaError } from "../../lib/zama-errors";
import { cn } from "../../lib/utils";
import { usePrivloFheWarmup } from "../../providers/fhe-warmup-provider";
import { ConfidentialBalancePanel } from "../wallet/confidential-balance-panel";
import { Button } from "../ui/button";
import { MockFaucetPanel } from "./mock-faucet-panel";

const zamaTokenConfig = (pair: RegistryPair) => ({
  tokenAddress: pair.confidentialTokenAddress,
  wrapperAddress: pair.confidentialTokenAddress,
});

export function WrapUnwrapPanel({ pair }: { pair: RegistryPair }) {
  const queryClient = useQueryClient();
  const { address, chainId } = useAccount();
  const [amount, setAmount] = useState("10");
  const [mode, setMode] = useState<"wrap" | "unwrap">("wrap");
  const [error, setError] = useState<string>();
  const [balanceTick, setBalanceTick] = useState(0);
  const decimals = pair.underlying?.decimals ?? pair.confidential?.decimals ?? 6;
  const underlyingSymbol = pair.underlying?.symbol ?? "ERC-20";
  const confidentialSymbol = pair.confidential?.symbol ?? "cToken";
  const tokenConfig = zamaTokenConfig(pair);

  const fhe = usePrivloFheWarmup(pair.confidentialTokenAddress);
  const allow = useAllow();

  const underlyingBalance = useBalance({
    address,
    token: pair.tokenAddress,
    chainId: sepolia.id,
    query: { enabled: Boolean(address) },
  });

  const confidentialBalance = useZamaConfidentialBalance(tokenConfig, {
    enabled: Boolean(address),
    refetchInterval: 15_000,
  });

  const shield = useShield({
    ...tokenConfig,
    optimistic: true,
  });
  const unshield = useUnshield(tokenConfig);

  const wrongNetwork = chainId !== undefined && chainId !== sepolia.id;
  const busy =
    shield.isPending || unshield.isPending || allow.isPending || fhe.busy;

  const refreshBalances = useCallback(async () => {
    await Promise.all([
      underlyingBalance.refetch(),
      confidentialBalance.refetch(),
      queryClient.invalidateQueries({
        queryKey: confidentialBalanceQueryKey(
          pair.confidentialTokenAddress,
          address,
        ),
      }),
      queryClient.invalidateQueries({
        queryKey: zamaQueryKeys.confidentialBalance.token(
          pair.confidentialTokenAddress,
        ),
      }),
      queryClient.invalidateQueries({
        queryKey: zamaQueryKeys.underlyingAllowance.token(
          pair.confidentialTokenAddress,
        ),
      }),
    ]);
    setBalanceTick((value) => value + 1);
  }, [
    address,
    confidentialBalance,
    pair.confidentialTokenAddress,
    queryClient,
    underlyingBalance,
  ]);

  useEffect(() => {
    if (!address) return;
    void fhe.ensureReady().catch(() => undefined);
  }, [address, fhe, pair.confidentialTokenAddress]);

  function switchMode(next: "wrap" | "unwrap") {
    setMode(next);
    setError(undefined);
  }

  const parsedAmount = (() => {
    try {
      return parseUnits(amount.trim() || "0", decimals);
    } catch {
      return undefined;
    }
  })();

  const underlyingValue = underlyingBalance.data?.value;
  const confidentialValue = confidentialBalance.data;

  const insufficientWrap =
    mode === "wrap" &&
    parsedAmount !== undefined &&
    parsedAmount > 0n &&
    underlyingValue !== undefined &&
    underlyingValue < parsedAmount;

  const insufficientUnwrap =
    mode === "unwrap" &&
    parsedAmount !== undefined &&
    parsedAmount > 0n &&
    confidentialValue !== undefined &&
    confidentialValue < parsedAmount;

  const formattedUnderlying = underlyingBalance.data
    ? Number(underlyingBalance.data.formatted).toFixed(4)
    : "—";

  const formattedConfidential =
    confidentialBalance.isLoading || confidentialBalance.isFetching
      ? "Syncing…"
      : confidentialValue !== undefined
        ? Number(formatUnits(confidentialValue, decimals)).toFixed(4)
        : "••••••";

  async function execute() {
    if (!address) return;
    setError(undefined);

    try {
      if (parsedAmount === undefined) {
        throw new Error("Enter a valid amount.");
      }
      if (parsedAmount <= 0n) {
        throw new Error("Enter an amount greater than zero.");
      }

      if (mode === "wrap") {
        if (insufficientWrap) {
          throw new Error(
            `Insufficient ${underlyingSymbol}. Mint or fund more public tokens first.`,
          );
        }
        await shield.mutateAsync({
          amount: parsedAmount,
          approvalStrategy: "max",
        });
      } else {
        if (confidentialBalance.isLoading) {
          throw new Error("Still loading your confidential balance. Try again.");
        }
        if (insufficientUnwrap) {
          throw new Error(
            `Insufficient ${confidentialSymbol}. Wrap more tokens or lower the amount.`,
          );
        }
        await fhe.ensureReady();
        await allow.mutateAsync([pair.confidentialTokenAddress]);
        await unshield.mutateAsync({ amount: parsedAmount });
      }

      await refreshBalances();
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
                onClick={() => switchMode(tab)}
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
            value={formattedUnderlying}
            hint={mode === "wrap" ? "Spending this balance" : "Receive after unwrap"}
            active={mode === "wrap"}
            loading={underlyingBalance.isFetching}
          />
          <InfoTile
            label={`${confidentialSymbol} (encrypted)`}
            value={formattedConfidential}
            hint={mode === "unwrap" ? "Spending this balance" : "Receive after wrap"}
            active={mode === "unwrap"}
            loading={confidentialBalance.isFetching}
          />
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-xs font-semibold text-slate-400">
            Amount to {mode}
          </label>
          <input
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              setError(undefined);
            }}
            inputMode="decimal"
            className="field-input h-11"
            placeholder={
              mode === "wrap"
                ? `e.g. 10 ${underlyingSymbol}`
                : `e.g. 10 ${confidentialSymbol}`
            }
          />
        </div>

        {mode === "wrap" && (
          <p className="mt-3 text-[11px] leading-5 text-slate-500">
            Your wallet may ask for one approval (sometimes shown as revoke, then
            confirm). Approve both prompts to finish wrapping.
          </p>
        )}

        {(insufficientWrap || insufficientUnwrap) && (
          <p className="mt-3 text-xs text-amber-200/80" role="alert">
            {insufficientWrap
              ? `Not enough ${underlyingSymbol} in your public balance.`
              : `Not enough ${confidentialSymbol} in your confidential balance.`}
          </p>
        )}

        {error && (
          <p className="mt-3 text-xs text-rose-300" role="alert">
            {error}
          </p>
        )}

        <Button
          className="mt-5 h-11 w-full rounded-2xl"
          disabled={
            !address ||
            wrongNetwork ||
            busy ||
            insufficientWrap ||
            insufficientUnwrap ||
            parsedAmount === undefined ||
            parsedAmount <= 0n
          }
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
        {!fhe.ready && !wrongNetwork && mode === "unwrap" && (
          <p className="mt-3 text-center text-xs text-slate-500">
            Preparing encryption for unwrap… wait for the header badge to show Ready.
          </p>
        )}
      </div>

      {address && (
        <ConfidentialBalancePanel
          key={`${pair.confidentialTokenAddress}-${balanceTick}`}
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
          onMinted={() => void refreshBalances()}
        />
      )}
    </div>
  );
}

function InfoTile({
  label,
  value,
  hint,
  active = false,
  loading = false,
}: {
  label: string;
  value: string;
  hint: string;
  active?: boolean;
  loading?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-black/20 p-4 transition",
        active ? "border-mint/25 bg-mint/[.04]" : "border-white/[.06]",
      )}
    >
      <span className="text-xs text-slate-500">{label}</span>
      <strong className="mt-2 block font-display text-xl font-semibold tracking-[-.03em]">
        {loading && value !== "Syncing…" ? (
          <span className="inline-flex items-center gap-2 text-base text-slate-500">
            <LoaderCircle size={14} className="animate-spin" />
            Syncing…
          </span>
        ) : (
          value
        )}
      </strong>
      <span className="mt-1 block text-[11px] text-mint/70">{hint}</span>
    </div>
  );
}