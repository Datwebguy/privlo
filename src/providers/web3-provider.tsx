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
import { createPrivloWagmiConfig } from "../config/create-wagmi-config";
import { WagmiConfigContext, useWagmiConfig } from "./wagmi-config-context";

function ZamaConnected({ children }: PropsWithChildren) {
  const config = useWagmiConfig();
  const { address } = useAccount();
  const zama = useMemo(() => {
    if (!address) return null;
    const signer = new WagmiSigner({ config });
    const relayer = new RelayerWeb({
      getChainId: () => signer.getChainId(),
      transports: {
        [sepolia.id]: {
          ...SepoliaConfig,
          relayerUrl:
            import.meta.env.VITE_ZAMA_RELAYER_URL ?? SepoliaConfig.relayerUrl,
        },
      },
    });
    return { signer, relayer, address };
  }, [config, address]);

  if (!zama) {
    return (
      <div className="grid min-h-64 place-items-center text-sm text-slate-500">
        Preparing confidential session…
      </div>
    );
  }

  return (
    <ZamaProvider
      key={zama.address}
      relayer={zama.relayer}
      signer={zama.signer}
      storage={indexedDBStorage}
      sessionTTL={60 * 60}
    >
      {children}
    </ZamaProvider>
  );
}

function ZamaGate({ children }: PropsWithChildren) {
  const { isConnected } = useAccount();
  if (!isConnected) return children;
  return <ZamaConnected>{children}</ZamaConnected>;
}

export function Web3Provider({ children }: PropsWithChildren) {
  const [config] = useState<Config>(() => createPrivloWagmiConfig());

  return (
    <WagmiConfigContext.Provider value={config}>
      <WagmiProvider config={config} reconnectOnMount={false}>
        <ZamaGate>{children}</ZamaGate>
      </WagmiProvider>
    </WagmiConfigContext.Provider>
  );
}