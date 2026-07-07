import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  indexedDBStorage,
  RelayerWeb,
  SepoliaConfig,
  ZamaProvider,
} from "@zama-fhe/react-sdk";
import { WagmiSigner } from "@zama-fhe/react-sdk/wagmi";
import { useState, type PropsWithChildren } from "react";
import { WagmiProvider } from "wagmi";
import { rpcUrl, wagmiConfig } from "../config/chains";

const zamaSigner = new WagmiSigner({ config: wagmiConfig });

const relayer = new RelayerWeb({
  getChainId: () => zamaSigner.getChainId(),
  transports: {
    [11155111]: {
      ...SepoliaConfig,
      network: rpcUrl,
      relayerUrl:
        import.meta.env.VITE_ZAMA_RELAYER_URL ?? SepoliaConfig.relayerUrl,
    },
  },
});

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
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ZamaProvider
          relayer={relayer}
          signer={zamaSigner}
          storage={indexedDBStorage}
          sessionTTL={60 * 60}
        >
          {children}
        </ZamaProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}