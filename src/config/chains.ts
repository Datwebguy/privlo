import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { sepolia } from "wagmi/chains";

export const rpcUrl =
  import.meta.env.VITE_SEPOLIA_RPC_URL ??
  "https://ethereum-sepolia-rpc.publicnode.com";

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [sepolia.id]: http(rpcUrl),
  },
});
