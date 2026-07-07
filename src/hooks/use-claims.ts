import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { getClaims, type SignMessageFn } from "../lib/claim-repository";

export const claimsQueryKey = (recipient?: Address) => [
  "privlo",
  "claims",
  recipient?.toLowerCase(),
];

const apiConfigured = Boolean(import.meta.env.VITE_PRIVLO_API_URL?.trim());

export function useClaims(recipient?: Address, signMessage?: SignMessageFn) {
  return useQuery({
    queryKey: claimsQueryKey(recipient),
    queryFn: () => getClaims(recipient!, signMessage),
    enabled:
      Boolean(recipient) && (!apiConfigured || Boolean(signMessage)),
    refetchInterval: 30_000,
  });
}