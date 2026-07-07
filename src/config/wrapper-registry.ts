import { SepoliaConfig } from "@zama-fhe/react-sdk";
import type { Address } from "viem";

/** Official Sepolia Wrappers Registry — primary source of truth. */
export const sepoliaWrappersRegistryAddress =
  SepoliaConfig.registryAddress as Address;

/** Max per-call mint on official cTokenMock underlying tokens (docs). */
export const MOCK_FAUCET_MINT_CAP = 1_000_000n;

/** Default starter mint: 1,000 tokens at token decimals. */
export function starterMintAmount(decimals: number) {
  return 1_000n * 10n ** BigInt(decimals);
}