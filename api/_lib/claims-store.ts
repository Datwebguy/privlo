import type { PublishClaimInput, StoredClaim } from "./types";
import { normalizeAddress } from "./validation";
import { getSupabase } from "./supabase";

interface ClaimRow {
  id: string;
  recipient: string;
  creator: string;
  campaign_name: string;
  token_address: string;
  token_symbol: string | null;
  airdrop_address: string;
  encrypted_handle: string;
  input_proof: string;
  signature: string;
  created_at: number;
  claimed_at: number | null;
  claim_transaction_hash: string | null;
}

function rowToClaim(row: ClaimRow): StoredClaim {
  return {
    id: row.id,
    recipient: row.recipient as `0x${string}`,
    creator: row.creator as `0x${string}`,
    campaignName: row.campaign_name,
    tokenAddress: row.token_address as `0x${string}`,
    tokenSymbol: row.token_symbol ?? undefined,
    airdropAddress: row.airdrop_address as `0x${string}`,
    encryptedInput: {
      handle: row.encrypted_handle as `0x${string}`,
      inputProof: row.input_proof as `0x${string}`,
    },
    signature: row.signature as `0x${string}`,
    createdAt: row.created_at,
    claimedAt: row.claimed_at ?? undefined,
    claimTransactionHash:
      (row.claim_transaction_hash as `0x${string}` | null) ?? undefined,
  };
}

function claimToRow(
  creator: `0x${string}`,
  claim: PublishClaimInput,
): ClaimRow {
  return {
    id: claim.id,
    recipient: normalizeAddress(claim.recipient),
    creator: normalizeAddress(creator),
    campaign_name: claim.campaignName,
    token_address: normalizeAddress(claim.tokenAddress),
    token_symbol: claim.tokenSymbol ?? null,
    airdrop_address: normalizeAddress(claim.airdropAddress),
    encrypted_handle: claim.encryptedInput.handle,
    input_proof: claim.encryptedInput.inputProof,
    signature: claim.signature,
    created_at: claim.createdAt,
    claimed_at: null,
    claim_transaction_hash: null,
  };
}

export async function upsertClaims(
  creator: `0x${string}`,
  claims: PublishClaimInput[],
) {
  const supabase = getSupabase();
  const rows = claims.map((claim) => claimToRow(creator, claim));
  const { error } = await supabase.from("claims").upsert(rows, {
    onConflict: "id",
    ignoreDuplicates: true,
  });
  if (error) throw error;
}

export async function listPendingClaimsForRecipient(
  recipient: `0x${string}`,
): Promise<StoredClaim[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("claims")
    .select("*")
    .eq("recipient", normalizeAddress(recipient))
    .is("claimed_at", null)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data as ClaimRow[]).map(rowToClaim);
}

export async function markClaimClaimed(params: {
  recipient: `0x${string}`;
  claimId: string;
  transactionHash: `0x${string}`;
}): Promise<boolean> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("claims")
    .update({
      claimed_at: Date.now(),
      claim_transaction_hash: params.transactionHash,
    })
    .eq("id", params.claimId)
    .eq("recipient", normalizeAddress(params.recipient))
    .is("claimed_at", null)
    .select("id");
  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}