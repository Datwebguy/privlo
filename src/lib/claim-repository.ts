import type { Address } from "viem";
import type { ConfidentialClaim } from "../types/campaign";
import {
  MAX_CLAIMS_PER_RESPONSE,
  parseClaimInbox,
  parseClaims,
} from "./runtime-validation";

const STORAGE_KEY = "privlo:claim-inbox:v1";

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

export async function getClaims(recipient: Address): Promise<ConfidentialClaim[]> {
  const local = readLocalClaims()[recipient.toLowerCase()] ?? [];
  const apiUrl = import.meta.env.VITE_PRIVLO_API_URL;
  if (!apiUrl) return local;

  const response = await fetch(
    `${apiUrl.replace(/\/$/, "")}/claims?recipient=${recipient}`,
    {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok) {
    throw new Error(`Claim inbox returned ${response.status}.`);
  }
  const remote = parseClaims(await response.json());
  const merged = [...remote, ...local];
  return merged
    .filter(
      (claim, index) =>
        merged.findIndex(
          (candidate) =>
            candidate.airdropAddress === claim.airdropAddress &&
            candidate.encryptedInput.handle === claim.encryptedInput.handle,
        ) === index,
    )
    .slice(0, MAX_CLAIMS_PER_RESPONSE);
}

export async function publishClaims(
  claims: Array<{ recipient: Address; claim: ConfidentialClaim }>,
) {
  saveLocalClaims(claims);
  const apiUrl = import.meta.env.VITE_PRIVLO_API_URL;
  if (!apiUrl) return { delivery: "local" as const };

  const response = await fetch(`${apiUrl.replace(/\/$/, "")}/claims`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ claims }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Claim inbox rejected delivery with ${response.status}.`);
  }
  return { delivery: "api" as const };
}

export function removeLocalClaim(recipient: Address, claimId: string) {
  const inbox = readLocalClaims();
  const key = recipient.toLowerCase();
  inbox[key] = (inbox[key] ?? []).filter((claim) => claim.id !== claimId);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inbox));
}
