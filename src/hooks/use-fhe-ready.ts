import { useZamaSDK } from "@zama-fhe/react-sdk";
import type { RelayerWeb } from "@zama-fhe/sdk";
import { useEffect, useRef, useState } from "react";
import type { Address } from "viem";

type RelayerSDKStatus = "idle" | "initializing" | "ready" | "error";

export type FheWarmupTarget = {
  contractAddress: Address;
  userAddress: Address;
};

/**
 * Warms the Zama FHE worker before TokenOps encrypt.
 * ENCRYPT requests time out at 30s; cold WASM init can exceed that unless we
 * pre-initialize with generateKeypair + a throwaway encrypt first.
 */
export function useFheReady(target?: FheWarmupTarget) {
  const zamaSDK = useZamaSDK();
  const relayer = zamaSDK.relayer as RelayerWeb;
  const warmedRef = useRef(false);
  const [status, setStatus] = useState<RelayerSDKStatus>(() => relayer.status);
  const [initError, setInitError] = useState<Error | undefined>(
    () => relayer.initError,
  );
  const [warming, setWarming] = useState(false);
  const [ready, setReady] = useState(() => relayer.status === "ready");

  useEffect(() => {
    setStatus(relayer.status);
    setInitError(relayer.initError);
    if (relayer.status === "ready") setReady(true);
  }, [relayer]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStatus(relayer.status);
      setInitError(relayer.initError ?? undefined);
      if (relayer.status === "ready") setReady(true);
    }, 400);
    return () => window.clearInterval(interval);
  }, [relayer]);

  useEffect(() => {
    if (!target || warmedRef.current) return;
    let cancelled = false;
    setWarming(true);
    setReady(false);

    async function warmup() {
      const warmupTarget = target;
      if (!warmupTarget) return;
      try {
        await relayer.generateKeypair();
        await relayer.encrypt({
          values: [{ value: 1n, type: "euint64" }],
          contractAddress: warmupTarget.contractAddress,
          userAddress: warmupTarget.userAddress,
        });
        if (!cancelled) {
          warmedRef.current = true;
          setReady(true);
          setInitError(undefined);
        }
      } catch (cause) {
        if (!cancelled) {
          setInitError(
            cause instanceof Error
              ? cause
              : new Error("Could not initialize confidential encryption."),
          );
          setReady(false);
        }
      } finally {
        if (!cancelled) setWarming(false);
      }
    }

    void warmup();
    return () => {
      cancelled = true;
    };
  }, [relayer, target?.contractAddress, target?.userAddress]);

  const busy = warming || status === "initializing";

  return { ready: ready && !initError, busy, status, initError, relayer };
}