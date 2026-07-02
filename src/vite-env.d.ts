/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
  readonly VITE_SEPOLIA_RPC_URL?: string;
  readonly VITE_ZAMA_RELAYER_URL?: string;
  readonly VITE_PRIVLO_API_URL?: string;
  readonly VITE_TOKENOPS_DISPERSE_ADDRESS?: `0x${string}`;
  readonly VITE_TOKENOPS_AIRDROP_FACTORY_ADDRESS?: `0x${string}`;
  readonly VITE_TOKENOPS_VESTING_FACTORY_ADDRESS?: `0x${string}`;
}

interface Window {
  ethereum?: import("viem").EIP1193Provider;
}
