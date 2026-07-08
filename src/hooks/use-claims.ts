import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type { Address } from "viem";
import {
  getLocalClaimsInbox,
  syncRemoteClaimsInbox,
  type SignMessageFn,
} from "../lib/claim-repository";

export const claimsQueryKey = (recipient?: Address) => [
  "privlo",
  "claims",
  recipient?.toLowerCase(),
];

export function useClaims(recipient?: Address) {
  return useQuery({
    queryKey: claimsQueryKey(recipient),
    queryFn: () => getLocalClaimsInbox(recipient!),
    enabled: Boolean(recipient),
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });
}

export function useSyncRemoteClaims(
  recipient?: Address,
  signMessage?: SignMessageFn,
) {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string>();

  const syncRemote = useCallback(async () => {
    if (!recipient || !signMessage) return;
    setSyncing(true);
    setSyncError(undefined);
    try {
      const inbox = await syncRemoteClaimsInbox(recipient, signMessage);
      queryClient.setQueryData(claimsQueryKey(recipient), inbox);
    } catch (cause) {
      setSyncError(
        cause instanceof Error ? cause.message : "Could not sync cloud inbox.",
      );
    } finally {
      setSyncing(false);
    }
  }, [queryClient, recipient, signMessage]);

  return { syncRemote, syncing, syncError };
}