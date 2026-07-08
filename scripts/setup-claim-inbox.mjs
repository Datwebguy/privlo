#!/usr/bin/env node
/**
 * Validates Privlo claim inbox (Supabase + Vercel API).
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/setup-claim-inbox.mjs
 *
 * Optional (to apply schema without SQL editor):
 *   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/setup-claim-inbox.mjs --apply-schema
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const PROJECT_REF = "synhcsrkiouoafdeoyou";
const SUPABASE_URL =
  process.env.SUPABASE_URL ?? `https://${PROJECT_REF}.supabase.co`;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const APPLY_SCHEMA = process.argv.includes("--apply-schema");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const schemaSql = readFileSync(join(root, "supabase", "schema.sql"), "utf8");

function fail(message) {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`✓ ${message}`);
}

async function applySchemaViaManagementApi() {
  if (!ACCESS_TOKEN) {
    fail(
      "Set SUPABASE_ACCESS_TOKEN (from https://supabase.com/dashboard/account/tokens) or run schema.sql manually in the SQL editor.",
    );
  }

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: schemaSql }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    fail(`Management API schema apply failed (${response.status}): ${body}`);
  }

  ok("Applied supabase/schema.sql via Management API");
}

async function claimsTableReady(client) {
  const { error } = await client.from("claims").select("id").limit(1);
  if (!error) return true;
  const message = error.message.toLowerCase();
  return !(
    message.includes("does not exist") ||
    message.includes("could not find the table") ||
    message.includes("relation") ||
    error.code === "42P01"
  );
}

async function main() {
  console.log(`Privlo claim inbox setup — ${SUPABASE_URL}\n`);

  if (!SERVICE_ROLE_KEY) {
    fail(
      [
        "Missing SUPABASE_SERVICE_ROLE_KEY.",
        "Copy the service_role secret from:",
        `https://supabase.com/dashboard/project/${PROJECT_REF}/settings/api`,
      ].join("\n"),
    );
  }

  const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let tableReady = await claimsTableReady(client);

  if (!tableReady && APPLY_SCHEMA) {
    await applySchemaViaManagementApi();
    tableReady = await claimsTableReady(client);
  }

  if (!tableReady) {
    console.error("\n✗ Table `claims` is missing.");
    console.error(
      `  Open SQL editor: https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`,
    );
    console.error("  Paste and run: supabase/schema.sql");
    console.error(
      "  Or rerun with SUPABASE_ACCESS_TOKEN=... node scripts/setup-claim-inbox.mjs --apply-schema",
    );
    process.exit(1);
  }

  ok("Supabase `claims` table is reachable");

  const probeId = `privlo-setup-probe:${Date.now()}`;
  const { error: insertError } = await client.from("claims").insert({
    id: probeId,
    recipient: "0x0000000000000000000000000000000000000001",
    creator: "0x0000000000000000000000000000000000000002",
    campaign_name: "setup-probe",
    token_address: "0x0000000000000000000000000000000000000003",
    token_symbol: "PROBE",
    airdrop_address: "0x0000000000000000000000000000000000000004",
    encrypted_handle:
      "0x0000000000000000000000000000000000000000000000000000000000000001",
    input_proof:
      "0x0000000000000000000000000000000000000000000000000000000000000002",
    signature:
      "0x0000000000000000000000000000000000000000000000000000000000000003",
    created_at: Date.now(),
  });

  if (insertError) {
    fail(`Write probe failed: ${insertError.message}`);
  }

  await client.from("claims").delete().eq("id", probeId);
  ok("Insert/delete probe succeeded");

  console.log("\nClaim inbox is ready.");
  console.log("Next: redeploy Vercel after SUPABASE_* env vars are set.");
}

main().catch((cause) => {
  fail(cause instanceof Error ? cause.message : String(cause));
});