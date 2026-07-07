import type { ReactNode } from "react";
import { useScrollReveal } from "../../hooks/use-scroll-reveal";
import { cn } from "../../lib/utils";

type RevealVariant = "up" | "left" | "right" | "scale" | "fade";

export function ScrollReveal({
  children,
  className,
  variant = "up",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  variant?: RevealVariant;
  delay?: number;
}) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn(
        "reveal",
        `reveal-${variant}`,
        visible && "reveal-visible",
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}