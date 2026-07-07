import { useEffect, useState } from "react";
import type { EIP1193Provider } from "viem";

export interface DiscoveredWallet {
  id: string;
  name: string;
  icon?: string;
  provider: EIP1193Provider;
}

interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

export function useWalletDiscovery(enabled: boolean) {
  const [wallets, setWallets] = useState<DiscoveredWallet[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      setWallets([]);
      setIsDiscovering(false);
      return;
    }

    const discovered = new Map<string, DiscoveredWallet>();
    setIsDiscovering(true);

    function onAnnounce(event: Event) {
      const detail = (event as CustomEvent<EIP6963ProviderDetail>).detail;
      if (!detail?.info?.rdns || !detail.provider) return;
      discovered.set(detail.info.uuid, {
        id: detail.info.rdns,
        name: detail.info.name,
        icon: detail.info.icon,
        provider: detail.provider,
      });
      setWallets([...discovered.values()]);
    }

    window.addEventListener(
      "eip6963:announceProvider",
      onAnnounce as EventListener,
    );
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    const timeout = window.setTimeout(() => setIsDiscovering(false), 400);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener(
        "eip6963:announceProvider",
        onAnnounce as EventListener,
      );
      setIsDiscovering(false);
    };
  }, [enabled]);

  return { wallets, isDiscovering };
}