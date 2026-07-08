import type { Address } from "viem";
import type { ConfidentialClaim } from "../types/campaign";
import { isConfidentialClaim } from "./runtime-validation";

const IMPORT_VERSION = 1;

type ClaimImportPayload = {
  v: typeof IMPORT_VERSION;
  recipient: Address;
  claim: ConfidentialClaim;
};

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const mod = padded.length % 4;
  const normalized = mod ? padded + "=".repeat(4 - mod) : padded;
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeClaimImport(
  recipient: Address,
  claim: ConfidentialClaim,
): string {
  const payload: ClaimImportPayload = {
    v: IMPORT_VERSION,
    recipient,
    claim,
  };
  return toBase64Url(JSON.stringify(payload));
}

export function buildClaimImportUrl(
  recipient: Address,
  claim: ConfidentialClaim,
  origin = typeof window !== "undefined" ? window.location.origin : "",
): string {
  const encoded = encodeClaimImport(recipient, claim);
  return `${origin}/app/claims#import=${encoded}`;
}

export function decodeClaimImport(
  encoded: string,
): { recipient: Address; claim: ConfidentialClaim } | undefined {
  try {
    const parsed = JSON.parse(fromBase64Url(encoded)) as unknown;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("v" in parsed) ||
      parsed.v !== IMPORT_VERSION ||
      !("recipient" in parsed) ||
      typeof parsed.recipient !== "string" ||
      !("claim" in parsed) ||
      !isConfidentialClaim(parsed.claim)
    ) {
      return undefined;
    }
    return {
      recipient: parsed.recipient as Address,
      claim: parsed.claim,
    };
  } catch {
    return undefined;
  }
}

export function extractClaimImportPayload(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (!trimmed.includes("/") && !trimmed.includes("?") && !trimmed.includes("#")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const hash = parsed.hash.replace(/^#/, "");
    if (hash.startsWith("import=")) {
      return decodeURIComponent(hash.slice("import=".length));
    }
    const query = parsed.searchParams.get("import");
    if (query) return query;
  } catch {
    // Fall through to raw payload parsing.
  }

  const hashIndex = trimmed.indexOf("#import=");
  if (hashIndex >= 0) {
    return decodeURIComponent(trimmed.slice(hashIndex + "#import=".length));
  }

  return undefined;
}

export function readClaimImportFromLocation(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash.startsWith("import=")) return undefined;
  return decodeURIComponent(hash.slice("import=".length));
}

export function clearClaimImportFromLocation() {
  if (typeof window === "undefined") return;
  if (!window.location.hash.startsWith("#import=")) return;
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`,
  );
}