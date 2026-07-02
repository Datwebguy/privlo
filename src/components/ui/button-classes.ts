import { cn } from "../../lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export function buttonClasses(
  variant: ButtonVariant = "primary",
  className?: string,
) {
  return cn(
    "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50",
    variant === "primary" &&
      "bg-mint text-[#06241c] shadow-[0_0_24px_rgba(103,247,206,.12)] hover:bg-[#8cffdc]",
    variant === "secondary" &&
      "border border-line bg-white/[.035] text-white hover:border-white/20 hover:bg-white/[.06]",
    variant === "ghost" &&
      "text-slate-400 hover:bg-white/5 hover:text-white",
    className,
  );
}
