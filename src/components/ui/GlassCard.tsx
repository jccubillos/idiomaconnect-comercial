import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  strong?: boolean;
  glowColor?: "red" | "cyan" | "purple" | "green" | null;
}

export function GlassCard({
  className,
  strong = false,
  glowColor = null,
  children,
  ...props
}: GlassCardProps) {
  const glow =
    glowColor === "red"
      ? "shadow-neon-red"
      : glowColor === "cyan"
      ? "shadow-neon-cyan"
      : glowColor === "purple"
      ? "shadow-neon-purple"
      : glowColor === "green"
      ? "shadow-neon-green"
      : "";

  return (
    <div
      className={cn(
        strong ? "glass-strong" : "glass",
        "rounded-2xl",
        glow,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
