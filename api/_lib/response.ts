import type { VercelResponse } from "@vercel/node";
import { applyCors } from "./cors.js";
import type { VercelRequest } from "@vercel/node";

export function json(
  req: VercelRequest,
  res: VercelResponse,
  status: number,
  body: Record<string, unknown>,
) {
  applyCors(req, res);
  res.status(status).json(body);
}

export function methodNotAllowed(req: VercelRequest, res: VercelResponse) {
  json(req, res, 405, { error: "Method not allowed" });
}

export function unauthorized(req: VercelRequest, res: VercelResponse) {
  json(req, res, 401, { error: "Unauthorized" });
}

export function badRequest(req: VercelRequest, res: VercelResponse) {
  json(req, res, 400, { error: "Invalid request" });
}

export function payloadTooLarge(req: VercelRequest, res: VercelResponse) {
  json(req, res, 413, { error: "Payload too large" });
}

export function serverError(req: VercelRequest, res: VercelResponse) {
  json(req, res, 500, { error: "Internal server error" });
}