import { LockKeyhole } from "lucide-react";
import { cn } from "../../lib/utils";

export function PrivacyBadge({
  label = "Encrypted",
  subtle = false,
}: {
  label?: string;
  subtle?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[.1em]",
        subtle
          ? "border-white/[.07] bg-white/[.025] text-slate-500"
          : "border-mint/15 bg-mint/[.07] text-mint",
      )}
    >
      <LockKeyhole size={11} strokeWidth={2.2} />
      {label}
    </span>
  );
}
