import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  indexedDBStorage,
  RelayerWeb,
  SepoliaConfig,
  ZamaProvider,
} from "@zama-fhe/react-sdk";
import { ViemSigner } from "@zama-fhe/sdk/viem";
import { useMemo, useState, type PropsWithChildren } from "react";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { sepolia } from "viem/chains";
import { WagmiProvider } from "wagmi";
import { rpcUrl, wagmiConfig } from "../config/chains";

export function Web3Provider({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 12_000, retry: 1 },
        },
      }),
  );
  const { relayer, signer } = useMemo(() => {
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    });
    const walletClient =
      typeof window !== "undefined" && window.ethereum
        ? createWalletClient({
            chain: sepolia,
            transport: custom(window.ethereum),
          })
        : undefined;
    const signer = new ViemSigner({
      publicClient,
      walletClient,
      ethereum:
        typeof window !== "undefined" ? window.ethereum : undefined,
    });
    const relayer = new RelayerWeb({
      getChainId: () => signer.getChainId(),
      transports: {
        [sepolia.id]: {
          ...SepoliaConfig,
          network: rpcUrl,
          relayerUrl:
            import.meta.env.VITE_ZAMA_RELAYER_URL ?? SepoliaConfig.relayerUrl,
        },
      },
    });

    return { relayer, signer };
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ZamaProvider
          relayer={relayer}
          signer={signer}
          storage={indexedDBStorage}
          sessionTTL={60 * 60}
        >
          {children}
        </ZamaProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
