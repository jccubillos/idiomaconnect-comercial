import { cn } from "@/lib/utils";
import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  emoji?: string;
  name: string;
  ringColor: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: { box: "w-10 h-10", text: "text-base" },
  md: { box: "w-16 h-16", text: "text-2xl" },
  lg: { box: "w-28 h-28", text: "text-5xl" },
  xl: { box: "w-32 h-32", text: "text-6xl" },
};

export function Avatar({
  src,
  emoji,
  name,
  ringColor,
  size = "md",
  className,
}: AvatarProps) {
  const dims = sizeMap[size];
  const px = parseInt(dims.box.split("-")[1]) * 4;

  return (
    <div
      className={cn("avatar-ring", dims.box, className)}
      style={
        {
          border: `3px solid ${ringColor}`,
          // CSS var consumed by globals .avatar-ring::before
          ["--ring-color" as string]: ringColor,
        } as React.CSSProperties
      }
      aria-label={name}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={px}
          height={px}
          className="object-cover w-full h-full rounded-full"
          priority={size === "lg" || size === "xl"}
        />
      ) : (
        <span className={dims.text}>{emoji ?? "👤"}</span>
      )}
    </div>
  );
}
