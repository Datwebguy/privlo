import { useUserDecrypt } from "@zama-fhe/react-sdk";
import { useCallback, useState } from "react";
import { parseAbi, type Address, type Hex } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { sepolia } from "wagmi/chains";

export const confidentialBalanceAbi = parseAbi([
  "function confidentialBalanceOf(address account) view returns (bytes32)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
]);

const ZERO_HANDLE =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

export function confidentialBalanceQueryKey(
  tokenAddress?: Address,
  account?: Address,
) {
  return [
    "privlo",
    "confidential-balance",
    tokenAddress?.toLowerCase(),
    account?.toLowerCase(),
  ] as const;
}

function isZeroHandle(handle?: Hex) {
  return !handle || handle.toLowerCase() === ZERO_HANDLE;
}

export function useConfidentialBalance({
  tokenAddress,
  tokenSymbol,
  decimals: decimalsOverride,
}: {
  tokenAddress?: Address;
  tokenSymbol?: string;
  decimals?: number;
}) {
  const { address } = useAccount();
  const enabled = Boolean(tokenAddress && address);

  const balanceQuery = useReadContract({
    address: tokenAddress,
    abi: confidentialBalanceAbi,
    functionName: "confidentialBalanceOf",
    args: address ? [address] : undefined,
    chainId: sepolia.id,
    query: {
      enabled,
      refetchInterval: 20_000,
    },
  });

  const decimalsQuery = useReadContract({
    address: tokenAddress,
    abi: confidentialBalanceAbi,
    functionName: "decimals",
    chainId: sepolia.id,
    query: { enabled: enabled && decimalsOverride === undefined },
  });

  const symbolQuery = useReadContract({
    address: tokenAddress,
    abi: confidentialBalanceAbi,
    functionName: "symbol",
    chainId: sepolia.id,
    query: { enabled: enabled && !tokenSymbol },
  });

  const [revealRequested, setRevealRequested] = useState(false);
  const handle = balanceQuery.data;
  const zeroBalance = isZeroHandle(handle);
  const decrypt = useUserDecrypt(
    {
      handles:
        revealRequested && handle && !zeroBalance
          ? [{ handle, contractAddress: tokenAddress! }]
          : [],
    },
    { enabled: revealRequested && Boolean(handle) && !zeroBalance },
  );

  const decryptedValue =
    handle && revealRequested ? decrypt.data?.[handle] : undefined;
  const revealedAmount = zeroBalance
    ? 0n
    : typeof decryptedValue === "bigint"
      ? decryptedValue
      : undefined;

  const reveal = useCallback(() => {
    setRevealRequested(true);
  }, []);

  const resetReveal = useCallback(() => {
    setRevealRequested(false);
  }, []);

  return {
    address,
    handle,
    zeroBalance,
    revealedAmount,
    decimals: decimalsOverride ?? decimalsQuery.data,
    symbol: tokenSymbol ?? symbolQuery.data ?? "tokens",
    isLoading: balanceQuery.isLoading,
    isRevealing: decrypt.isFetching || decrypt.isLoading,
    revealRequested,
    reveal,
    resetReveal,
    refetch: balanceQuery.refetch,
    error: balanceQuery.error ?? decrypt.error,
  };
}