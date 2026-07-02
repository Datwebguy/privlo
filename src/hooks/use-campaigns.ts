import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { getCampaigns } from "../lib/campaign-repository";

export const campaignQueryKey = (creator?: Address) => [
  "privlo",
  "campaigns",
  creator?.toLowerCase(),
];

export function useCampaigns(creator?: Address) {
  return useQuery({
    queryKey: campaignQueryKey(creator),
    queryFn: () => getCampaigns(creator),
    enabled: Boolean(creator),
  });
}
