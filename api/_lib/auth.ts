import { verifyMessage } from "viem";
import type { Address, Hex } from "viem";

export async function verifyWalletMessage(params: {
  expectedAddress: Address;
  message: string;
  signature: Hex;
}): Promise<boolean> {
  try {
    return await verifyMessage({
      address: params.expectedAddress,
      message: params.message,
      signature: params.signature,
    });
  } catch {
    return false;
  }
}