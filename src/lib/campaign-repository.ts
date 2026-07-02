import type { Address } from "viem";
import type { Campaign } from "../types/campaign";
import { parseCampaigns } from "./runtime-validation";

const STORAGE_KEY = "privlo:confirmed-campaigns:v1";

function readAll(): Campaign[] {
  if (typeof window === "undefined") return [];
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return [];
    return parseCampaigns(JSON.parse(value));
  } catch {
    return [];
  }
}

export function getCampaigns(creator?: Address) {
  if (!creator) return [];
  const normalized = creator.toLowerCase();
  return readAll()
    .filter((campaign) => campaign.creator.toLowerCase() === normalized)
    .sort((left, right) => right.createdAt - left.createdAt);
}

export function saveCampaign(campaign: Campaign) {
  const existing = readAll().filter(
    (item) => item.transactionHash !== campaign.transactionHash,
  );
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([campaign, ...existing]),
  );
}
