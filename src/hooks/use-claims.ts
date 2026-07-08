import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { getClaims, type SignMessageFn } from "../lib/claim-repository";

export const claimsQueryKey = (recipient?: Address) => [
  "privlo",
  "claims",
  recipient?.toLowerCase(),
];

export function useClaims(recipient?: Address, signMessage?: SignMessageFn) {
  return useQuery({
    queryKey: claimsQueryKey(recipient),
    queryFn: () => getClaims(recipient!, signMessage),
    enabled: Boolean(recipient),
    refetchInterval: 30_000,
  });
}