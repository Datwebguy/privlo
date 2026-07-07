import type { Config } from "@wagmi/core";
import { createContext, useContext } from "react";

export const WagmiConfigContext = createContext<Config | null>(null);

export function useWagmiConfig() {
  const config = useContext(WagmiConfigContext);
  if (!config) {
    throw new Error("Wallet layer is not ready.");
  }
  return config;
}