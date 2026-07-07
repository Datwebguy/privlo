import type { Config } from "wagmi";
import { connect } from "wagmi/actions";
import type { Connector } from "wagmi";
import type { DiscoveredWallet } from "../hooks/use-wallet-discovery";
import { prepareDiscoveredConnector } from "./wallet-connectors";

export async function connectDiscoveredWallet(
  config: Config,
  wallet: DiscoveredWallet,
) {
  const connector = prepareDiscoveredConnector(config, wallet);
  return connect(config, { connector });
}

export async function connectWithConnector(
  config: Config,
  connector: Connector,
) {
  return connect(config, { connector });
}