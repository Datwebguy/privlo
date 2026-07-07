import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  indexedDBStorage,
  RelayerWeb,
  SepoliaConfig,
  ZamaProvider,
} from "@zama-fhe/react-sdk";
import { WagmiSigner } from "@zama-fhe/react-sdk/wagmi";
import { useMemo, useState, type PropsWithChildren } from "react";
import { sepolia } from "wagmi/chains";
import { useAccount, WagmiProvider } from "wagmi";
import { rpcUrl, wagmiConfig } from "../config/chains";

function ZamaGate({ children }: PropsWithChildren) {
  const { isConnected } = useAccount();
  const zama = useMemo(() => {
    const signer = new WagmiSigner({ config: wagmiConfig });
    const relayer = new RelayerWeb({
      getChainId: () => Promise.resolve(sepolia.id),
      transports: {
        [sepolia.id]: {
          ...SepoliaConfig,
          network: rpcUrl,
          relayerUrl:
            import.meta.env.VITE_ZAMA_RELAYER_URL ?? SepoliaConfig.relayerUrl,
        },
      },
    });
    return { signer, relayer };
  }, []);

  if (!isConnected) return children;

  return (
    <ZamaProvider
      relayer={zama.relayer}
      signer={zama.signer}
      storage={indexedDBStorage}
      sessionTTL={60 * 60}
    >
      {children}
    </ZamaProvider>
  );
}

export function Web3Provider({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 12_000, retry: 1 },
        },
      }),
  );

  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <ZamaGate>{children}</ZamaGate>
      </QueryClientProvider>
    </WagmiProvider>
  );
}