import { getConfidentialTestTokenAddress } from "@tokenops/sdk";
import { useMintConfidential } from "@tokenops/sdk/testnet-faucet/react";
import { useQueryClient } from "@tanstack/react-query";
import { Coins, LoaderCircle } from "lucide-react";
import { useEffect } from "react";
import type { Address } from "viem";
import { formatUnits } from "viem";
import {
  useAccount,
  useSwitchChain,
  useWalletClient,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { confidentialBalanceQueryKey } from "../../hooks/use-confidential-balance";
import { Button } from "../ui/button";

/** 1,000 CTTT at 6 decimals — sensible starter balance for demos. */
const STARTER_MINT_AMOUNT = 1_000_000_000n;

function friendlyMintError(error: Error) {
  const message = error.message.toLowerCase();
  if (message.includes("walletclient is required")) {
    return "Wallet is still preparing. Wait a moment on Sepolia, then try again.";
  }
  if (message.includes("rejected") || message.includes("denied")) {
    return "Mint was rejected in your wallet.";
  }
  return error.message.split("\n")[0] || "Mint failed.";
}

function friendlySwitchError(error: Error) {
  const message = error.message.toLowerCase();
  if (message.includes("rejected") || message.includes("denied")) {
    return "Network switch was rejected in your wallet.";
  }
  return error.message.split("\n")[0] || "Could not switch to Sepolia.";
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
  const {
    switchChain,
    isPending: isSwitching,
    error: switchError,
    reset: resetSwitch,
  } = useSwitchChain();
  const faucet = useMintConfidential({ chainId: sepolia.id });
  const mintAmount =
    campaignTotal > 0n ? campaignTotal : STARTER_MINT_AMOUNT;
  const mintLabel =
    campaignTotal > 0n
      ? `Mint ${formatUnits(campaignTotal, decimals)} ${tokenSymbol}`
      : `Mint starter ${tokenSymbol}`;

  const wrongNetwork = isConnected && chainId !== sepolia.id;
  const onSepolia = isConnected && chainId === sepolia.id;
  const walletPending =
    onSepolia && !walletClient && walletClientQuery.isLoading;
  const walletUnavailable =
    onSepolia && !walletClient && !walletClientQuery.isLoading;

  useEffect(() => {
    if (chainId === sepolia.id) {
      void walletClientQuery.refetch();
    }
  }, [chainId, walletClientQuery]);

  function handlePrimaryAction() {
    resetSwitch();
    faucet.reset();

    if (wrongNetwork) {
      switchChain({ chainId: sepolia.id });
      return;
    }

    if (!walletClient) return;

    faucet.mutate(
      { amount: mintAmount, to: recipient },
      {
                onSuccess: () => {
                  void queryClient.invalidateQueries({
                    queryKey: ["tokenops-sdk", "testnet-faucet"],
                  });
                  void queryClient.invalidateQueries({
                    queryKey: confidentialBalanceQueryKey(
                      getConfidentialTestTokenAddress(sepolia.id) ?? undefined,
                      recipient,
                    ),
                  });
                },
      },
    );
  }

  const buttonDisabled = wrongNetwork
    ? isSwitching
    : faucet.isPending || walletPending || walletUnavailable;

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
          disabled={buttonDisabled}
          onClick={handlePrimaryAction}
        >
          {wrongNetwork ? (
            isSwitching ? (
              <>
                <LoaderCircle className="animate-spin" size={14} />
                Switching…
              </>
            ) : (
              "Switch to Sepolia"
            )
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
          Privlo runs on Sepolia. Click the button to switch networks in your
          wallet, then approve the request.
        </p>
      )}
      {walletUnavailable && (
        <p className="mt-3 text-xs text-amber-200/80">
          Wallet is connected on Sepolia but not ready for writes yet. Disconnect
          and reconnect from the header, then try again.
        </p>
      )}
      {switchError && (
        <p className="mt-3 text-xs text-rose-300">
          {friendlySwitchError(switchError)}
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