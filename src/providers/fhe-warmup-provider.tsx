import { useZamaSDK } from "@zama-fhe/react-sdk";
import type { RelayerWeb } from "@zama-fhe/sdk";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import type { Address } from "viem";
import { useAccount } from "wagmi";
import {
  fheWarmupMessage,
  type FheWarmupPhase,
  waitForRelayerReady,
} from "../hooks/use-fhe-ready";

type FheWarmupContextValue = {
  phase: FheWarmupPhase;
  elapsedSec: number;
  initError?: Error;
  busy: boolean;
  isContractReady: (contractAddress?: Address) => boolean;
  ensureContractReady: (contractAddress?: Address) => Promise<void>;
  retryBootstrap: () => void;
};

const FheWarmupContext = createContext<FheWarmupContextValue | null>(null);

async function bootstrapRelayer(relayer: RelayerWeb): Promise<void> {
  void relayer.getPublicKey().catch(() => undefined);
  await waitForRelayerReady(relayer);
  await relayer.generateKeypair();
}

export function FheWarmupProvider({ children }: PropsWithChildren) {
  const { address } = useAccount();
  const zamaSDK = useZamaSDK();
  const relayer = zamaSDK.relayer as RelayerWeb;
  const bootstrappingRef = useRef(false);
  const readyRef = useRef(false);
  const [phase, setPhase] = useState<FheWarmupPhase>("idle");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [initError, setInitError] = useState<Error>();
  const [readyVersion, setReadyVersion] = useState(0);

  const runBootstrap = useCallback(async () => {
    if (!address || bootstrappingRef.current) return;

    bootstrappingRef.current = true;
    readyRef.current = false;
    setInitError(undefined);
    setPhase(relayer.status === "ready" ? "warming" : "initializing");

    const started = Date.now();
    try {
      await bootstrapRelayer(relayer);
      readyRef.current = true;
      setPhase("ready");
      setInitError(undefined);
    } catch (cause) {
      readyRef.current = false;
      setPhase("error");
      setInitError(
        cause instanceof Error
          ? cause
          : new Error("Could not start the privacy engine."),
      );
    } finally {
      bootstrappingRef.current = false;
      setElapsedSec(Math.floor((Date.now() - started) / 1000));
      setReadyVersion((value) => value + 1);
    }
  }, [address, relayer]);

  useEffect(() => {
    if (!address) {
      readyRef.current = false;
      setPhase("idle");
      setInitError(undefined);
      setElapsedSec(0);
      return;
    }
    void runBootstrap();
  }, [address, runBootstrap]);

  useEffect(() => {
    if (phase !== "initializing" && phase !== "warming") return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  const isContractReady = useCallback(
    (_contractAddress?: Address) => readyRef.current && phase === "ready" && !initError,
    [initError, phase, readyVersion],
  );

  const ensureContractReady = useCallback(
    async (_contractAddress?: Address) => {
      if (!address) {
        throw new Error("Connect a wallet to use confidential encryption.");
      }
      if (isContractReady()) return;

      if (bootstrappingRef.current) {
        await waitForRelayerReady(relayer);
        const started = Date.now();
        while (bootstrappingRef.current && Date.now() - started < 120_000) {
          await new Promise((resolve) => window.setTimeout(resolve, 400));
        }
        if (isContractReady()) return;
      }

      if (phase === "error" || !readyRef.current) {
        await runBootstrap();
      }

      if (!readyRef.current) {
        throw initError ?? new Error("Privacy engine is not ready yet.");
      }
    },
    [address, initError, isContractReady, phase, relayer, runBootstrap],
  );

  const value = useMemo<FheWarmupContextValue>(
    () => ({
      phase,
      elapsedSec,
      initError,
      busy: phase === "initializing" || phase === "warming",
      isContractReady,
      ensureContractReady,
      retryBootstrap: () => void runBootstrap(),
    }),
    [
      elapsedSec,
      ensureContractReady,
      initError,
      isContractReady,
      phase,
      runBootstrap,
    ],
  );

  return (
    <FheWarmupContext.Provider value={value}>
      {children}
    </FheWarmupContext.Provider>
  );
}

export function usePrivloFheWarmup(_contractAddress?: Address) {
  const context = useContext(FheWarmupContext);
  if (!context) {
    throw new Error("usePrivloFheWarmup must be used within FheWarmupProvider");
  }

  const ready = context.isContractReady();
  const ensureReady = useCallback(async () => {
    await context.ensureContractReady();
  }, [context]);

  return useMemo(
    () => ({
      ready,
      busy: context.busy,
      phase: context.phase,
      elapsedSec: context.elapsedSec,
      initError: context.initError,
      ensureReady,
      retryWarmup: context.retryBootstrap,
    }),
    [
      context.busy,
      context.elapsedSec,
      context.initError,
      context.phase,
      context.retryBootstrap,
      ensureReady,
      ready,
    ],
  );
}

export function useFheWarmupStatus() {
  return useContext(FheWarmupContext);
}

export { fheWarmupMessage };