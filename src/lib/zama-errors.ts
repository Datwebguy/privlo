import { matchZamaError } from "@zama-fhe/react-sdk";

function unwrapCause(error: Error, depth = 0): Error {
  if (depth > 4) return error;
  const cause = error.cause;
  if (cause instanceof Error && cause.message !== error.message) {
    return unwrapCause(cause, depth + 1);
  }
  return error;
}

/** User-facing message for TokenOps + Zama execution failures. */
export function formatExecutionError(error: unknown): string {
  if (!(error instanceof Error)) return "Distribution failed.";
  const root = unwrapCause(error);
  const formatted = formatZamaError(root);
  if (formatted !== root.message.split("\n")[0]) return formatted;
  if (
    /fhe encryption failed/i.test(error.message) ||
    /encrypt timed out/i.test(error.message) ||
    /request encrypt timed out/i.test(error.message)
  ) {
    const detail = root.message.split("\n")[0];
    if (/timed out/i.test(detail)) {
      return "Encryption timed out. Keep this tab open and click execute again — first-time encrypt can take 1–2 minutes.";
    }
    if (detail && detail !== error.message) {
      return `Encryption failed: ${detail}`;
    }
    return "FHE encryption failed. Hard refresh, stay on Sepolia, and wait for the privacy engine to finish loading.";
  }
  return error.message.split("\n")[0] || "Distribution failed.";
}

export function formatZamaError(error: Error) {
  const message = matchZamaError(error, {
    SIGNING_REJECTED: () =>
      "Wallet signature was rejected. Approve every wallet prompt to continue.",
    ENCRYPTION_FAILED: () => "Encryption failed. Refresh and try again.",
    DECRYPTION_FAILED: () =>
      "Decryption failed. Confirm you are on Sepolia and try again.",
    APPROVAL_FAILED: () =>
      "Token approval failed. Confirm the approval in your wallet, then retry.",
    TRANSACTION_REVERTED: () =>
      "Transaction reverted on-chain. Check your balance and try a smaller amount.",
    INSUFFICIENT_ERC20_BALANCE: () =>
      "Insufficient public token balance. Mint or fund more underlying tokens first.",
    INSUFFICIENT_CONFIDENTIAL_BALANCE: () =>
      "Insufficient confidential balance. Wrap more tokens or lower the amount.",
    BALANCE_CHECK_UNAVAILABLE: () =>
      "Could not read your confidential balance yet. Wait for encryption to finish, then retry.",
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