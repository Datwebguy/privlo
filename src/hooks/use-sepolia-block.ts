import { useQuery } from "@tanstack/react-query";
import { publicClient } from "../lib/public-client";

export function useSepoliaBlockNumber() {
  return useQuery({
    queryKey: ["privlo", "sepolia-block"],
    queryFn: () => publicClient.getBlockNumber(),
    refetchInterval: 12_000,
  });
}