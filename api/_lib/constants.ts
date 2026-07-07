export const MAX_CLAIMS_PER_REQUEST = 500;
export const MAX_CAMPAIGN_NAME_LENGTH = 80;
export const MAX_BODY_BYTES = 2_000_000;
export const MAX_MESSAGE_LENGTH = 512;
export const MAX_CLAIM_ID_LENGTH = 320;

export const FORBIDDEN_PAYLOAD_KEYS = new Set([
  "amount",
  "plaintextamount",
  "decryptedamount",
  "displayamount",
  "plaintext",
  "decrypted",
]);