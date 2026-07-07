import { connect } from "wagmi/actions";
import { injected } from "wagmi/connectors";
import type { Connector } from "wagmi";
import { wagmiConfig } from "../config/chains";
import type { DiscoveredWallet } from "../hooks/use-wallet-discovery";

export async function connectDiscoveredWallet(wallet: DiscoveredWallet) {
  const existing = wagmiConfig.connectors.find(
    (connector) => connector.id === wallet.id,
  );
  if (existing) {
    return connect(wagmiConfig, { connector: existing });
  }

  const connector = wagmiConfig._internal.connectors.setup(
    injected({
      target: {
        id: wallet.id,
        name: wallet.name,
        icon: wallet.icon,
        provider: wallet.provider,
      },
    }),
  );

  return connect(wagmiConfig, { connector });
}

export async function connectWithConnector(connector: Connector) {
  return connect(wagmiConfig, { connector });
}