import { AppShell } from "./components/layout/app-shell";
import { Web3Provider } from "./providers/web3-provider";

export function ProtectedAppShell() {
  return (
    <Web3Provider>
      <AppShell />
    </Web3Provider>
  );
}