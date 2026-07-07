import type { Address } from "viem";

/**
 * Dev-only or custom ERC-20 ↔ ERC-7984 pairs merged on top of the onchain registry.
 *
 * To add a pair locally (without waiting for onchain registration):
 * 1. Copy the example block below.
 * 2. Set `tokenAddress` (underlying ERC-20) and `confidentialTokenAddress` (ERC-7984).
 * 3. Redeploy or refresh — the Registry page picks it up automatically.
 *
 * Onchain registry entries with the same confidential address take precedence.
 */
export type LocalWrapperPair = {
  tokenAddress: Address;
  confidentialTokenAddress: Address;
  label?: string;
  /** When true, show the public mint faucet if the underlying exposes `mint`. */
  faucetEnabled?: boolean;
};

export const localWrapperPairs: LocalWrapperPair[] = [
  // Example (disabled — uncomment and fill addresses to test a dev pair):
  // {
  //   tokenAddress: "0xYourErc20",
  //   confidentialTokenAddress: "0xYourErc7984",
  //   label: "My dev pair",
  //   faucetEnabled: true,
  // },
];