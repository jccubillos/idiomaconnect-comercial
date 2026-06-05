"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/worlds", label: "Worlds", icon: "🌍" },
  { href: "/arena", label: "Arena", icon: "⚔️" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export function BottomNav() {
  const pathname = usePathname();
  const params = useSearchParams();
  const kidId = params.get("kid");

  // Visible en pantallas de sesión activa
  const showOn = ["/worlds", "/arena", "/profile", "/lesson", "/battle", "/play", "/flashcards", "/srs", "/pronunciation"];
  if (!showOn.some((p) => pathname?.startsWith(p))) return null;

  return (
    <nav className="bottom-nav">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const active = pathname?.startsWith(tab.href);
          const href =
            kidId && (tab.href === "/worlds" || tab.href === "/profile")
              ? `${tab.href}${tab.href === "/profile" ? `/${kidId}` : `?kid=${kidId}`}`
              : tab.href;
          return (
            <Link
              key={tab.href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all",
                active
                  ? "text-neon-redLight bg-neon-redLight/10 shadow-[0_0_12px_rgba(255,179,174,0.2)]"
                  : "text-ink-dim opacity-60 hover:opacity-100",
              )}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-wide">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
