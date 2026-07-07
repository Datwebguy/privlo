import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { rpcUrl } from "../config/create-wagmi-config";

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(rpcUrl),
});