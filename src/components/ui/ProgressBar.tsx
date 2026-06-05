import { cn, clamp } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: "reading" | "listening" | "writing" | "speaking" | "neon-red" | "neon-cyan" | "neon-purple" | "neon-green";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const variantBg: Record<NonNullable<ProgressBarProps["variant"]>, string> = {
  reading: "skill-reading",
  listening: "skill-listening",
  writing: "skill-writing",
  speaking: "skill-speaking",
  "neon-red": "bg-gradient-to-r from-neon-red to-neon-redLight",
  "neon-cyan": "bg-gradient-to-r from-neon-cyan to-[#7df4ff]",
  "neon-purple": "bg-gradient-to-r from-neon-purple to-[#e5b4ff]",
  "neon-green": "bg-gradient-to-r from-neon-green to-[#7df4ff]",
};

const sizeMap = {
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3.5",
};

export function ProgressBar({
  value,
  max = 100,
  variant = "neon-cyan",
  size = "md",
  showLabel = false,
  label,
  className,
}: ProgressBarProps) {
  const pct = clamp((value / max) * 100, 0, 100);

  return (
    <div className={cn("w-full", className)}>
      {(showLabel || label) && (
        <div className="flex justify-between text-xs font-bold mb-1.5">
          <span className="text-ink-dim">{label ?? "Progress"}</span>
          <span className="text-ink">{Math.round(pct)}%</span>
        </div>
      )}
      <div className={cn("progress-track", sizeMap[size])}>
        <div
          className={cn("progress-fill", variantBg[variant])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
