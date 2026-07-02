import {
  createConfidentialAirdropClient,
  type ClaimArgs,
} from "@tokenops/sdk/fhe-airdrop";
import {
  createConfidentialDisperseClient,
  type DisperseArgs,
} from "@tokenops/sdk/fhe-disperse";
import type { PublicClient, WalletClient } from "viem";

/**
 * Framework-free TokenOps adapter used by jobs, tests, and non-React flows.
 * React screens use the matching SDK hooks so wagmi handles account changes.
 */
export function createTokenOpsClients({
  publicClient,
  walletClient,
}: {
  publicClient: PublicClient;
  walletClient: WalletClient;
}) {
  return {
    disperse: createConfidentialDisperseClient({
      publicClient,
      walletClient,
    }),
    airdrop(address: `0x${string}`) {
      return createConfidentialAirdropClient({
        publicClient,
        walletClient,
        address,
      });
    },
  };
}

export type TokenOpsDisperseInput = DisperseArgs;
export type TokenOpsClaimInput = ClaimArgs;
