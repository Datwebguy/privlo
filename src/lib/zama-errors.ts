import { matchZamaError } from "@zama-fhe/react-sdk";

export function formatZamaError(error: Error) {
  const message = matchZamaError(error, {
    SIGNING_REJECTED: () =>
      "Wallet signature was rejected. Approve the request to reveal your balance.",
    ENCRYPTION_FAILED: () => "Encryption failed. Refresh and try again.",
    DECRYPTION_FAILED: () =>
      "Decryption failed. Confirm you are on Sepolia and try again.",
    CONFIGURATION: () =>
      "FHE worker could not start. Hard refresh the page; if it persists, try another browser.",
    RELAYER_REQUEST_FAILED: () =>
      "Zama relayer is unreachable. Check your connection and try again.",
  });

  if (message) return message;

  const root = error.cause instanceof Error ? error.cause.message : "";
  if (/failed to initialize fhe worker/i.test(error.message)) {
    return root
      ? `FHE worker failed: ${root}`
      : "FHE worker failed to start. Hard refresh and try again.";
  }

  return error.message.split("\n")[0] || "Confidential operation failed.";
}