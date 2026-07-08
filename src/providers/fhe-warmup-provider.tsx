import {
  getConfidentialTestTokenAddress,
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
  normalizeWarmupBatchSize,
  type FheWarmupPhase,
  waitForRelayerReady,
  warmBatchEncrypt,
  warmContractEncrypt,
} from "../hooks/use-fhe-ready";

type WarmupOptions = {
  batchSize?: number;
};

type FheWarmupContextValue = {
  phase: FheWarmupPhase;
  elapsedSec: number;
  initError?: Error;
  busy: boolean;
  isContractReady: (contractAddress?: Address, minBatchSize?: number) => boolean;
  ensureContractReady: (
    contractAddress: Address,
    options?: WarmupOptions,
  ) => Promise<void>;
  retryBootstrap: () => void;
};

const FheWarmupContext = createContext<FheWarmupContextValue | null>(null);

function tokenOpsWarmupContracts(): Array<{
  contractAddress: Address;
  batchSize: number;
}> {
  const contracts: Array<{ contractAddress: Address; batchSize: number }> = [
    {
      contractAddress: requireFheDisperseSingletonAddress(sepolia.id),
      batchSize: 3,
    },
    {
      contractAddress: requireFheAirdropFactoryAddress(sepolia.id),
      batchSize: 1,
    },
  ];

  const demoToken = getConfidentialTestTokenAddress(sepolia.id);
  if (demoToken) {
    contracts.push({ contractAddress: demoToken, batchSize: 1 });
  }

  return contracts;
}

export function FheWarmupProvider({ children }: PropsWithChildren) {
  const { address } = useAccount();
  const zamaSDK = useZamaSDK();
  const relayer = zamaSDK.relayer as RelayerWeb;
  const warmedBatchSizesRef = useRef(new Map<string, number>());
  const bootstrappingRef = useRef(false);
  const [phase, setPhase] = useState<FheWarmupPhase>("idle");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [initError, setInitError] = useState<Error>();
  const [warmVersion, setWarmVersion] = useState(0);

  const warmContract = useCallback(
    async (
      contractAddress: Address,
      userAddress: Address,
      batchSize = 1,
    ): Promise<void> => {
      const target = { contractAddress, userAddress };
      const normalizedBatch = normalizeWarmupBatchSize(batchSize);
      if (normalizedBatch > 1) {
        await warmBatchEncrypt(relayer, target, normalizedBatch);
      } else {
        await warmContractEncrypt(relayer, target);
      }
      const key = contractAddress.toLowerCase();
      const previous = warmedBatchSizesRef.current.get(key) ?? 0;
      warmedBatchSizesRef.current.set(
        key,
        Math.max(previous, normalizedBatch),
      );
    },
    [relayer],
  );

  const runBootstrap = useCallback(async () => {
    if (!address || bootstrappingRef.current) return;

    bootstrappingRef.current = true;
    warmedBatchSizesRef.current = new Map();
    setInitError(undefined);
    setPhase(relayer.status === "ready" ? "warming" : "initializing");

    const started = Date.now();
    try {
      void relayer.getPublicKey().catch(() => undefined);
      await waitForRelayerReady(relayer);
      setPhase("warming");
      await relayer.generateKeypair();

      for (const item of tokenOpsWarmupContracts()) {
        await warmContract(item.contractAddress, address, item.batchSize);
      }

      setPhase("ready");
      setInitError(undefined);
    } catch (cause) {
      warmedBatchSizesRef.current = new Map();
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
  }, [address, relayer, warmContract]);

  useEffect(() => {
    if (!address) {
      warmedBatchSizesRef.current = new Map();
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
    (contractAddress?: Address, minBatchSize = 1) => {
      if (!contractAddress) {
        return phase === "ready" && !initError;
      }
      const warmedBatch =
        warmedBatchSizesRef.current.get(contractAddress.toLowerCase()) ?? 0;
      return (
        phase === "ready" &&
        !initError &&
        warmedBatch >= normalizeWarmupBatchSize(minBatchSize)
      );
    },
    [initError, phase, warmVersion],
  );

  const ensureContractReady = useCallback(
    async (contractAddress: Address, options?: WarmupOptions) => {
      if (!address) {
        throw new Error("Connect a wallet to prepare confidential encryption.");
      }

      const requiredBatch = normalizeWarmupBatchSize(options?.batchSize ?? 1);
      if (isContractReady(contractAddress, requiredBatch)) return;

      if (phase === "error") {
        await runBootstrap();
      } else if (bootstrappingRef.current) {
        await waitForRelayerReady(relayer);
        const started = Date.now();
        while (bootstrappingRef.current && Date.now() - started < 120_000) {
          await new Promise((resolve) => window.setTimeout(resolve, 400));
        }
      }

      if (!isContractReady(contractAddress, requiredBatch)) {
        setPhase("warming");
        try {
          await warmContract(contractAddress, address, requiredBatch);
          setPhase("ready");
          setInitError(undefined);
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
    [address, isContractReady, phase, relayer, runBootstrap, warmContract],
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

type EnsureReadyOptions = WarmupOptions & {
  alsoWarm?: Address[];
};

export function usePrivloFheWarmup(
  contractAddress?: Address,
  options?: { minBatchSize?: number },
) {
  const context = useContext(FheWarmupContext);
  if (!context) {
    throw new Error("usePrivloFheWarmup must be used within FheWarmupProvider");
  }

  const minBatchSize = normalizeWarmupBatchSize(options?.minBatchSize ?? 1);
  const ready = context.isContractReady(contractAddress, minBatchSize);
  const ensureReady = useCallback(
    async (ensureOptions?: EnsureReadyOptions) => {
      if (contractAddress) {
        await context.ensureContractReady(contractAddress, {
          batchSize: ensureOptions?.batchSize ?? minBatchSize,
        });
      }
      for (const address of ensureOptions?.alsoWarm ?? []) {
        await context.ensureContractReady(address);
      }
    },
    [context, contractAddress, minBatchSize],
  );

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
  const context = useContext(FheWarmupContext);
  return context;
}

export { fheWarmupMessage };