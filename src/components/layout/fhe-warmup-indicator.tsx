import { LoaderCircle, ShieldCheck } from "lucide-react";
import {
  fheWarmupMessage,
  useFheWarmupStatus,
} from "../../providers/fhe-warmup-provider";

export function FheWarmupIndicator() {
  const warmup = useFheWarmupStatus();
  if (!warmup || warmup.phase === "idle") return null;

  if (warmup.phase === "ready" && !warmup.initError) {
    return (
      <span
        className="hidden items-center gap-1.5 rounded-full border border-mint/15 bg-mint/[.06] px-2.5 py-1 text-[10px] font-semibold text-mint lg:inline-flex"
        title="Secure encryption is ready"
      >
        <ShieldCheck size={12} />
        Ready
      </span>
    );
  }

  if (warmup.phase === "error") {
    return (
      <button
        type="button"
        onClick={warmup.retryBootstrap}
        className="hidden rounded-full border border-amber-400/20 bg-amber-400/[.06] px-2.5 py-1 text-[10px] font-semibold text-amber-100/85 lg:inline-block"
      >
        Retry encryption setup
      </button>
    );
  }

  return (
    <span
      className="hidden items-center gap-1.5 rounded-full border border-white/[.08] bg-white/[.03] px-2.5 py-1 text-[10px] text-slate-500 lg:inline-flex"
      title={fheWarmupMessage(warmup.phase, warmup.elapsedSec)}
    >
      <LoaderCircle size={12} className="animate-spin text-mint" />
      Encrypt setup…
    </span>
  );
}