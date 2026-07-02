import {
  createSepoliaEncryptorWeb,
  type SepoliaEncryptorWeb,
} from "@tokenops/sdk/fhe";
import { useEffect, useState } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import { sepolia } from "wagmi/chains";

export function useTokenOpsEncryptor() {
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const walletClient = useWalletClient({ chainId: sepolia.id });
  const [encryptor, setEncryptor] = useState<SepoliaEncryptorWeb>();
  const [error, setError] = useState<Error>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!publicClient || !walletClient.data) {
      setEncryptor(undefined);
      return;
    }

    let disposed = false;
    let current: SepoliaEncryptorWeb | undefined;
    setIsLoading(true);
    setError(undefined);

    void createSepoliaEncryptorWeb({
      publicClient,
      walletClient: walletClient.data,
    })
      .then((instance) => {
        current = instance;
        if (disposed) {
          instance.terminate();
          return;
        }
        setEncryptor(instance);
      })
      .catch((cause: unknown) => {
        if (!disposed) {
          setError(
            cause instanceof Error
              ? cause
              : new Error("Could not initialize Zama encryption."),
          );
        }
      })
      .finally(() => {
        if (!disposed) setIsLoading(false);
      });

    return () => {
      disposed = true;
      current?.terminate();
    };
  }, [publicClient, walletClient.data]);

  return { encryptor, error, isLoading };
}
