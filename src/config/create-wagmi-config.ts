import { http, createConfig, type Config } from "wagmi";
import { sepolia } from "wagmi/chains";

export const rpcUrl =
  import.meta.env.VITE_SEPOLIA_RPC_URL ??
  "https://ethereum-sepolia-rpc.publicnode.com";

export const walletConnectProjectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID?.trim();

/** No connectors at init — nothing touches browser wallets until the picker opens. */
export function createPrivloWagmiConfig(): Config {
  return createConfig({
    chains: [sepolia],
    connectors: [],
    multiInjectedProviderDiscovery: false,
    storage: null,
    transports: {
      [sepolia.id]: http(rpcUrl),
    },
  });
}