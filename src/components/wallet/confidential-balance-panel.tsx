import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Eye,
  Fuel,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Wallet,
} from "lucide-react";
import type { Address } from "viem";
import { formatEther, formatUnits } from "viem";
import { useAccount, useBalance } from "wagmi";
import { sepolia } from "wagmi/chains";
import {
  confidentialBalanceQueryKey,
  useConfidentialBalance,
} from "../../hooks/use-confidential-balance";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

export function ConfidentialBalancePanel({
  tokenAddress,
  tokenSymbol,
  decimals,
  requiredAmount,
  title = "Wallet balances",
  className,
}: {
  tokenAddress: Address;
  tokenSymbol?: string;
  decimals?: number;
  requiredAmount?: bigint;
  title?: string;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const { address, chainId, isConnected } = useAccount();
  const gasBalance = useBalance({
    address,
    chainId: sepolia.id,
    query: { enabled: Boolean(address) },
  });
  const balance = useConfidentialBalance({
    tokenAddress,
    tokenSymbol,
    decimals,
  });

  const wrongNetwork = isConnected && chainId !== sepolia.id;
  const tokenDecimals = balance.decimals ?? 6;
  const formattedGas =
    gasBalance.data !== undefined
      ? `${Number(formatEther(gasBalance.data.value)).toFixed(4)} ETH`
      : "—";

  const formattedConfidential =
    balance.zeroBalance
      ? `0 ${balance.symbol}`
      : balance.revealedAmount !== undefined && balance.decimals !== undefined
        ? `${formatUnits(balance.revealedAmount, tokenDecimals)} ${balance.symbol}`
        : "••••••";

  const formattedRequired =
    requiredAmount !== undefined && requiredAmount > 0n
      ? formatUnits(requiredAmount, tokenDecimals)
      : undefined;

  const insufficient =
    balance.revealedAmount !== undefined &&
    requiredAmount !== undefined &&
    requiredAmount > 0n &&
    balance.revealedAmount < requiredAmount;

  function refreshBalances() {
    void gasBalance.refetch();
    void balance.refetch();
    void queryClient.invalidateQueries({
      queryKey: confidentialBalanceQueryKey(tokenAddress, balance.address),
    });
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-white/[.08] bg-white/[.02] p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-mint/10 text-mint">
            <Wallet size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Gas is paid in Sepolia ETH. Distributions use your confidential
              token balance.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={refreshBalances}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-mint"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <BalanceTile
          icon={Fuel}
          label="Sepolia ETH"
          hint="Gas"
          value={wrongNetwork ? "Switch network" : formattedGas}
          loading={gasBalance.isFetching}
        />
        <BalanceTile
          icon={balance.revealRequested ? Eye : LockKeyhole}
          label={`${balance.symbol} balance`}
          hint={balance.revealRequested ? "Revealed to you" : "Encrypted"}
          value={formattedConfidential}
          loading={balance.isLoading || balance.isRevealing}
        />
      </div>

      {formattedRequired && (
        <p className="mt-4 text-xs text-slate-500">
          This send needs{" "}
          <span className="font-mono text-slate-300">
            {formattedRequired} {balance.symbol}
          </span>
          .
        </p>
      )}

      {insufficient && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-400/15 bg-amber-400/[.04] px-3 py-2.5 text-xs leading-5 text-amber-100/80">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          Revealed balance is below the campaign total. Mint or fund more{" "}
          {balance.symbol} before executing.
        </div>
      )}

      {!balance.zeroBalance &&
        balance.revealedAmount === undefined &&
        !balance.revealRequested && (
          <Button
            variant="secondary"
            className="mt-4 h-9 rounded-xl text-xs"
            disabled={balance.isRevealing || wrongNetwork}
            onClick={() => void balance.reveal()}
          >
            {balance.isRevealing ? (
              <>
                <LoaderCircle size={14} className="animate-spin" />
                Authorizing…
              </>
            ) : (
              <>
                <Eye size={14} />
                Reveal my {balance.symbol} balance
              </>
            )}
          </Button>
        )}

      {balance.error && (
        <p className="mt-3 text-xs text-rose-300">{balance.error.message}</p>
      )}
    </section>
  );
}

function BalanceTile({
  icon: Icon,
  label,
  hint,
  value,
  loading,
}: {
  icon: typeof Fuel;
  label: string;
  hint: string;
  value: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/[.06] bg-black/20 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{label}</span>
        <Icon size={14} className="text-slate-600" />
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        {loading ? (
          <span className="inline-flex items-center gap-2 text-sm text-slate-500">
            <LoaderCircle size={14} className="animate-spin" />
            Syncing…
          </span>
        ) : (
          <strong className="truncate font-display text-xl font-semibold tracking-[-.03em]">
            {value}
          </strong>
        )}
        <span className="shrink-0 text-[11px] font-medium text-mint/70">
          {hint}
        </span>
      </div>
    </div>
  );
}