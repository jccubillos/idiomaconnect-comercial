import type { Metadata } from "next";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

export const metadata: Metadata = {
  title: "Programa de Afiliados — Gana 50% por venta",
  description:
    "Promociona IdiomaConnect, la app de inglés para niños, y gana hasta 50% de comisión por cada venta. Productos desde US$69.",
  // Página NO LISTADA: se comparte por link directo a prospectos (y vía Hotmart),
  // pero no se indexa ni aparece para los clientes de la app.
  robots: { index: false, follow: false },
};

const PRODUCTS = [
  { name: "English Starter", price: 69, access: "6 meses · 1 niño", commission: 34.5 },
  { name: "English Pro Family", price: 297, access: "12 meses · hasta 6 niños", commission: 148.5, star: true },
];

export default function AfiliadosPage() {
  return (
    <main className="min-h-dvh px-5 py-12 max-w-4xl mx-auto relative z-10">
      <Link href="/" className="text-sm font-bold text-neon-cyan">← Inicio</Link>

      <header className="text-center my-8">
        <div className="text-xs font-bold uppercase tracking-widest text-neon-purple mb-2">Programa de Afiliados</div>
        <h1 className="text-3xl md:text-5xl font-extrabold mb-3 text-balance">
          Gana <span className="text-neon-green">50% de comisión</span> promocionando inglés para niños
        </h1>
        <p className="text-ink-dim max-w-2xl mx-auto">
          IdiomaConnect es el tutor de inglés con IA que personaliza cada lección con la familia
          del niño. Producto que convierte, comisiones altas y herramientas virales listas para
          tus redes.
        </p>
      </header>

      {/* Por qué vende */}
      <section className="grid md:grid-cols-3 gap-4 mb-10">
        <Why emoji="💸" title="50% por venta" body="La comisión más alta de la categoría. Hasta US$148 por una sola venta Pro Family." />
        <Why emoji="🔥" title="Producto viral" body="Reto a un amigo y Duelo Familiar: contenido que se graba solo para reels y TikTok." />
        <Why emoji="🎯" title="Nicho enorme" body="Millones de familias hispanohablantes quieren que sus hijos aprendan inglés." />
      </section>

      {/* Productos y comisiones */}
      <h2 className="text-2xl font-extrabold text-center mb-6">Tus comisiones</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-4 max-w-2xl mx-auto">
        {PRODUCTS.map((p) => (
          <GlassCard key={p.name} strong={p.star} glowColor={p.star ? "cyan" : undefined} className={`p-5 text-center flex flex-col ${p.star ? "border-2 border-neon-cyan/60" : ""}`}>
            {p.star && <div className="text-[10px] font-bold uppercase tracking-widest text-neon-cyan mb-1">⭐ El que más vende</div>}
            <div className="font-bold mb-1">{p.name}</div>
            <div className="text-xs text-ink-dim mb-3">{p.access}</div>
            <div className="text-3xl font-extrabold">${p.price}</div>
            <div className="text-xs text-ink-dim mb-3">precio de venta</div>
            <div className="mt-auto rounded-xl bg-neon-green/10 border border-neon-green/30 py-2">
              <div className="text-xs text-ink-dim">Tu comisión (50%)</div>
              <div className="text-xl font-extrabold text-neon-green">${p.commission}</div>
            </div>
          </GlassCard>
        ))}
      </div>
      <p className="text-center text-xs text-ink-dim mb-10">
        Pagos gestionados por Hotmart · cookie de seguimiento de larga duración · sin tope de ganancias.
      </p>

      {/* Cómo empezar */}
      <h2 className="text-2xl font-extrabold text-center mb-6">Empieza en 3 pasos</h2>
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        <HowStep n={1} title="Regístrate en Hotmart" body="Busca IdiomaConnect en el mercado de afiliados de Hotmart y solicita ser afiliado." />
        <HowStep n={2} title="Recibe tu link" body="Hotmart te da un link único. Cada venta con ese link es tu comisión." />
        <HowStep n={3} title="Promociona" body="Usa nuestros banners, textos y videos en tus redes, blog o lista de correos." />
      </div>

      <GlassCard strong className="p-6 text-center border border-neon-purple/40">
        <h3 className="text-xl font-extrabold mb-2">¿Listo para ganar con cada familia que aprende inglés?</h3>
        <p className="text-sm text-ink-dim mb-5">
          Postula al programa. Revisamos tu perfil y, si encajas, te enviamos en privado el
          kit completo de afiliado (banners, guiones de video, textos para correo) y un acceso
          de prueba para que conozcas la app por dentro.
        </p>
        <Link href="/contacto?motivo=afiliado">
          <NeonButton variant="primary" size="lg">Postular como afiliado</NeonButton>
        </Link>
        <p className="text-[11px] text-ink-dim mt-3">
          El kit y los materiales son exclusivos para afiliados aprobados.
        </p>
      </GlassCard>
    </main>
  );
}

function Why({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <GlassCard className="p-5">
      <div className="text-3xl mb-2">{emoji}</div>
      <h3 className="font-bold mb-1">{title}</h3>
      <p className="text-sm text-ink-dim">{body}</p>
    </GlassCard>
  );
}

function HowStep({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <GlassCard className="p-5 text-center relative">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-neon-purple text-surface font-extrabold text-sm flex items-center justify-center">
        {n}
      </div>
      <h3 className="font-bold mt-3 mb-1">{title}</h3>
      <p className="text-sm text-ink-dim">{body}</p>
    </GlassCard>
  );
}
