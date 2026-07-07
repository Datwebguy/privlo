import type { VercelRequest, VercelResponse } from "@vercel/node";

function allowedOrigins(): string[] {
  const configured = process.env.ALLOWED_ORIGINS;
  if (configured) {
    return configured
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
  }
  return ["https://privlo.vercel.app", "http://127.0.0.1:5173", "http://localhost:5173"];
}

export function applyCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  const allowed = allowedOrigins();
  if (origin && allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");
}

export function handlePreflight(
  req: VercelRequest,
  res: VercelResponse,
): boolean {
  applyCors(req, res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}