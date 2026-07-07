import { getAddress, type Address } from "viem";

export function publishClaimsMessage(campaignName: string) {
  return `Privlo publish claims for campaign ${campaignName}`;
}

export function viewClaimsMessage(recipient: Address) {
  return `Privlo view claims for ${getAddress(recipient)}`;
}

export function markClaimedMessage(recipient: Address, claimId: string) {
  return `Privlo mark claim claimed ${claimId} for ${getAddress(recipient)}`;
}