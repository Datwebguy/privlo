import { useMintConfidential } from "@tokenops/sdk/testnet-faucet/react";
import { useQueryClient } from "@tanstack/react-query";
import { Coins, LoaderCircle } from "lucide-react";
import type { Address } from "viem";
import { formatUnits } from "viem";
import { Button } from "../ui/button";

/** 1,000 CTTT at 6 decimals — sensible starter balance for demos. */
const STARTER_MINT_AMOUNT = 1_000_000_000n;

export function TestTokenFaucet({
  recipient,
  campaignTotal = 0n,
  tokenSymbol = "CTTT",
  decimals = 6,
}: {
  recipient: Address;
  campaignTotal?: bigint;
  tokenSymbol?: string;
  decimals?: number;
}) {
  const queryClient = useQueryClient();
  const faucet = useMintConfidential();
  const mintAmount =
    campaignTotal > 0n ? campaignTotal : STARTER_MINT_AMOUNT;
  const mintLabel =
    campaignTotal > 0n
      ? `Mint ${formatUnits(campaignTotal, decimals)} ${tokenSymbol}`
      : `Mint starter ${tokenSymbol}`;

  return (
    <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[.04] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cyan-400/10 text-cyan-200">
            <Coins size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-cyan-100">
              Need {tokenSymbol}? Mint test tokens here
            </p>
            <p className="mt-1 max-w-lg text-xs leading-6 text-slate-500">
              <span className="text-slate-400">Sepolia ETH</span> only pays gas.
              You distribute{" "}
              <span className="text-slate-400">{tokenSymbol}</span> — TokenOps&apos;
              confidential ERC-7984 test token. No swap required; mint directly
              into your connected wallet.
            </p>
            {campaignTotal > 0n && (
              <p className="mt-2 text-xs text-slate-600">
                Campaign total:{" "}
                <span className="font-mono text-slate-400">
                  {formatUnits(campaignTotal, decimals)} {tokenSymbol}
                </span>
              </p>
            )}
          </div>
        </div>

        <Button
          variant="secondary"
          className="h-10 shrink-0 rounded-xl px-4 text-xs"
          disabled={faucet.isPending}
          onClick={() =>
            faucet.mutate(
              { amount: mintAmount, to: recipient, account: recipient },
              {
                onSuccess: () => {
                  void queryClient.invalidateQueries({
                    queryKey: ["tokenops-sdk", "testnet-faucet"],
                  });
                },
              },
            )
          }
        >
          {faucet.isPending ? (
            <>
              <LoaderCircle className="animate-spin" size={14} />
              Minting…
            </>
          ) : faucet.isSuccess ? (
            "Test tokens minted"
          ) : (
            mintLabel
          )}
        </Button>
      </div>
      {faucet.error && (
        <p className="mt-3 text-xs text-rose-300">{faucet.error.message}</p>
      )}
    </div>
  );
}