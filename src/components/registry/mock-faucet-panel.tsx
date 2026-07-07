import { useQueryClient } from "@tanstack/react-query";
import { Droplets, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { parseAbi, type Address } from "viem";
import { useAccount, useWriteContract } from "wagmi";
import { sepolia } from "wagmi/chains";
import {
  MOCK_FAUCET_MINT_CAP,
  starterMintAmount,
} from "../../config/wrapper-registry";
import { confidentialBalanceQueryKey } from "../../hooks/use-confidential-balance";
import { formatZamaError } from "../../lib/zama-errors";
import { Button } from "../ui/button";

const mintAbi = parseAbi([
  "function mint(address to, uint256 amount)",
  "function decimals() view returns (uint8)",
]);

export function MockFaucetPanel({
  underlyingAddress,
  underlyingSymbol = "token",
  decimals = 6,
  confidentialAddress,
}: {
  underlyingAddress: Address;
  underlyingSymbol?: string;
  decimals?: number;
  confidentialAddress: Address;
}) {
  const queryClient = useQueryClient();
  const { address, chainId } = useAccount();
  const [error, setError] = useState<string>();
  const { writeContractAsync, isPending } = useWriteContract();
  const wrongNetwork = chainId !== undefined && chainId !== sepolia.id;
  const mintAmount = starterMintAmount(decimals);
  const capped =
    mintAmount > MOCK_FAUCET_MINT_CAP * 10n ** BigInt(decimals)
      ? MOCK_FAUCET_MINT_CAP * 10n ** BigInt(decimals)
      : mintAmount;

  async function claim() {
    if (!address) return;
    setError(undefined);
    try {
      await writeContractAsync({
        address: underlyingAddress,
        abi: mintAbi,
        functionName: "mint",
        args: [address, capped],
        chainId: sepolia.id,
      });
      void queryClient.invalidateQueries({
        queryKey: confidentialBalanceQueryKey(confidentialAddress, address),
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? formatZamaError(cause)
          : "Mint failed. This underlying may not expose a public mint.",
      );
    }
  }

  return (
    <div className="rounded-2xl border border-sky-400/15 bg-sky-400/[.04] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-400/10 text-sky-200">
            <Droplets size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-sky-100">
              Sepolia mock faucet
            </p>
            <p className="mt-1 max-w-lg text-xs leading-6 text-slate-500">
              Mint official cTokenMock underlying {underlyingSymbol} into your
              wallet, then wrap it into the confidential ERC-7984 pair.
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          className="h-10 shrink-0 rounded-xl px-4 text-xs"
          disabled={!address || wrongNetwork || isPending}
          onClick={() => void claim()}
        >
          {isPending ? (
            <>
              <LoaderCircle className="animate-spin" size={14} />
              Minting…
            </>
          ) : (
            `Mint starter ${underlyingSymbol}`
          )}
        </Button>
      </div>
      {wrongNetwork && (
        <p className="mt-3 text-xs text-amber-200/80">
          Switch to Sepolia to claim mock tokens.
        </p>
      )}
      {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}
    </div>
  );
}