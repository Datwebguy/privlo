import { http, createConfig } from "wagmi";
import { walletConnect } from "wagmi/connectors";
import { sepolia } from "wagmi/chains";

export const rpcUrl =
  import.meta.env.VITE_SEPOLIA_RPC_URL ??
  "https://ethereum-sepolia-rpc.publicnode.com";

const walletConnectProjectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID?.trim();

export const wagmiConfig = createConfig({
  chains: [sepolia],
  // Never probe browser wallets at page load — discovery runs when the picker opens.
  multiInjectedProviderDiscovery: false,
  storage: null,
  connectors: [
    ...(walletConnectProjectId
      ? [
          walletConnect({
            projectId: walletConnectProjectId,
            showQrModal: true,
            metadata: {
              name: "Privlo",
              description: "Private Financial Flows",
              url:
                typeof window === "undefined"
                  ? "https://github.com/Datwebguy/privlo"
                  : window.location.origin,
              icons:
                typeof window === "undefined"
                  ? []
                  : [`${window.location.origin}/favicon.svg`],
            },
          }),
        ]
      : []),
  ],
  transports: {
    [sepolia.id]: http(rpcUrl),
  },
});