import type { Config, CreateConnectorFn } from "@wagmi/core";
import { injected, walletConnect } from "wagmi/connectors";
import { walletConnectProjectId } from "../config/create-wagmi-config";
import type { DiscoveredWallet } from "../hooks/use-wallet-discovery";

function addConnector(config: Config, connectorFn: CreateConnectorFn) {
  const connector = config._internal.connectors.setup(connectorFn);
  const existing = config.connectors.some((item) => item.id === connector.id);
  if (!existing) {
    config._internal.connectors.setState((previous) => [
      ...(previous ?? []),
      connector,
    ]);
  }
  return connector;
}

let walletConnectPrepared = false;

export function prepareWalletConnectConnector(config: Config) {
  if (walletConnectPrepared || !walletConnectProjectId) return;
  addConnector(
    config,
    walletConnect({
      projectId: walletConnectProjectId,
      showQrModal: true,
      metadata: {
        name: "Privlo",
        description: "Private Financial Flows",
        url: window.location.origin,
        icons: [`${window.location.origin}/favicon.svg`],
      },
    }),
  );
  walletConnectPrepared = true;
}

export function prepareDiscoveredConnector(
  config: Config,
  wallet: DiscoveredWallet,
) {
  const existing = config.connectors.find(
    (connector) => connector.id === wallet.id,
  );
  if (existing) return existing;

  return addConnector(
    config,
    injected({
      target: {
        id: wallet.id,
        name: wallet.name,
        icon: wallet.icon,
        provider: wallet.provider,
      },
    }),
  );
}

export function prepareWalletPicker(config: Config) {
  prepareWalletConnectConnector(config);
}