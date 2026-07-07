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
import { useAccount, WagmiProvider, type Config } from "wagmi";
import {
  createPrivloWagmiConfig,
  rpcUrl,
} from "../config/create-wagmi-config";
import { WagmiConfigContext, useWagmiConfig } from "./wagmi-config-context";

function ZamaGate({ children }: PropsWithChildren) {
  const { isConnected } = useAccount();
  const config = useWagmiConfig();
  const zama = useMemo(() => {
    const signer = new WagmiSigner({ config });
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
  }, [config]);

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
  const [config] = useState<Config>(() => createPrivloWagmiConfig());

  return (
    <WagmiConfigContext.Provider value={config}>
      <WagmiProvider config={config} reconnectOnMount={false}>
        <QueryClientProvider client={queryClient}>
          <ZamaGate>{children}</ZamaGate>
        </QueryClientProvider>
      </WagmiProvider>
    </WagmiConfigContext.Provider>
  );
}