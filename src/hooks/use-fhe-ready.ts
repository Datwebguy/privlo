import { useZamaSDK } from "@zama-fhe/react-sdk";
import type { RelayerWeb } from "@zama-fhe/sdk";
import { useEffect, useState } from "react";

type RelayerSDKStatus = "idle" | "initializing" | "ready" | "error";

/**
 * Tracks Zama RelayerWeb WASM init. First encrypt can take 30–90s while the
 * worker downloads artifacts from cdn.zama.org — this hook surfaces that state.
 */
export function useFheReady() {
  const zamaSDK = useZamaSDK();
  const relayer = zamaSDK.relayer as RelayerWeb;
  const [status, setStatus] = useState<RelayerSDKStatus>(() => relayer.status);
  const [initError, setInitError] = useState<Error | undefined>(
    () => relayer.initError,
  );
  const [warming, setWarming] = useState(false);

  useEffect(() => {
    setStatus(relayer.status);
    setInitError(relayer.initError);

    const interval = window.setInterval(() => {
      setStatus(relayer.status);
      const err = relayer.initError;
      setInitError(err);
      if (relayer.status === "ready" || relayer.status === "error") {
        window.clearInterval(interval);
      }
    }, 400);

    return () => window.clearInterval(interval);
  }, [relayer]);

  useEffect(() => {
    if (status === "ready" || status === "error" || warming) return;
    let cancelled = false;
    setWarming(true);
    // Touch the relayer so WASM init starts before the user clicks Execute.
    void relayer
      .generateKeypair()
      .catch(() => {
        /* init errors surface via relayer.status / initError */
      })
      .finally(() => {
        if (!cancelled) setWarming(false);
      });
    return () => {
      cancelled = true;
    };
  }, [relayer, status, warming]);

  const ready = status === "ready";
  const busy = status === "initializing" || warming;

  return { ready, busy, status, initError, relayer };
}