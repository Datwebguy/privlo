import { useMintConfidential } from "@tokenops/sdk/testnet-faucet/react";
import { useQueryClient } from "@tanstack/react-query";
import { Coins, LoaderCircle } from "lucide-react";
import type { Address } from "viem";
import { formatUnits } from "viem";
import { useAccount, useWalletClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import { Button } from "../ui/button";

/** 1,000 CTTT at 6 decimals — sensible starter balance for demos. */
const STARTER_MINT_AMOUNT = 1_000_000_000n;

function friendlyMintError(error: Error) {
  const message = error.message.toLowerCase();
  if (message.includes("walletclient is required")) {
    return "Wallet is still preparing. Stay on Sepolia, wait a moment, and try again.";
  }
  if (message.includes("rejected") || message.includes("denied")) {
    return "Mint was rejected in your wallet.";
  }
  return error.message.split("\n")[0] || "Mint failed.";
}

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
  const { chainId, isConnected } = useAccount();
  const walletClientQuery = useWalletClient({ chainId: sepolia.id });
  const walletClient = walletClientQuery.data;
  const faucet = useMintConfidential({ chainId: sepolia.id });
  const mintAmount =
    campaignTotal > 0n ? campaignTotal : STARTER_MINT_AMOUNT;
  const mintLabel =
    campaignTotal > 0n
      ? `Mint ${formatUnits(campaignTotal, decimals)} ${tokenSymbol}`
      : `Mint starter ${tokenSymbol}`;
  const wrongNetwork = isConnected && chainId !== sepolia.id;
  const walletPending = isConnected && !walletClient && walletClientQuery.isLoading;
  const walletUnavailable = isConnected && !walletClient && !walletClientQuery.isLoading;
  const mintDisabled =
    faucet.isPending || wrongNetwork || walletPending || walletUnavailable;

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
          disabled={mintDisabled}
          onClick={() => {
            if (!walletClient) return;
            faucet.mutate(
              { amount: mintAmount, to: recipient },
              {
                onSuccess: () => {
                  void queryClient.invalidateQueries({
                    queryKey: ["tokenops-sdk", "testnet-faucet"],
                  });
                },
              },
            );
          }}
        >
          {wrongNetwork ? (
            "Switch to Sepolia"
          ) : walletPending ? (
            <>
              <LoaderCircle className="animate-spin" size={14} />
              Preparing wallet…
            </>
          ) : faucet.isPending ? (
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
      {wrongNetwork && (
        <p className="mt-3 text-xs text-amber-200/80">
          Switch your wallet to Sepolia before minting test tokens.
        </p>
      )}
      {walletUnavailable && (
        <p className="mt-3 text-xs text-amber-200/80">
          Wallet connection is not ready for writes yet. Refresh the page or
          reconnect your wallet, then try again.
        </p>
      )}
      {faucet.error && (
        <p className="mt-3 text-xs text-rose-300">
          {friendlyMintError(faucet.error)}
        </p>
      )}
    </div>
  );
}