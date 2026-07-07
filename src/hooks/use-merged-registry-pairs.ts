import {
  useListPairs,
  type TokenWrapperPairWithMetadata,
} from "@zama-fhe/react-sdk";
import { useMemo } from "react";
import type { Address } from "viem";
import { localWrapperPairs } from "../config/wrapper-pairs.local";

export type RegistryPair = {
  tokenAddress: Address;
  confidentialTokenAddress: Address;
  isValid: boolean;
  source: "onchain" | "local";
  label?: string;
  faucetEnabled: boolean;
  underlying?: TokenWrapperPairWithMetadata["underlying"];
  confidential?: TokenWrapperPairWithMetadata["confidential"];
};

function isMetadataPair(
  pair: TokenWrapperPairWithMetadata | { tokenAddress: Address },
): pair is TokenWrapperPairWithMetadata {
  return "underlying" in pair && "confidential" in pair;
}

function mockFaucetEligible(pair: RegistryPair) {
  if (pair.faucetEnabled) return true;
  const symbol = pair.underlying?.symbol ?? pair.confidential?.symbol ?? "";
  const name = pair.underlying?.name ?? "";
  return /mock/i.test(symbol) || /mock/i.test(name);
}

export function useMergedRegistryPairs() {
  const onchain = useListPairs({ page: 1, pageSize: 100, metadata: true });

  const pairs = useMemo(() => {
    const seen = new Set<string>();
    const merged: RegistryPair[] = [];

    for (const item of onchain.data?.items ?? []) {
      const key = item.confidentialTokenAddress.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const enriched: RegistryPair = {
        tokenAddress: item.tokenAddress,
        confidentialTokenAddress: item.confidentialTokenAddress,
        isValid: item.isValid,
        source: "onchain",
        faucetEnabled: false,
        underlying: isMetadataPair(item) ? item.underlying : undefined,
        confidential: isMetadataPair(item) ? item.confidential : undefined,
      };
      enriched.faucetEnabled = mockFaucetEligible(enriched);
      merged.push(enriched);
    }

    for (const local of localWrapperPairs) {
      const key = local.confidentialTokenAddress.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push({
        tokenAddress: local.tokenAddress,
        confidentialTokenAddress: local.confidentialTokenAddress,
        isValid: true,
        source: "local",
        label: local.label,
        faucetEnabled: local.faucetEnabled ?? false,
      });
    }

    return merged.sort((a, b) => {
      const aSymbol = a.confidential?.symbol ?? a.label ?? a.tokenAddress;
      const bSymbol = b.confidential?.symbol ?? b.label ?? b.tokenAddress;
      return aSymbol.localeCompare(bSymbol);
    });
  }, [onchain.data?.items]);

  return {
    pairs,
    total: onchain.data?.total ?? pairs.length,
    isLoading: onchain.isLoading,
    isError: onchain.isError,
    error: onchain.error,
    refetch: onchain.refetch,
  };
}