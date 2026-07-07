export interface StoredClaim {
  id: string;
  recipient: `0x${string}`;
  creator: `0x${string}`;
  campaignName: string;
  tokenAddress: `0x${string}`;
  tokenSymbol?: string;
  airdropAddress: `0x${string}`;
  encryptedInput: {
    handle: `0x${string}`;
    inputProof: `0x${string}`;
  };
  signature: `0x${string}`;
  createdAt: number;
  claimedAt?: number;
  claimTransactionHash?: `0x${string}`;
}

export interface PublishClaimInput {
  id: string;
  recipient: `0x${string}`;
  campaignName: string;
  tokenAddress: `0x${string}`;
  tokenSymbol?: string;
  airdropAddress: `0x${string}`;
  encryptedInput: {
    handle: `0x${string}`;
    inputProof: `0x${string}`;
  };
  signature: `0x${string}`;
  createdAt: number;
}