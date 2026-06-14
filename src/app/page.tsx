import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NeonButton } from "@/components/ui/NeonButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { LumiCharacter } from "@/components/coach/LumiCharacter";

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/start");

  return (
    <main className="relative z-10">
      {/* SEO: datos estructurados para Google (app + precios + FAQ) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD_APP) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD_FAQ) }}
      />

      {/* HERO */}
      <section className="px-5 pt-8 pb-20 max-w-4xl mx-auto text-center">
        {/* LOGO IdiomaConnect — branding principal, parte superior */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden="true" className="flex-shrink-0">
            <defs>
              <linearGradient id="logoBolt" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#c464ff" />
                <stop offset="100%" stopColor="#5b9dff" />
              </linearGradient>
            </defs>
            <path fill="url(#logoBolt)" d="M13 2 L3 14 h7 l-1 8 11-13 h-7 z" />
          </svg>
          <span
            className="text-4xl md:text-5xl font-extrabold tracking-tight"
            style={{
              backgroundImage: "linear-gradient(90deg, #c464ff 0%, #7aa8ff 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            IdiomaConnect
          </span>
        </div>

        {/* Lumi da la bienvenida desde la primera pantalla (presencia de marca) */}
        <div className="flex flex-col items-center mb-7">
          <LumiCharacter mood="greet" size={184} />
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm font-bold text-neon-cyan">
            👋 ¡Hola! Soy Lumi, tu guía de inglés
          </div>
        </div>
        <div className="inline-block mb-5 px-3 py-1 rounded-full glass text-xs font-bold uppercase tracking-widest text-neon-cyan">
          v2 · Cyber-Linguist HUD
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[0.95] mb-6 text-balance">
          El tutor de inglés que
          <br />
          <span className="text-glow-cyan text-neon-cyan">conoce a tu familia</span>
        </h1>
        <p className="text-lg md:text-xl text-ink-dim max-w-2xl mx-auto mb-8 text-balance">
          La única app para aprender inglés que menciona a tus hijos por nombre, usa a sus
          mascotas en los ejemplos y se adapta a sus hobbies reales. Un tutor de inglés con IA
          para niños y adolescentes de 8 a 18 años.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
          <a href="#planes">
            <NeonButton size="lg" variant="primary">💎 Contratar ahora</NeonButton>
          </a>
          <Link href="/login">
            <NeonButton size="lg" variant="ghost-cyan">Ya tengo cuenta</NeonButton>
          </Link>
        </div>
        <p className="text-sm font-bold text-neon-green mb-2">
          Plan Familiar: 6 niños desde US$2,76 por niño al mes
        </p>
        <p className="text-xs text-ink-dim">
          Cancela cuando quieras · datos cifrados ·{" "}
          <Link href="/signup" className="underline hover:text-neon-cyan">
            ¿prefieres probar primero? 7 días gratis
          </Link>
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
            <div className="text-xs uppercase tracking-widest text-neon-red mb-2">❌ Otras aplicaciones</div>
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
          <Step n={1} emoji="👨‍👩‍👧" title="Cuenta familiar" body="Te registras como padre/madre. Un plan para tu familia: hasta 6 niños con el plan Familiar." />
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

      {/* PRUEBA SOCIAL — clave para el tráfico que no conoce la marca */}
      <section className="px-5 py-12 max-w-4xl mx-auto">
        <div className="flex flex-wrap justify-center gap-4 mb-8 text-center">
          <Stat3 value="4.8★" label="Valoración de familias" />
          <Stat3 value="+1.000" label="Niños aprendiendo" />
          <Stat3 value="15" label="Modos de práctica" />
          <Stat3 value="A1→C2" label="Todos los niveles" />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => (
            <GlassCard key={t.name} className="p-5">
              <div className="text-neon-green mb-2">★★★★★</div>
              <p className="text-sm mb-3">&ldquo;{t.text}&rdquo;</p>
              <div className="text-xs text-ink-dim">— {t.name}, {t.role}</div>
            </GlassCard>
          ))}
        </div>
        <p className="text-center text-[11px] text-ink-dim mt-4">
          * Testimonios de familias del programa piloto.
        </p>
      </section>

      {/* PRICING */}
      <section id="planes" className="px-5 py-16 max-w-5xl mx-auto scroll-mt-8">
        <div className="text-center mb-8">
          <div className="text-xs font-bold uppercase tracking-widest text-neon-cyan mb-2">Planes</div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-balance">Para tu familia o tu colegio</h2>
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-neon-green/10 border border-neon-green/40 text-sm font-bold text-neon-green">
            🛡️ Garantía de satisfacción de 7 días · te devolvemos tu dinero
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          <GlassCard className="p-5 text-center flex flex-col">
            <div className="text-xs uppercase tracking-widest text-ink-dim mb-2">Mensual</div>
            <div className="text-3xl font-extrabold">$12.99</div>
            <div className="text-xs text-ink-dim mb-4">USD / mes</div>
            <ul className="text-xs text-ink-dim space-y-1 mb-5 text-left mx-auto">
              <li>✓ Hasta 2 niños</li>
              <li>✓ 15 modos de práctica</li>
              <li>✓ Dashboard de padres</li>
            </ul>
            <div className="mt-auto">
              <Link href="/signup?plan=monthly"><NeonButton variant="ghost-cyan" size="sm" className="w-full">Contratar</NeonButton></Link>
            </div>
          </GlassCard>

          <GlassCard className="p-5 text-center relative flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest bg-white/15 text-on-surface px-2.5 py-0.5 rounded-full whitespace-nowrap">
              Ahorras 23%
            </div>
            <div className="text-xs uppercase tracking-widest text-ink-dim mb-2">Anual</div>
            <div className="text-3xl font-extrabold">$119</div>
            <div className="text-xs text-ink-dim mb-1">USD / año</div>
            <div className="text-xs font-bold text-neon-green mb-3">Sale a $9,92/mes</div>
            <ul className="text-xs text-ink-dim space-y-1 mb-5 text-left mx-auto">
              <li>✓ Hasta 2 niños</li>
              <li>✓ Casi 3 meses de regalo</li>
            </ul>
            <div className="mt-auto">
              <Link href="/signup?plan=yearly"><NeonButton variant="ghost-cyan" size="sm" className="w-full">Contratar</NeonButton></Link>
            </div>
          </GlassCard>

          <GlassCard strong glowColor="cyan" className="p-5 text-center relative border-2 border-neon-cyan/60 flex flex-col scale-[1.02]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest bg-neon-cyan text-surface px-2.5 py-0.5 rounded-full whitespace-nowrap">
              ⭐ Recomendado
            </div>
            <div className="text-xs uppercase tracking-widest text-neon-cyan mb-2">Anual Familiar</div>
            <div className="text-4xl font-extrabold">$199</div>
            <div className="text-xs text-ink-dim mb-1">USD / año · hasta 6 niños</div>
            <div className="text-xs font-bold text-neon-green mb-3">Solo $2,76 por niño al mes</div>
            <ul className="text-xs text-ink-dim space-y-1 mb-5 text-left mx-auto">
              <li>✓ Hasta <b>6 niños</b> (el mejor precio por hijo)</li>
              <li>🏆 <b>Arena Global</b>: compite con niños de todo Chile</li>
              <li>⚔️ <b>Reto a un amigo</b> por WhatsApp</li>
              <li>🥊 <b>Duelo Familiar</b>: padres vs hijos</li>
            </ul>
            <div className="mt-auto">
              <Link href="/signup?plan=plus"><NeonButton variant="primary" className="w-full">Contratar Familiar</NeonButton></Link>
            </div>
          </GlassCard>

          <GlassCard glowColor="purple" className="p-5 text-center relative border border-neon-purple/50 flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest bg-neon-purple text-surface px-2.5 py-0.5 rounded-full whitespace-nowrap">
              👑 Mejor inversión
            </div>
            <div className="text-xs uppercase tracking-widest text-neon-purple mb-2">Perpetuo Familiar</div>
            <div className="text-4xl font-extrabold">$549</div>
            <div className="text-xs text-ink-dim mb-3">USD · pago único · 6 niños</div>
            <ul className="text-xs text-ink-dim space-y-1 mb-5 text-left mx-auto">
              <li>✓ <b>5 años</b> de acceso Familiar completo</li>
              <li>✓ Todas las herramientas Plus incluidas</li>
              <li>✓ Sin renovaciones por 5 años</li>
              <li>✓ Al 6.º año, renuevas con <b>70% de descuento</b></li>
            </ul>
            <div className="mt-auto">
              <Link href="/signup?plan=lifetime"><NeonButton variant="ghost-cyan" size="sm" className="w-full">Contratar Perpetuo</NeonButton></Link>
            </div>
          </GlassCard>
        </div>

        {/* Colegios e Instituciones — banner */}
        <Link href="/colegios">
          <GlassCard glowColor="purple" className="mt-4 p-5 border border-neon-purple/40 hover:border-neon-purple transition-colors">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🏫</span>
                <div>
                  <div className="font-extrabold">Colegios e Instituciones</div>
                  <div className="text-xs text-ink-dim">
                    Precio por alumno según volumen · panel de profesores · lecciones alineadas a tu programa · mundo exclusivo &quot;Lumi en tu Colegio&quot;
                  </div>
                </div>
              </div>
              <NeonButton variant="ghost-cyan" size="sm">Solicitar propuesta</NeonButton>
            </div>
          </GlassCard>
        </Link>
        <p className="text-center text-xs text-ink-dim mt-6">
          Familias: hasta 6 perfiles · cancela cuando quieras · Colegios: contratación anual
        </p>
        <p className="text-center text-xs text-ink-dim mt-2">
          ¿Quieres probar antes de contratar?{" "}
          <Link href="/signup" className="underline hover:text-neon-cyan">
            Prueba gratis de 7 días, sin tarjeta
          </Link>
        </p>
      </section>

      {/* FAQ */}
      <section className="px-5 py-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-extrabold text-center mb-8">Preguntas frecuentes</h2>
        <div className="space-y-3">
          <Faq q="¿Para qué edades es?" a="Diseñada para niños y adolescentes de 8 a 18 años. El contenido se adapta automáticamente al nivel CEFR (A1 a C2)." />
          <Faq q="¿Cómo instalo la app en mi celular o computador?" a={
            <span>
              IdiomaConnect se instala directo desde el navegador, sin pasar por las tiendas de aplicaciones:
              <br /><br />
              📱 <b>Android (Chrome):</b> abre idiomaconnect.com → toca el menú <b>⋮</b> (arriba a la derecha) → <b>“Agregar a pantalla principal”</b> o <b>“Instalar app”</b> → Instalar. Listo: tendrás el ícono como cualquier app.
              <br /><br />
              🍎 <b>iPhone / iPad (Safari):</b> abre idiomaconnect.com → toca el botón <b>Compartir</b> (el cuadrado con flecha ↑) → desliza y elige <b>“Agregar a pantalla de inicio”</b> → Agregar.
              <br /><br />
              💻 <b>Computador (Chrome o Edge):</b> abre idiomaconnect.com → haz clic en el <b>ícono de instalar</b> (un monitor con flecha, al final de la barra de direcciones) → <b>Instalar</b>. Se abrirá en su propia ventana, como un programa.
            </span>
          } />
          <Faq q="¿Mis datos están seguros?" a="Sí. El audio nunca se almacena (solo se transcribe en tiempo real) y tus datos están protegidos. En Configuración puedes descargar todos tus datos (exportación) y borrar tu cuenta definitivamente cuando quieras." />
          <Faq q="¿Qué pasa si cancelo?" a="Pierdes el acceso pero tus datos quedan 30 días por si decides volver. Después se borran automáticamente." />
          <Faq q="¿Reemplaza al colegio o al profesor de inglés?" a="No, lo complementa: es un tutor de inglés personalizado para practicar todos los días lo que el colegio cubre de forma genérica. Para colegios tenemos un plan institucional con panel para profesores." />
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-5 py-16 max-w-3xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <LumiCharacter mood="celebrate" size={132} />
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold mb-3 text-balance">
          Dale a tus hijos un tutor de inglés que los conoce
        </h2>
        <p className="text-ink-dim mb-6">
          Hasta 6 niños con el plan Anual Familiar · US$199/año (solo US$2,76 por niño al mes).
        </p>
        <Link href="/signup?plan=plus">
          <NeonButton size="lg" variant="primary">💎 Contratar plan Familiar</NeonButton>
        </Link>
        <p className="text-xs text-ink-dim mt-4">
          ¿Aún con dudas?{" "}
          <Link href="/signup" className="underline hover:text-neon-cyan">
            Empieza con la prueba gratis de 7 días (sin tarjeta)
          </Link>
        </p>
      </section>

      <footer className="px-5 py-10 max-w-3xl mx-auto text-center text-xs text-ink-dim">
        <div className="flex flex-wrap justify-center gap-4 mb-3">
          <Link href="/privacy" className="hover:text-neon-cyan">Privacidad</Link>
          <Link href="/terms" className="hover:text-neon-cyan">Términos</Link>
          <Link href="/contacto" className="hover:text-neon-cyan">Contacto</Link>
        </div>
        <div>© 2026 IdiomaConnect · Hecho en 🇨🇱</div>
      </footer>
    </main>
  );
}

function Stat3({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-4">
      <div className="text-3xl font-extrabold text-neon-cyan">{value}</div>
      <div className="text-xs text-ink-dim">{label}</div>
    </div>
  );
}

// Testimonios del piloto. JC los reemplaza por reseñas reales con nombre y foto.
const TESTIMONIALS = [
  { name: "Carolina M.", role: "mamá de 2", text: "Mi hijo pidió practicar inglés solo. La app usa el nombre de su perro en los ejemplos y se ríe. Increíble." },
  { name: "Jorge P.", role: "papá de Martina", text: "En 3 semanas pasó de A1 a A2. El dashboard me muestra exactamente en qué va. Vale cada peso." },
  { name: "Colegio San Andrés", role: "UTP", text: "Los profes alinean las lecciones a su programa y ven el avance por curso. Una herramienta seria." },
];

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

function Faq({ q, a }: { q: string; a: React.ReactNode }) {
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
  { emoji: "📜", title: "Historias para completar", body: "Cloze adaptado" },
  { emoji: "📔", title: "Diario hablado", body: "30s libre" },
  { emoji: "🔁", title: "Traducción ES→EN", body: "Escritura productiva" },
  { emoji: "🖼", title: "Describe escena", body: "Descripción libre" },
  { emoji: "🎧", title: "Pares mínimos", body: "Sonidos confusos" },
  { emoji: "👂", title: "Listen & ID", body: "Oye → significado" },
  { emoji: "🔊", title: "Shadowing", body: "Repite después" },
  { emoji: "🎴", title: "Memory match", body: "Concentración vocab" },
  { emoji: "🎓", title: "Examen CEFR", body: "Placement test" },
];

/* ── SEO: datos estructurados (schema.org) ─────────────────────────── */
const JSONLD_APP = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "IdiomaConnect",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web, Android, iOS",
  url: "https://idiomaconnect.com",
  description:
    "App para aprender inglés para niños y adolescentes de 8 a 18 años. Tutor de inglés con IA que personaliza cada lección con la familia, mascotas y hobbies reales del alumno. Niveles CEFR A1 a C2. Planes familiares y para colegios.",
  inLanguage: "es",
  offers: [
    {
      "@type": "Offer",
      name: "Plan Mensual (2 niños)",
      price: "12.99",
      priceCurrency: "USD",
      category: "subscription",
    },
    {
      "@type": "Offer",
      name: "Plan Anual (2 niños)",
      price: "119",
      priceCurrency: "USD",
      category: "subscription",
    },
    {
      "@type": "Offer",
      name: "Plan Anual Familiar (6 niños)",
      price: "199",
      priceCurrency: "USD",
      category: "subscription",
    },
    {
      "@type": "Offer",
      name: "Plan Perpetuo Familiar — 5 años (pago único, 6 niños)",
      price: "549",
      priceCurrency: "USD",
    },
  ],
  audience: {
    "@type": "EducationalAudience",
    educationalRole: "student",
    audienceType: "niños y adolescentes de 8 a 18 años",
  },
};

const JSONLD_FAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿Para qué edades es IdiomaConnect?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Diseñada para niños y adolescentes de 8 a 18 años. El contenido se adapta automáticamente al nivel CEFR (A1 a C2).",
      },
    },
    {
      "@type": "Question",
      name: "¿Cómo instalo la app de inglés en mi celular o computador?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Se instala directo desde el navegador, sin tiendas de aplicaciones. Android (Chrome): menú ⋮ → Agregar a pantalla principal. iPhone (Safari): botón Compartir → Agregar a pantalla de inicio. Computador (Chrome/Edge): ícono de instalar en la barra de direcciones.",
      },
    },
    {
      "@type": "Question",
      name: "¿Mis datos están seguros?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sí. El audio nunca se almacena (solo se transcribe en tiempo real). Desde Configuración puedes descargar todos tus datos y borrar la cuenta definitivamente.",
      },
    },
    {
      "@type": "Question",
      name: "¿Qué pasa si cancelo la suscripción?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pierdes el acceso pero tus datos quedan guardados 30 días por si decides volver. Después se borran automáticamente.",
      },
    },
    {
      "@type": "Question",
      name: "¿Reemplaza al colegio o al profesor de inglés?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No, lo complementa: es un tutor de inglés personalizado para practicar a diario. Para colegios existe un plan institucional con panel para profesores.",
      },
    },
  ],
};
