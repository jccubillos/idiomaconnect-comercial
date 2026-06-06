import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NeonButton } from "@/components/ui/NeonButton";
import { GlassCard } from "@/components/ui/GlassCard";

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/profiles");

  return (
    <main className="relative z-10">
      {/* HERO */}
      <section className="px-5 pt-16 pb-20 max-w-4xl mx-auto text-center">
        <div className="inline-block mb-5 px-3 py-1 rounded-full glass text-xs font-bold uppercase tracking-widest text-neon-cyan">
          v2 · Cyber-Linguist HUD
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[0.95] mb-6 text-balance">
          El tutor de inglés que
          <br />
          <span className="text-glow-cyan text-neon-cyan">conoce a tu familia</span>
        </h1>
        <p className="text-lg md:text-xl text-ink-dim max-w-2xl mx-auto mb-8 text-balance">
          La única app que menciona a tus hijos por nombre, usa a sus mascotas en los ejemplos
          y se adapta a sus hobbies reales. Para chicos y adolescentes de 8 a 16 años.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Link href="/signup">
            <NeonButton size="lg" variant="primary">Empezar gratis · 7 días</NeonButton>
          </Link>
          <Link href="/login">
            <NeonButton size="lg" variant="ghost-cyan">Ya tengo cuenta</NeonButton>
          </Link>
        </div>
        <p className="text-xs text-ink-dim">
          Sin tarjeta · cancela cuando quieras · datos cifrados
        </p>
      </section>

      {/* PROBLEM / WHY DIFFERENT */}
      <section className="px-5 py-16 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-xs font-bold uppercase tracking-widest text-neon-red mb-2">
            El problema
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3 text-balance">
            Las apps actuales tratan a tu hijo como un{" "}
            <span className="text-neon-red">número anónimo</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <GlassCard className="p-5 border border-neon-red/30">
            <div className="text-xs uppercase tracking-widest text-neon-red mb-2">❌ Duolingo / Lingokids</div>
            <p className="text-sm">
              "<i>The cat is on the table</i>" — una oración genérica
              que no le habla específicamente a tu hijo.
            </p>
          </GlassCard>
          <GlassCard glowColor="cyan" className="p-5 border border-neon-cyan/40">
            <div className="text-xs uppercase tracking-widest text-neon-cyan mb-2">✓ IdiomaConnect</div>
            <p className="text-sm">
              "<i>Antonia's cat Rosita is sleeping on the table while she practices tennis</i>"
              — usa la mascota real de la familia.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-5 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-xs font-bold uppercase tracking-widest text-neon-cyan mb-2">Cómo funciona</div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-balance">
            3 pasos para empezar
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <Step n={1} emoji="👨‍👩‍👧" title="Cuenta familiar" body="Te registras como padre/madre. Una sola suscripción cubre hasta 6 niños." />
          <Step n={2} emoji="📝" title="Onboarding personalizado" body="Cuéntanos: nombres, hobbies, mascotas, hermanos. Toma 3 minutos." />
          <Step n={3} emoji="🎮" title="Aprende todos los días" body="Lecciones que mencionan a tu familia real. 15 modos de práctica distintos." />
        </div>
      </section>

      {/* FEATURES — 15+ modes */}
      <section className="px-5 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-xs font-bold uppercase tracking-widest text-neon-purple mb-2">15 modos · 1 app</div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-2 text-balance">
            Cubrimos las 4 habilidades del CEFR
          </h2>
          <p className="text-ink-dim">Reading · Listening · Speaking · Writing</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
          {MODES_LANDING.map((m) => (
            <GlassCard key={m.title} className="p-4">
              <div className="text-2xl mb-1.5">{m.emoji}</div>
              <div className="font-bold text-sm mb-0.5">{m.title}</div>
              <div className="text-xs text-ink-dim">{m.body}</div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* DIFFERENTIATION */}
      <section className="px-5 py-16 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-balance">
            Más que gamificación. <span className="text-neon-green">Pedagogía real.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <GlassCard glowColor="green" className="p-5">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-bold mb-1">Personalización con contexto</h3>
            <p className="text-sm text-ink-dim">Mascotas, hermanos, hobbies, abuelos. La IA los recuerda y los usa en cada ejemplo.</p>
          </GlassCard>
          <GlassCard glowColor="cyan" className="p-5">
            <div className="text-3xl mb-2">📈</div>
            <h3 className="font-bold mb-1">Nivel CEFR adaptativo</h3>
            <p className="text-sm text-ink-dim">A1 → C2. La complejidad sube sola según el rendimiento. Examen diagnóstico disponible.</p>
          </GlassCard>
          <GlassCard glowColor="purple" className="p-5">
            <div className="text-3xl mb-2">🧠</div>
            <h3 className="font-bold mb-1">Repaso espaciado (SRS)</h3>
            <p className="text-sm text-ink-dim">Algoritmo SM-2 científico. Las palabras que cuestan vuelven más seguido.</p>
          </GlassCard>
          <GlassCard glowColor="red" className="p-5">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-bold mb-1">Dashboard de padres</h3>
            <p className="text-sm text-ink-dim">Stats por habilidad, sesiones, racha y reporte semanal por email.</p>
          </GlassCard>
        </div>
      </section>

      {/* PRICING */}
      <section className="px-5 py-16 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-xs font-bold uppercase tracking-widest text-neon-cyan mb-2">Plan único</div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-balance">Una familia, una suscripción</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <GlassCard className="p-6 text-center">
            <div className="text-xs uppercase tracking-widest text-ink-dim mb-2">Mensual</div>
            <div className="text-4xl font-extrabold">$9.99</div>
            <div className="text-sm text-ink-dim mb-4">USD / mes</div>
            <Link href="/signup"><NeonButton variant="ghost-cyan" className="w-full">Probar 7 días gratis</NeonButton></Link>
          </GlassCard>
          <GlassCard strong glowColor="cyan" className="p-6 text-center relative border border-neon-cyan/40">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest bg-neon-cyan text-surface px-2 py-0.5 rounded-full">
              Ahorras 34%
            </div>
            <div className="text-xs uppercase tracking-widest text-ink-dim mb-2">Anual</div>
            <div className="text-4xl font-extrabold">$79</div>
            <div className="text-sm text-ink-dim mb-4">USD / año (~$6.58/mes)</div>
            <Link href="/signup"><NeonButton variant="primary" className="w-full">Probar 7 días gratis</NeonButton></Link>
          </GlassCard>
        </div>
        <p className="text-center text-xs text-ink-dim mt-6">
          Hasta 6 perfiles · todas las features · sin contratos · cancela cuando quieras
        </p>
      </section>

      {/* FAQ */}
      <section className="px-5 py-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-extrabold text-center mb-8">Preguntas frecuentes</h2>
        <div className="space-y-3">
          <Faq q="¿Para qué edades es?" a="Diseñada para chicos y adolescentes de 8 a 16 años. El contenido se adapta automáticamente al nivel CEFR (A1 a C2)." />
          <Faq q="¿Mis datos están seguros?" a="Sí. El audio nunca se almacena (solo se transcribe en tiempo real). Los nombres de la familia están cifrados. Tienes derecho de exportación y borrado en un click." />
          <Faq q="¿Funciona en celular?" a="Sí. Es una PWA: la instalas en el celular como una app nativa y funciona en iOS y Android sin pasar por la tienda." />
          <Faq q="¿Qué pasa si cancelo?" a="Pierdes el acceso pero tus datos quedan 30 días por si decides volver. Después se borran automáticamente." />
          <Faq q="¿Reemplaza al colegio?" a="No. Es complemento. Un tutor personalizado para reforzar lo que el colegio cubre genéricamente." />
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-5 py-16 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-3 text-balance">
          Empieza hoy. Sin tarjeta.
        </h2>
        <p className="text-ink-dim mb-6">7 días para que tus hijos lo prueben con tu familia real.</p>
        <Link href="/signup">
          <NeonButton size="lg" variant="primary">Crear cuenta familiar</NeonButton>
        </Link>
      </section>

      <footer className="px-5 py-10 max-w-3xl mx-auto text-center text-xs text-ink-dim">
        <div className="flex flex-wrap justify-center gap-4 mb-3">
          <Link href="/privacy" className="hover:text-neon-cyan">Privacidad</Link>
          <Link href="/terms" className="hover:text-neon-cyan">Términos</Link>
          <a href="mailto:hola@idiomaconnect.app" className="hover:text-neon-cyan">Contacto</a>
        </div>
        <div>© 2026 IdiomaConnect · Hecho en 🇨🇱</div>
      </footer>
    </main>
  );
}

function Step({ n, emoji, title, body }: { n: number; emoji: string; title: string; body: string }) {
  return (
    <GlassCard className="p-5 text-center relative">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-neon-cyan text-surface font-extrabold text-sm flex items-center justify-center">
        {n}
      </div>
      <div className="text-4xl mt-3 mb-2">{emoji}</div>
      <h3 className="font-bold mb-1">{title}</h3>
      <p className="text-sm text-ink-dim">{body}</p>
    </GlassCard>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="glass rounded-xl px-4 py-3 group">
      <summary className="cursor-pointer list-none flex justify-between items-center font-bold text-sm">
        {q}
        <span className="text-neon-cyan ml-2 group-open:rotate-45 transition-transform">+</span>
      </summary>
      <p className="text-sm text-ink-dim mt-2">{a}</p>
    </details>
  );
}

const MODES_LANDING = [
  { emoji: "📖", title: "Lección clásica", body: "Quiz + completar" },
  { emoji: "⚔️", title: "Battle Mode", body: "Vocab vs Syntax Virus" },
  { emoji: "💬", title: "Conversación", body: "Role-play 1-on-1" },
  { emoji: "🎤", title: "Pronunciación", body: "Grábate y recibe score" },
  { emoji: "🃏", title: "Flashcards", body: "Vocabulario rápido" },
  { emoji: "🧠", title: "SRS", body: "Repaso espaciado" },
  { emoji: "🧩", title: "Armar oraciones", body: "Drag-tiles" },
  { emoji: "📜", title: "Historia con huecos", body: "Cloze adaptado" },
  { emoji: "📔", title: "Diario hablado", body: "30s libre" },
  { emoji: "🔁", title: "Traducción ES→EN", body: "Escritura productiva" },
  { emoji: "🖼", title: "Describe escena", body: "Descripción libre" },
  { emoji: "🎧", title: "Pares mínimos", body: "Sonidos confusos" },
  { emoji: "👂", title: "Listen & ID", body: "Oye → significado" },
  { emoji: "🔊", title: "Shadowing", body: "Repite después" },
  { emoji: "🎴", title: "Memory match", body: "Concentración vocab" },
  { emoji: "🎓", title: "Examen CEFR", body: "Placement test" },
];
