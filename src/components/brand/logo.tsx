import { cn } from "../../lib/utils";

export function PrivloMark({
  className,
  title = "Privlo",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={cn("size-9", className)}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M49.5 14.5A23 23 0 1 0 50 49" strokeWidth="7.5" />
        <path
          d="M23 53V31.5C23 23.5 28.5 18 36.5 18S50 23.5 50 31.5 44.5 45 36.5 45H23"
          strokeWidth="7.5"
        />
      </g>
      <circle cx="36.5" cy="31.5" r="4.5" fill="currentColor" opacity=".92" />
    </svg>
  );
}

export function Logo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span className="grid size-10 place-items-center rounded-xl border border-mint/15 bg-mint/[.055] text-mint shadow-[inset_0_0_18px_rgba(103,247,206,.035)]">
        <PrivloMark className="size-7" />
      </span>
      {!compact && (
        <span className="font-display text-xl font-bold tracking-[-.04em]">
          privlo
        </span>
      )}
    </span>
  );
}
