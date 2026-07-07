import { LoaderCircle, RefreshCw, Shield } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { ArbitraryDecryptPanel } from "../components/registry/arbitrary-decrypt-panel";
import { WrapUnwrapPanel } from "../components/registry/wrap-unwrap-panel";
import { WrapperPairCard } from "../components/registry/wrapper-pair-card";
import { PrivacyBadge } from "../components/ui/privacy-badge";
import { WalletRequired } from "../components/wallet/wallet-required";
import { sepoliaWrappersRegistryAddress } from "../config/wrapper-registry";
import { useMergedRegistryPairs } from "../hooks/use-merged-registry-pairs";
import { shortAddress } from "../lib/utils";

export function RegistryFlow() {
  const { isConnected } = useAccount();
  const registry = useMergedRegistryPairs();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = registry.pairs[selectedIndex];

  if (!isConnected) {
    return (
      <WalletRequired
        title="Connect to use the registry"
        copy="Browse official Sepolia wrapper pairs, wrap and unwrap tokens, and decrypt confidential balances."
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Zama Wrappers Registry</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-.04em] sm:text-4xl">
            Confidential wrapper registry
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Official ERC-20 ↔ ERC-7984 pairs from the onchain Sepolia registry,
            plus optional local pairs from{" "}
            <code className="text-slate-400">wrapper-pairs.local.ts</code>.
          </p>
        </div>
        <PrivacyBadge label="Sepolia · EIP-712 decrypt" />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-white/[.06] bg-white/[.02] px-4 py-3 text-xs text-slate-500">
        <Shield size={14} className="text-mint" />
        Registry contract{" "}
        <a
          href={`https://sepolia.etherscan.io/address/${sepoliaWrappersRegistryAddress}`}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-mint hover:underline"
        >
          {shortAddress(sepoliaWrappersRegistryAddress)}
        </a>
        <button
          type="button"
          onClick={() => void registry.refetch()}
          className="ml-auto inline-flex items-center gap-1.5 font-semibold text-mint"
        >
          <RefreshCw size={12} />
          Refresh pairs
        </button>
      </div>

      {registry.isLoading && (
        <div className="mt-10 flex items-center gap-2 text-sm text-slate-500">
          <LoaderCircle size={16} className="animate-spin" />
          Reading onchain registry…
        </div>
      )}

      {registry.isError && (
        <p className="mt-6 text-sm text-rose-300" role="alert">
          Could not load registry pairs: {registry.error?.message}
        </p>
      )}

      {!registry.isLoading && registry.pairs.length === 0 && (
        <p className="mt-10 text-sm text-slate-500">
          No pairs found. Check your Sepolia RPC and registry address.
        </p>
      )}

      {registry.pairs.length > 0 && (
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <section>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-display text-lg font-semibold">
                Registry pairs ({registry.total})
              </h2>
            </div>
            <div className="space-y-3">
              {registry.pairs.map((pair, index) => (
                <WrapperPairCard
                  key={pair.confidentialTokenAddress}
                  pair={pair}
                  selected={index === selectedIndex}
                  onSelect={() => setSelectedIndex(index)}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-display text-lg font-semibold">
              Wrap · unwrap · decrypt
            </h2>
            {selected && <WrapUnwrapPanel pair={selected} />}
          </section>
        </div>
      )}

      <div className="mt-12">
        <ArbitraryDecryptPanel />
      </div>

      <p className="mt-10 text-center text-xs text-slate-600">
        Also building confidential payroll?{" "}
        <Link to="/app/campaigns/new" className="text-mint hover:underline">
          Create a distribution campaign
        </Link>
      </p>
    </div>
  );
}