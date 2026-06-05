"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "ghost-cyan" | "ghost-purple" | "ghost-green";
type Size = "sm" | "md" | "lg";

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-neon-red text-white shadow-[0_0_16px_rgba(255,75,75,0.4)] hover:brightness-110 active:scale-[0.96]",
  "ghost-cyan":
    "bg-transparent border-[1.5px] border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10",
  "ghost-purple":
    "bg-transparent border-[1.5px] border-neon-purple text-neon-purple hover:bg-neon-purple/10",
  "ghost-green":
    "bg-transparent border-[1.5px] border-neon-green text-neon-green hover:bg-neon-green/10",
};

const sizeStyles: Record<Size, string> = {
  sm: "py-2 px-3 text-xs",
  md: "py-2.5 px-4 text-sm",
  lg: "py-3 px-5 text-base",
};

export const NeonButton = forwardRef<HTMLButtonElement, NeonButtonProps>(
  function NeonButton(
    { variant = "primary", size = "md", loading, className, children, disabled, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "rounded-xl font-bold uppercase tracking-wide transition-all",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border-2 border-current border-r-transparent animate-spin" />
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  },
);
