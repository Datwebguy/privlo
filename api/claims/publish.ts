import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyWalletMessage } from "../_lib/auth.js";
import { upsertClaims } from "../_lib/claims-store.js";
import { MAX_BODY_BYTES } from "../_lib/constants.js";
import { handlePreflight } from "../_lib/cors.js";
import {
  badRequest,
  methodNotAllowed,
  serverError,
  unauthorized,
  payloadTooLarge,
  json,
} from "../_lib/response.js";
import {
  containsForbiddenAmountFields,
  parsePublishBody,
} from "../_lib/validation.js";

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

  const body = req.body;
  if (containsForbiddenAmountFields(body)) return badRequest(req, res);

  const parsed = parsePublishBody(body);
  if (!parsed) return badRequest(req, res);

  if (!parsed.message.startsWith("Privlo publish claims for campaign ")) {
    return unauthorized(req, res);
  }

  const verified = await verifyWalletMessage({
    expectedAddress: parsed.creator,
    message: parsed.message,
    signature: parsed.signature,
  });
  if (!verified) return unauthorized(req, res);

  try {
    await upsertClaims(parsed.creator, parsed.claims);
    return json(req, res, 200, { ok: true, published: parsed.claims.length });
  } catch {
    return serverError(req, res);
  }
}