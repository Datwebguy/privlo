import type { RelayerWeb } from "@zama-fhe/sdk";
import type { Address } from "viem";
import {
  normalizeWarmupBatchSize,
  warmBatchEncrypt,
} from "../hooks/use-fhe-ready";

const DISPERSE_ENCRYPT_ATTEMPTS = 3;
const DISPERSE_RETRY_DELAY_MS = 4_000;

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function isEncryptionTimeout(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes("timed out") || message.includes("timeout");
}

/** Prime batch FHE encrypt for TokenOps disperse — runs only at execute time. */
export async function primeDisperseEncryption({
  relayer,
  singletonAddress,
  userAddress,
  recipientCount,
}: {
  relayer: RelayerWeb;
  singletonAddress: Address;
  userAddress: Address;
  recipientCount: number;
}) {
  const batchSize = normalizeWarmupBatchSize(recipientCount);
  await warmBatchEncrypt(
    relayer,
    { contractAddress: singletonAddress, userAddress },
    batchSize,
  );
}

/** Run disperse with encrypt priming + retries on timeout. */
export async function runDisperseWithEncryptRetry<T>({
  relayer,
  singletonAddress,
  userAddress,
  recipientCount,
  execute,
  onPrime,
}: {
  relayer: RelayerWeb;
  singletonAddress: Address;
  userAddress: Address;
  recipientCount: number;
  execute: () => Promise<T>;
  onPrime?: (attempt: number, total: number) => void;
}): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < DISPERSE_ENCRYPT_ATTEMPTS; attempt += 1) {
    onPrime?.(attempt + 1, DISPERSE_ENCRYPT_ATTEMPTS);
    try {
      await primeDisperseEncryption({
        relayer,
        singletonAddress,
        userAddress,
        recipientCount,
      });
      return await execute();
    } catch (cause) {
      lastError = cause;
      if (
        isEncryptionTimeout(cause) &&
        attempt < DISPERSE_ENCRYPT_ATTEMPTS - 1
      ) {
        await sleep(DISPERSE_RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      throw cause;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Distribution encryption failed.");
}