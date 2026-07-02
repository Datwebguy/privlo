import { useClaim, useGetClaimAmount } from "@tokenops/sdk/fhe-airdrop/react";
import { useState } from "react";
import type { Hex } from "viem";

export interface ClaimAuthorization {
  airdropAddress: `0x${string}`;
  encryptedInput: {
    handle: Hex;
    inputProof: Hex;
  };
  signature: Hex;
}

/**
 * The recipient UX intentionally separates reveal from transfer:
 * 1. getClaimAmount grants onchain ACL access and returns the receipt handle;
 * 2. grantPermit signs Zama's scoped decryption authorization;
 * 3. claim submits the exact admin-signed encrypted payload to TokenOps.
 */
export function usePrivateClaim(authorization: ClaimAuthorization) {
  const view = useGetClaimAmount({ address: authorization.airdropAddress });
  const claim = useClaim({ address: authorization.airdropAddress });
  const [revealedHandle, setRevealedHandle] = useState<Hex>();

  async function reveal() {
    const result = await view.mutateAsync({
      encryptedInput: authorization.encryptedInput,
      signature: authorization.signature,
    });
    setRevealedHandle(result.handle);
    return {
      handle: result.handle,
      transactionHash: result.hash,
    };
  }

  async function submitClaim() {
    return claim.mutateAsync({
      encryptedInput: authorization.encryptedInput,
      signature: authorization.signature,
    });
  }

  return {
    reveal,
    submitClaim,
    revealedHandle,
    isRevealing: view.isPending,
    isClaiming: claim.isPending,
    error: view.error ?? claim.error,
  };
}
