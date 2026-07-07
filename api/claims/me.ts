import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAddress } from "viem";
import { verifyWalletMessage } from "../_lib/auth";
import { listPendingClaimsForRecipient } from "../_lib/claims-store";
import { MAX_BODY_BYTES } from "../_lib/constants";
import { handlePreflight } from "../_lib/cors";
import {
  badRequest,
  methodNotAllowed,
  serverError,
  unauthorized,
  payloadTooLarge,
  json,
} from "../_lib/response";
import { parseSignaturePayload } from "../_lib/validation";

function readBodySize(req: VercelRequest): number {
  const length = req.headers["content-length"];
  if (length) return Number(length);
  if (typeof req.body === "string") return Buffer.byteLength(req.body, "utf8");
  if (req.body) return Buffer.byteLength(JSON.stringify(req.body), "utf8");
  return 0;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return methodNotAllowed(req, res);
  if (readBodySize(req) > MAX_BODY_BYTES) return payloadTooLarge(req, res);

  const parsed = parseSignaturePayload(req.body);
  if (!parsed) return badRequest(req, res);

  const recipient = getAddress(
    (req.body as Record<string, unknown>).recipient as string,
  );
  if (recipient.toLowerCase() !== parsed.address.toLowerCase()) {
    return unauthorized(req, res);
  }

  const expectedPrefix = `Privlo view claims for ${recipient}`;
  if (parsed.message !== expectedPrefix) return unauthorized(req, res);

  const verified = await verifyWalletMessage({
    expectedAddress: recipient,
    message: parsed.message,
    signature: parsed.signature,
  });
  if (!verified) return unauthorized(req, res);

  try {
    const claims = await listPendingClaimsForRecipient(recipient);
    return json(req, res, 200, {
      claims: claims.map(
        ({
          id,
          campaignName,
          tokenAddress,
          tokenSymbol,
          airdropAddress,
          encryptedInput,
          signature,
          createdAt,
        }) => ({
          id,
          campaignName,
          tokenAddress,
          tokenSymbol,
          airdropAddress,
          encryptedInput,
          signature,
          createdAt,
        }),
      ),
    });
  } catch {
    return serverError(req, res);
  }
}