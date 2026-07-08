import { getAddress, isAddress, isHex } from "viem";
import {
  FORBIDDEN_PAYLOAD_KEYS,
  MAX_CAMPAIGN_NAME_LENGTH,
  MAX_CLAIM_ID_LENGTH,
  MAX_CLAIMS_PER_REQUEST,
  MAX_MESSAGE_LENGTH,
} from "./constants.js";
import type { PublishClaimInput } from "./types.js";

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
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isAddressText(value: unknown): value is `0x${string}` {
  return typeof value === "string" && isAddress(value);
}

function isHexText(value: unknown): value is `0x${string}` {
  return typeof value === "string" && isHex(value, { strict: true });
}

export function normalizeAddress(value: string): `0x${string}` {
  return getAddress(value).toLowerCase() as `0x${string}`;
}

export function containsForbiddenAmountFields(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => containsForbiddenAmountFields(item));
  }
  if (!isRecord(value)) return false;
  for (const [key, nested] of Object.entries(value)) {
    if (FORBIDDEN_PAYLOAD_KEYS.has(key.toLowerCase())) return true;
    if (containsForbiddenAmountFields(nested)) return true;
  }
  return false;
}

export function parseSignaturePayload(value: unknown):
  | {
      address: `0x${string}`;
      message: string;
      signature: `0x${string}`;
    }
  | null {
  if (!isRecord(value)) return null;
  if (
    !isAddressText(value.address) &&
    !isAddressText(value.creator) &&
    !isAddressText(value.recipient)
  ) {
    return null;
  }
  const address = (value.address ?? value.creator ?? value.recipient) as string;
  if (
    !isSafeText(value.message, MAX_MESSAGE_LENGTH) ||
    !isHexText(value.signature) ||
    !isAddressText(address)
  ) {
    return null;
  }
  return {
    address: getAddress(address),
    message: value.message,
    signature: value.signature,
  };
}

export function parsePublishClaim(value: unknown): PublishClaimInput | null {
  if (!isRecord(value) || !isRecord(value.encryptedInput)) return null;
  if (
    !isSafeText(value.id, MAX_CLAIM_ID_LENGTH) ||
    !isAddressText(value.recipient) ||
    !isSafeText(value.campaignName, MAX_CAMPAIGN_NAME_LENGTH) ||
    !isAddressText(value.tokenAddress) ||
    (value.tokenSymbol !== undefined &&
      !isSafeText(value.tokenSymbol, 32)) ||
    !isAddressText(value.airdropAddress) ||
    !isHexText(value.encryptedInput.handle) ||
    !isHexText(value.encryptedInput.inputProof) ||
    !isHexText(value.signature) ||
    !isTimestamp(value.createdAt)
  ) {
    return null;
  }
  return {
    id: value.id,
    recipient: getAddress(value.recipient),
    campaignName: value.campaignName,
    tokenAddress: getAddress(value.tokenAddress),
    tokenSymbol: value.tokenSymbol,
    airdropAddress: getAddress(value.airdropAddress),
    encryptedInput: {
      handle: value.encryptedInput.handle,
      inputProof: value.encryptedInput.inputProof,
    },
    signature: value.signature,
    createdAt: value.createdAt,
  };
}

export function parsePublishBody(value: unknown):
  | {
      creator: `0x${string}`;
      message: string;
      signature: `0x${string}`;
      claims: PublishClaimInput[];
    }
  | null {
  if (!isRecord(value)) return null;
  if (
    !isAddressText(value.creator) ||
    !isSafeText(value.message, MAX_MESSAGE_LENGTH) ||
    !isHexText(value.signature) ||
    !Array.isArray(value.claims)
  ) {
    return null;
  }
  if (value.claims.length === 0 || value.claims.length > MAX_CLAIMS_PER_REQUEST) {
    return null;
  }
  const claims = value.claims.map(parsePublishClaim);
  if (claims.some((claim) => claim === null)) return null;
  return {
    creator: getAddress(value.creator),
    message: value.message,
    signature: value.signature,
    claims: claims as PublishClaimInput[],
  };
}

export function parseMarkClaimedBody(value: unknown):
  | {
      recipient: `0x${string}`;
      claimId: string;
      transactionHash: `0x${string}`;
      message: string;
      signature: `0x${string}`;
    }
  | null {
  if (!isRecord(value)) return null;
  if (
    !isAddressText(value.recipient) ||
    !isSafeText(value.claimId, MAX_CLAIM_ID_LENGTH) ||
    !isHexText(value.transactionHash) ||
    !isSafeText(value.message, MAX_MESSAGE_LENGTH) ||
    !isHexText(value.signature)
  ) {
    return null;
  }
  return {
    recipient: getAddress(value.recipient),
    claimId: value.claimId,
    transactionHash: value.transactionHash,
    message: value.message,
    signature: value.signature,
  };
}