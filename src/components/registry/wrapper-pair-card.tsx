import { ArrowRight, BadgeCheck, FlaskConical } from "lucide-react";
import type { RegistryPair } from "../../hooks/use-merged-registry-pairs";
import { cn, shortAddress } from "../../lib/utils";

export function WrapperPairCard({
  pair,
  selected,
  onSelect,
}: {
  pair: RegistryPair;
  selected: boolean;
  onSelect: () => void;
}) {
  const underlying = pair.underlying?.symbol ?? shortAddress(pair.tokenAddress);
  const confidential =
    pair.confidential?.symbol ?? shortAddress(pair.confidentialTokenAddress);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-2xl border p-5 text-left transition",
        selected
          ? "border-mint/40 bg-mint/[.055] shadow-glow"
          : "border-white/[.07] bg-white/[.02] hover:border-white/[.14]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-base font-semibold tracking-[-.03em]">
            {underlying} → {confidential}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {pair.underlying?.name ?? pair.label ?? "Registry pair"}
          </p>
        </div>
        <ArrowRight
          size={16}
          className={cn("shrink-0", selected ? "text-mint" : "text-slate-600")}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge
          icon={BadgeCheck}
          label={pair.source === "onchain" ? "Onchain" : "Local"}
        />
        {pair.faucetEnabled && (
          <Badge icon={FlaskConical} label="Faucet" tone="sky" />
        )}
        {!pair.isValid && <Badge label="Invalid" tone="amber" />}
      </div>

      <div className="mt-4 grid gap-2 text-[11px] text-slate-600">
        <p>
          ERC-20{" "}
          <span className="font-mono text-slate-400">
            {shortAddress(pair.tokenAddress)}
          </span>
        </p>
        <p>
          ERC-7984{" "}
          <span className="font-mono text-slate-400">
            {shortAddress(pair.confidentialTokenAddress)}
          </span>
        </p>
      </div>
    </button>
  );
}

function Badge({
  label,
  icon: Icon,
  tone = "slate",
}: {
  label: string;
  icon?: typeof BadgeCheck;
  tone?: "slate" | "sky" | "amber";
}) {
  const tones = {
    slate: "border-white/[.08] bg-white/[.03] text-slate-400",
    sky: "border-sky-400/20 bg-sky-400/[.06] text-sky-200",
    amber: "border-amber-400/20 bg-amber-400/[.06] text-amber-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        tones[tone],
      )}
    >
      {Icon && <Icon size={10} />}
      {label}
    </span>
  );
}