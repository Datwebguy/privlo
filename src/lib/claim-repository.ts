import type { Address, Hex } from "viem";
import type { ConfidentialClaim } from "../types/campaign";
import {
  markClaimedMessage,
  publishClaimsMessage,
  viewClaimsMessage,
} from "./claim-messages";
import {
  MAX_CLAIMS_PER_RESPONSE,
  parseClaimInbox,
  parseClaims,
} from "./runtime-validation";

const STORAGE_KEY = "privlo:claim-inbox:v1";
const VIEW_CLAIMS_SIG_TTL_MS = 60 * 60 * 1000;

export type SignMessageFn = (message: string) => Promise<Hex>;

type CachedViewClaimsSignature = {
  message: string;
  signature: Hex;
  expiresAt: number;
};

function viewClaimsSignatureKey(recipient: Address) {
  return `privlo:view-claims-sig:${recipient.toLowerCase()}`;
}

async function signViewClaimsMessage(
  recipient: Address,
  signMessage: SignMessageFn,
): Promise<Hex> {
  const message = viewClaimsMessage(recipient);
  const cacheKey = viewClaimsSignatureKey(recipient);

  if (typeof window !== "undefined") {
    try {
      const raw = window.sessionStorage.getItem(cacheKey);
      if (raw) {
        const cached = JSON.parse(raw) as CachedViewClaimsSignature;
        if (
          cached.message === message &&
          cached.expiresAt > Date.now() &&
          typeof cached.signature === "string"
        ) {
          return cached.signature;
        }
      }
    } catch {
      // Ignore corrupt cache entries.
    }
  }

  const signature = await signMessage(message);

  if (typeof window !== "undefined") {
    try {
      const cached: CachedViewClaimsSignature = {
        message,
        signature,
        expiresAt: Date.now() + VIEW_CLAIMS_SIG_TTL_MS,
      };
      window.sessionStorage.setItem(cacheKey, JSON.stringify(cached));
    } catch {
      // sessionStorage may be unavailable in private mode.
    }
  }

  return signature;
}

function apiBaseUrl(): string | undefined {
  const configured = import.meta.env.VITE_PRIVLO_API_URL?.trim();
  return configured ? configured.replace(/\/$/, "") : undefined;
}

function readLocalClaims(): Record<string, ConfidentialClaim[]> {
  if (typeof window === "undefined") return {};
  try {
    return parseClaimInbox(
      JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}"),
    );
  } catch {
    return {};
  }
}

export function saveLocalClaims(
  claimsByRecipient: Array<{
    recipient: Address;
    claim: ConfidentialClaim;
  }>,
) {
  const inbox = readLocalClaims();
  for (const { recipient, claim } of claimsByRecipient) {
    const key = recipient.toLowerCase();
    const previous = inbox[key] ?? [];
    inbox[key] = [
      claim,
      ...previous.filter(
        (item) =>
          !(
            item.airdropAddress === claim.airdropAddress &&
            item.encryptedInput.handle === claim.encryptedInput.handle
          ),
      ),
    ].slice(0, MAX_CLAIMS_PER_RESPONSE);
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inbox));
}

function mergeClaims(
  remote: ConfidentialClaim[],
  local: ConfidentialClaim[],
): ConfidentialClaim[] {
  const merged = [...remote, ...local];
  return merged
    .filter(
      (claim, index) =>
        merged.findIndex(
          (candidate) =>
            candidate.id === claim.id ||
            (candidate.airdropAddress === claim.airdropAddress &&
              candidate.encryptedInput.handle === claim.encryptedInput.handle),
        ) === index,
    )
    .slice(0, MAX_CLAIMS_PER_RESPONSE);
}

async function fetchRemoteClaims(
  recipient: Address,
  signMessage: SignMessageFn,
): Promise<ConfidentialClaim[]> {
  const apiUrl = apiBaseUrl();
  if (!apiUrl) return [];

  const message = viewClaimsMessage(recipient);
  const signature = await signViewClaimsMessage(recipient, signMessage);
  const response = await fetch(`${apiUrl}/claims/me`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recipient, message, signature }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error("Claim inbox is unavailable.");
  }
  const payload = (await response.json()) as { claims?: unknown };
  return parseClaims(payload.claims);
}

export type ClaimsInboxResult = {
  claims: ConfidentialClaim[];
  remoteUnavailable: boolean;
};

/** Load claims from this browser only — never prompts the wallet. */
export function getLocalClaimsInbox(recipient: Address): ClaimsInboxResult {
  const local = readLocalClaims()[recipient.toLowerCase()] ?? [];
  return { claims: local, remoteUnavailable: false };
}

/** @deprecated Use getLocalClaimsInbox — remote sync is opt-in via syncRemoteClaimsInbox. */
export async function getClaims(recipient: Address): Promise<ClaimsInboxResult> {
  return getLocalClaimsInbox(recipient);
}

/** Optional cloud inbox sync for airdrops — may prompt the wallet once per session. */
export async function syncRemoteClaimsInbox(
  recipient: Address,
  signMessage: SignMessageFn,
): Promise<ClaimsInboxResult> {
  const local = readLocalClaims()[recipient.toLowerCase()] ?? [];
  const apiUrl = apiBaseUrl();
  if (!apiUrl) {
    return { claims: local, remoteUnavailable: false };
  }

  try {
    const remote = await fetchRemoteClaims(recipient, signMessage);
    return { claims: mergeClaims(remote, local), remoteUnavailable: false };
  } catch {
    return { claims: local, remoteUnavailable: true };
  }
}

export function importClaimForRecipient(params: {
  recipient: Address;
  claim: ConfidentialClaim;
}) {
  saveLocalClaims([
    {
      recipient: params.recipient,
      claim: params.claim,
    },
  ]);
}

export async function publishClaims(params: {
  creator: Address;
  campaignName: string;
  signMessage: SignMessageFn;
  claims: Array<{ recipient: Address; claim: ConfidentialClaim }>;
}) {
  const { creator, campaignName, signMessage, claims } = params;
  saveLocalClaims(claims);

  const apiUrl = apiBaseUrl();
  if (!apiUrl) return { delivery: "local" as const };

  const message = publishClaimsMessage(campaignName);
  const signature = await signMessage(message);
  const response = await fetch(`${apiUrl}/claims/publish`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      creator,
      message,
      signature,
      claims: claims.map(({ recipient, claim }) => ({
        id: claim.id,
        recipient,
        campaignName: claim.campaignName,
        tokenAddress: claim.tokenAddress,
        tokenSymbol: claim.tokenSymbol,
        airdropAddress: claim.airdropAddress,
        encryptedInput: claim.encryptedInput,
        signature: claim.signature,
        createdAt: claim.createdAt,
      })),
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error("Claim inbox rejected encrypted claim delivery.");
  }
  return { delivery: "api" as const };
}

export async function markClaimClaimed(params: {
  recipient: Address;
  claimId: string;
  transactionHash: Hex;
  signMessage: SignMessageFn;
}) {
  const { recipient, claimId, transactionHash, signMessage } = params;
  removeLocalClaim(recipient, claimId);

  const apiUrl = apiBaseUrl();
  if (!apiUrl) return { delivery: "local" as const };

  const message = markClaimedMessage(recipient, claimId);
  const signature = await signMessage(message);
  const response = await fetch(`${apiUrl}/claims/mark-claimed`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipient,
      claimId,
      transactionHash,
      message,
      signature,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error("Claim inbox could not record the onchain claim.");
  }
  return { delivery: "api" as const };
}

export function removeLocalClaim(recipient: Address, claimId: string) {
  const inbox = readLocalClaims();
  const key = recipient.toLowerCase();
  inbox[key] = (inbox[key] ?? []).filter((claim) => claim.id !== claimId);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inbox));
}