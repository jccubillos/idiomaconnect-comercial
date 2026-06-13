"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/profiles", label: "Inicio", icon: "🏠" },
  { href: "/worlds", label: "Worlds", icon: "🌍" },
  { href: "/arena", label: "Arena", icon: "⚔️" },
  { href: "/profile", label: "Perfil", icon: "👤" },
];

export function BottomNav() {
  const pathname = usePathname();
  const params = useSearchParams();
  // El contexto del niño puede venir como ?kid=<id> (la mayoría de pantallas) o
  // dentro de la ruta /profile/<id>. Lo tomamos de ambos para que "Worlds" y
  // "Perfil" nunca pierdan al niño y reboten a Inicio.
  const kidId = params.get("kid") ?? pathname?.match(/^\/profile\/([^/]+)/)?.[1] ?? null;

  // Visible en TODAS las pantallas de práctica y navegación del niño.
  const showOn = [
    "/worlds", "/arena", "/profile", "/lesson", "/battle", "/play", "/flashcards",
    "/srs", "/pronunciation", "/sentence-builder", "/story-fill", "/listen-id",
    "/memory-match", "/minimal-pairs", "/shadow-speaking", "/conversation",
    "/speaking-journal", "/translate-inverse", "/describe-scene", "/exam",
    "/sendero", "/school-world", "/school", "/personal-talk", "/duelo", "/reto",
  ];
  if (!showOn.some((p) => pathname?.startsWith(p))) return null;

  return (
    <nav className="bottom-nav">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          // "/profile" no debe activarse en "/profiles" (Inicio) y viceversa.
          const active =
            tab.href === "/profile"
              ? pathname === "/profile" || pathname?.startsWith("/profile/")
              : pathname?.startsWith(tab.href);
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
