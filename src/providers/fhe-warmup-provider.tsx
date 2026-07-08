import {
  requireFheAirdropFactoryAddress,
  requireFheDisperseSingletonAddress,
} from "@tokenops/sdk";
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
import { sepolia } from "wagmi/chains";
import {
  fheWarmupMessage,
  type FheWarmupPhase,
  waitForRelayerReady,
  warmContractEncrypt,
} from "../hooks/use-fhe-ready";

type FheWarmupContextValue = {
  phase: FheWarmupPhase;
  elapsedSec: number;
  initError?: Error;
  busy: boolean;
  isContractReady: (contractAddress?: Address) => boolean;
  ensureContractReady: (contractAddress: Address) => Promise<void>;
  retryBootstrap: () => void;
};

const FheWarmupContext = createContext<FheWarmupContextValue | null>(null);

function tokenOpsWarmupContracts(): Address[] {
  return [
    requireFheDisperseSingletonAddress(sepolia.id),
    requireFheAirdropFactoryAddress(sepolia.id),
  ];
}

export function FheWarmupProvider({ children }: PropsWithChildren) {
  const { address } = useAccount();
  const zamaSDK = useZamaSDK();
  const relayer = zamaSDK.relayer as RelayerWeb;
  const warmedContractsRef = useRef(new Set<string>());
  const bootstrappingRef = useRef(false);
  const [phase, setPhase] = useState<FheWarmupPhase>("idle");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [initError, setInitError] = useState<Error>();
  const [warmVersion, setWarmVersion] = useState(0);

  const runBootstrap = useCallback(async () => {
    if (!address || bootstrappingRef.current) return;

    bootstrappingRef.current = true;
    warmedContractsRef.current = new Set();
    setInitError(undefined);
    setPhase(relayer.status === "ready" ? "warming" : "initializing");

    const started = Date.now();
    try {
      void relayer.getPublicKey().catch(() => undefined);
      await waitForRelayerReady(relayer);
      setPhase("warming");
      await relayer.generateKeypair();

      for (const contractAddress of tokenOpsWarmupContracts()) {
        await warmContractEncrypt(relayer, {
          contractAddress,
          userAddress: address,
        });
        warmedContractsRef.current.add(contractAddress.toLowerCase());
      }

      setPhase("ready");
      setInitError(undefined);
    } catch (cause) {
      warmedContractsRef.current = new Set();
      setPhase("error");
      setInitError(
        cause instanceof Error
          ? cause
          : new Error("Could not initialize confidential encryption."),
      );
    } finally {
      bootstrappingRef.current = false;
      setElapsedSec(Math.floor((Date.now() - started) / 1000));
      setWarmVersion((value) => value + 1);
    }
  }, [address, relayer]);

  useEffect(() => {
    if (!address) {
      warmedContractsRef.current = new Set();
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
    (contractAddress?: Address) => {
      if (!contractAddress) return phase === "ready" && !initError;
      return (
        phase === "ready" &&
        !initError &&
        warmedContractsRef.current.has(contractAddress.toLowerCase())
      );
    },
    [initError, phase, warmVersion],
  );

  const ensureContractReady = useCallback(
    async (contractAddress: Address) => {
      if (!address) {
        throw new Error("Connect a wallet to prepare confidential encryption.");
      }
      if (isContractReady(contractAddress)) return;

      if (phase === "error") {
        await runBootstrap();
      } else if (bootstrappingRef.current) {
        await waitForRelayerReady(relayer);
        const started = Date.now();
        while (bootstrappingRef.current && Date.now() - started < 120_000) {
          await new Promise((resolve) => window.setTimeout(resolve, 400));
        }
      }

      if (!warmedContractsRef.current.has(contractAddress.toLowerCase())) {
        setPhase("warming");
        try {
          await warmContractEncrypt(relayer, {
            contractAddress,
            userAddress: address,
          });
          warmedContractsRef.current.add(contractAddress.toLowerCase());
          setPhase("ready");
        } catch (cause) {
          setPhase("error");
          const error =
            cause instanceof Error
              ? cause
              : new Error("Could not warm encryption for this contract.");
          setInitError(error);
          throw error;
        } finally {
          setWarmVersion((value) => value + 1);
        }
      }
    },
    [address, isContractReady, phase, relayer, runBootstrap],
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

export function usePrivloFheWarmup(contractAddress?: Address) {
  const context = useContext(FheWarmupContext);
  if (!context) {
    throw new Error("usePrivloFheWarmup must be used within FheWarmupProvider");
  }

  const ready = context.isContractReady(contractAddress);
  const ensureReady = useCallback(async () => {
    if (!contractAddress) {
      throw new Error("A TokenOps contract is required before encryption.");
    }
    await context.ensureContractReady(contractAddress);
  }, [context, contractAddress]);

  return {
    ready,
    busy: context.busy,
    phase: context.phase,
    elapsedSec: context.elapsedSec,
    initError: context.initError,
    ensureReady,
    retryWarmup: context.retryBootstrap,
  };
}

export function useFheWarmupStatus() {
  const context = useContext(FheWarmupContext);
  return context;
}

export { fheWarmupMessage };