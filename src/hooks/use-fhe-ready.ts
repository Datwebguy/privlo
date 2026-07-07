import { useZamaSDK } from "@zama-fhe/react-sdk";
import type { RelayerWeb } from "@zama-fhe/sdk";
import { useEffect, useState } from "react";

type RelayerSDKStatus = "idle" | "initializing" | "ready" | "error";

/**
 * Surfaces Zama RelayerWeb WASM init state. First encrypt can take 30–90s
 * while artifacts download from cdn.zama.org — does not trigger encrypt itself.
 */
export function useFheReady() {
  const zamaSDK = useZamaSDK();
  const relayer = zamaSDK.relayer as RelayerWeb;
  const [status, setStatus] = useState<RelayerSDKStatus>(() => relayer.status);
  const [initError, setInitError] = useState<Error | undefined>(
    () => relayer.initError,
  );

  useEffect(() => {
    setStatus(relayer.status);
    setInitError(relayer.initError);

    const interval = window.setInterval(() => {
      setStatus(relayer.status);
      setInitError(relayer.initError ?? undefined);
      if (relayer.status === "ready" || relayer.status === "error") {
        window.clearInterval(interval);
      }
    }, 500);

    return () => window.clearInterval(interval);
  }, [relayer]);

  const ready = status === "ready";
  const busy = status === "initializing";

  return { ready, busy, status, initError, relayer };
}