export type CampaignType = "disperse" | "airdrop" | "vesting";
export type CampaignStatus = "confirmed";

export interface Campaign {
  id: string;
  creator: `0x${string}`;
  name: string;
  type: CampaignType;
  tokenAddress: `0x${string}`;
  tokenSymbol?: string;
  recipients: number;
  createdAt: number;
  status: CampaignStatus;
  transactionHash: `0x${string}`;
  chainId: number;
}

export interface RecipientAllocation {
  id: string;
  address: `0x${string}`;
  amount: string;
}

export interface ConfidentialClaim {
  id: string;
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
