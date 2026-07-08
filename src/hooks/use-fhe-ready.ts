import { useZamaSDK } from "@zama-fhe/react-sdk";
import type { RelayerWeb } from "@zama-fhe/sdk";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Address } from "viem";

type RelayerSDKStatus = "idle" | "initializing" | "ready" | "error";

export type FheWarmupTarget = {
  contractAddress: Address;
  userAddress: Address;
};

export type FheWarmupPhase =
  | "idle"
  | "initializing"
  | "warming"
  | "ready"
  | "error";

const WARMUP_MAX_ATTEMPTS = 4;
const RELAYER_READY_TIMEOUT_MS = 120_000;
const WARMUP_RETRY_DELAY_MS = 2_500;
const WARMUP_MAX_BATCH_SIZE = 64;

export function normalizeWarmupBatchSize(batchSize = 1) {
  const size = Math.floor(batchSize);
  if (!Number.isFinite(size) || size < 1) return 1;
  return Math.min(size, WARMUP_MAX_BATCH_SIZE);
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isEncryptTimeout(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes("timed out") || message.includes("timeout");
}

export async function waitForRelayerReady(
  relayer: RelayerWeb,
  timeoutMs = RELAYER_READY_TIMEOUT_MS,
): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const current = relayer.status;
    if (current === "ready") return;
    if (current === "error") {
      throw relayer.initError ?? new Error("FHE worker failed to initialize.");
    }
    await sleep(400);
  }

  throw new Error(
    "Secure encryption is still loading. Keep this tab open, then refresh if needed.",
  );
}

export async function warmContractEncrypt(
  relayer: RelayerWeb,
  target: FheWarmupTarget,
): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < WARMUP_MAX_ATTEMPTS; attempt += 1) {
    try {
      await relayer.encrypt({
        values: [{ value: 1n, type: "euint64" }],
        contractAddress: target.contractAddress,
        userAddress: target.userAddress,
      });
      return;
    } catch (cause) {
      lastError = cause;
      if (isEncryptTimeout(cause) && attempt < WARMUP_MAX_ATTEMPTS - 1) {
        await sleep(WARMUP_RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      throw cause;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Could not initialize confidential encryption.");
}

/** Warm batch encryption — matches TokenOps disperse `encryptUint64Batch`. */
export async function warmBatchEncrypt(
  relayer: RelayerWeb,
  target: FheWarmupTarget,
  batchSize = 3,
): Promise<void> {
  const size = normalizeWarmupBatchSize(batchSize);
  await warmContractEncrypt(relayer, target);
  if (size <= 1) return;

  let lastError: unknown;
  for (let attempt = 0; attempt < WARMUP_MAX_ATTEMPTS; attempt += 1) {
    try {
      await relayer.encrypt({
        values: Array.from({ length: size }, () => ({
          value: 1n,
          type: "euint64",
        })),
        contractAddress: target.contractAddress,
        userAddress: target.userAddress,
      });
      return;
    } catch (cause) {
      lastError = cause;
      if (isEncryptTimeout(cause) && attempt < WARMUP_MAX_ATTEMPTS - 1) {
        await sleep(WARMUP_RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      throw cause;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Could not initialize batch confidential encryption.");
}

/** Full warmup: worker ready + keypair + encrypt (used for isolated flows). */
export async function warmFheEncryption(
  relayer: RelayerWeb,
  target: FheWarmupTarget,
): Promise<void> {
  await waitForRelayerReady(relayer);

  let lastError: unknown;
  for (let attempt = 0; attempt < WARMUP_MAX_ATTEMPTS; attempt += 1) {
    try {
      await relayer.generateKeypair();
      await warmContractEncrypt(relayer, target);
      return;
    } catch (cause) {
      lastError = cause;
      if (isEncryptTimeout(cause) && attempt < WARMUP_MAX_ATTEMPTS - 1) {
        await sleep(WARMUP_RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      throw cause;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Could not initialize confidential encryption.");
}

/**
 * Local FHE warmup hook — prefer usePrivloFheWarmup from FheWarmupProvider
 * when inside the /app shell (global background preload).
 */
export function useFheReady(target?: FheWarmupTarget) {
  const zamaSDK = useZamaSDK();
  const relayer = zamaSDK.relayer as RelayerWeb;
  const warmedRef = useRef(false);
  const warmingRef = useRef(false);
  const [status, setStatus] = useState<RelayerSDKStatus>(() => relayer.status);
  const [initError, setInitError] = useState<Error | undefined>(
    () => relayer.initError,
  );
  const [phase, setPhase] = useState<FheWarmupPhase>(() =>
    warmedRef.current ? "ready" : "idle",
  );
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    setStatus(relayer.status);
    setInitError(relayer.initError ?? undefined);
  }, [relayer, relayer.status, relayer.initError]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStatus(relayer.status);
      setInitError(relayer.initError ?? undefined);
    }, 400);
    return () => window.clearInterval(interval);
  }, [relayer]);

  const runWarmup = useCallback(
    async (force = false) => {
      if (!target) return;
      if (warmedRef.current && !force) return;
      if (warmingRef.current) return;

      warmingRef.current = true;
      setInitError(undefined);
      setPhase(relayer.status === "ready" ? "warming" : "initializing");
      const started = Date.now();

      try {
        await warmFheEncryption(relayer, target);
        warmedRef.current = true;
        setPhase("ready");
        setInitError(undefined);
      } catch (cause) {
        warmedRef.current = false;
        setPhase("error");
        setInitError(
          cause instanceof Error
            ? cause
            : new Error("Could not initialize confidential encryption."),
        );
      } finally {
        warmingRef.current = false;
        setElapsedSec(Math.floor((Date.now() - started) / 1000));
      }
    },
    [relayer, target],
  );

  useEffect(() => {
    if (!target) {
      warmedRef.current = false;
      setPhase("idle");
      return;
    }

    warmedRef.current = false;
    setPhase("idle");
    void runWarmup();
  }, [target?.contractAddress, target?.userAddress, runWarmup]);

  useEffect(() => {
    if (phase !== "initializing" && phase !== "warming") return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  const ensureReady = useCallback(async () => {
    if (!target) {
      throw new Error("Connect a wallet to prepare confidential encryption.");
    }
    if (warmedRef.current) return;
    await runWarmup(true);
    if (!warmedRef.current) {
      throw initError ?? new Error("Privacy engine is not ready yet.");
    }
  }, [initError, runWarmup, target]);

  const busy =
    phase === "initializing" ||
    phase === "warming" ||
    status === "initializing";

  return {
    ready: phase === "ready" && !initError,
    busy,
    phase,
    elapsedSec,
    status,
    initError,
    relayer,
    ensureReady,
    retryWarmup: () => runWarmup(true),
  };
}

export function fheWarmupMessage(phase: FheWarmupPhase, elapsedSec: number) {
  if (phase === "initializing") {
    return `Loading secure encryption in the background… ${elapsedSec}s`;
  }
  if (phase === "warming") {
    return `Almost ready — finishing encryption setup… ${elapsedSec}s`;
  }
  return "";
}