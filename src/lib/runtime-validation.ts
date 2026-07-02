import { isAddress, isHex } from "viem";
import type { Campaign, ConfidentialClaim } from "../types/campaign";

export const MAX_CAMPAIGN_NAME_LENGTH = 80;
export const MAX_RECIPIENTS = 500;
export const MAX_CSV_BYTES = 1_000_000;
export const MAX_AMOUNT_INPUT_LENGTH = 80;
export const MAX_CLAIMS_PER_RESPONSE = 500;
export const MAX_CAMPAIGNS_PER_RESPONSE = 500;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeText(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= maxLength
  );
}

function isTimestamp(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}

function isAddressText(value: unknown): value is `0x${string}` {
  return typeof value === "string" && isAddress(value);
}

function isHexText(value: unknown): value is `0x${string}` {
  return typeof value === "string" && isHex(value, { strict: true });
}

export function isCampaign(value: unknown): value is Campaign {
  if (!isRecord(value)) return false;
  return (
    isSafeText(value.id, 160) &&
    isAddressText(value.creator) &&
    isSafeText(value.name, MAX_CAMPAIGN_NAME_LENGTH) &&
    (value.type === "disperse" ||
      value.type === "airdrop" ||
      value.type === "vesting") &&
    isAddressText(value.tokenAddress) &&
    (value.tokenSymbol === undefined || isSafeText(value.tokenSymbol, 32)) &&
    typeof value.recipients === "number" &&
    Number.isSafeInteger(value.recipients) &&
    value.recipients > 0 &&
    value.recipients <= MAX_RECIPIENTS &&
    isTimestamp(value.createdAt) &&
    value.status === "confirmed" &&
    isHexText(value.transactionHash) &&
    typeof value.chainId === "number" &&
    Number.isSafeInteger(value.chainId)
  );
}

export function parseCampaigns(value: unknown): Campaign[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isCampaign).slice(0, MAX_CAMPAIGNS_PER_RESPONSE);
}

export function isConfidentialClaim(
  value: unknown,
): value is ConfidentialClaim {
  if (!isRecord(value) || !isRecord(value.encryptedInput)) return false;
  return (
    isSafeText(value.id, 320) &&
    isSafeText(value.campaignName, MAX_CAMPAIGN_NAME_LENGTH) &&
    isAddressText(value.tokenAddress) &&
    (value.tokenSymbol === undefined || isSafeText(value.tokenSymbol, 32)) &&
    isAddressText(value.airdropAddress) &&
    isHexText(value.encryptedInput.handle) &&
    isHexText(value.encryptedInput.inputProof) &&
    isHexText(value.signature) &&
    isTimestamp(value.createdAt)
  );
}

export function parseClaims(value: unknown): ConfidentialClaim[] {
  if (!Array.isArray(value)) {
    throw new Error("Claim inbox returned an invalid payload.");
  }
  if (value.length > MAX_CLAIMS_PER_RESPONSE) {
    throw new Error("Claim inbox returned too many records.");
  }
  const claims = value.filter(isConfidentialClaim);
  if (claims.length !== value.length) {
    throw new Error("Claim inbox returned malformed authorization data.");
  }
  return claims;
}

export function parseClaimInbox(
  value: unknown,
): Record<string, ConfidentialClaim[]> {
  if (!isRecord(value)) return {};
  const inbox: Record<string, ConfidentialClaim[]> = {};
  for (const [recipient, claims] of Object.entries(value)) {
    if (!isAddressText(recipient) || !Array.isArray(claims)) continue;
    inbox[recipient.toLowerCase()] = claims
      .filter(isConfidentialClaim)
      .slice(0, MAX_CLAIMS_PER_RESPONSE);
  }
  return inbox;
}
