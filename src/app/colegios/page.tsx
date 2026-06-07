import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { LumiCharacter } from "@/components/coach/LumiCharacter";
import { SchoolLeadForm } from "@/components/school/SchoolLeadForm";

export const metadata = {
  title: "IdiomaConnect para Colegios e Instituciones",
  description: "Lleva el tutor de inglés personalizado a todo tu colegio. Panel de profesor, cursos y estadísticas de avance.",
};

export default function ColegiosPage() {
  return (
    <main className="relative z-10">
      {/* HERO */}
      <section className="px-5 pt-10 pb-12 max-w-4xl mx-auto text-center">
        <Link href="/" className="text-sm font-bold text-neon-cyan">← Volver al inicio</Link>
        <div className="flex flex-col items-center mt-6 mb-5">
          <LumiCharacter mood="greet" size={120} />
        </div>
        <div className="inline-block mb-4 px-3 py-1 rounded-full glass text-xs font-bold uppercase tracking-widest text-neon-purple">
          🏫 Para Colegios e Instituciones
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[0.95] mb-5 text-balance">
          El tutor de inglés personalizado,
          <br />
          <span className="text-glow-cyan text-neon-cyan">para todo tu colegio</span>
        </h1>
        <p className="text-lg text-ink-dim max-w-2xl mx-auto text-balance">
          Cada alumno practica con lecciones a su nivel. Cada profesor ve el avance de su curso.
          Y tú alineas el contenido con tu propio programa.
        </p>
      </section>

      {/* BENEFICIOS */}
      <section className="px-5 pb-12 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-4">
          <Benefit emoji="👩‍🏫" title="Panel de profesor" body="Cada profe ve sus cursos: avance por alumno, racha, nivel CEFR y quién está al día." />
          <Benefit emoji="📊" title="Estadísticas por curso" body="Mide participación y rendimiento de cada curso. Detecta a quién acompañar." />
          <Benefit emoji="🎯" title="Alineado a tu programa" body="El profesor define el tema de la semana y las lecciones se adaptan a lo que ven en clase." />
          <Benefit emoji="🧩" title="16 modos de práctica" body="Las 4 habilidades del CEFR: reading, listening, speaking y writing." />
          <Benefit emoji="💸" title="Precio por volumen" body="Mientras más alumnos, menor el costo por alumno. Contratación anual." />
          <Benefit emoji="🔒" title="Datos protegidos" body="Cada profesor ve solo sus cursos. El audio no se almacena." />
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="px-5 pb-12 max-w-4xl mx-auto">
        <h2 className="text-2xl font-extrabold text-center mb-6">¿Cómo partimos?</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <HowStep n={1} title="Nos contactas" body="Llena el formulario con los datos de tu institución." />
          <HowStep n={2} title="Armamos tu propuesta" body="Te enviamos un plan según el número de alumnos." />
          <HowStep n={3} title="Activamos tu colegio" body="Creamos cursos y cuentas. Tus profesores entran al panel." />
        </div>
      </section>

      {/* FORMULARIO */}
      <section className="px-5 pb-20 max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-extrabold mb-2">Solicita una propuesta</h2>
          <p className="text-sm text-ink-dim">Sin compromiso. Te respondemos a la brevedad.</p>
        </div>
        <SchoolLeadForm />
      </section>

      <footer className="px-5 py-10 max-w-3xl mx-auto text-center text-xs text-ink-dim">
        <div className="flex flex-wrap justify-center gap-4 mb-3">
          <Link href="/" className="hover:text-neon-cyan">Inicio</Link>
          <Link href="/privacy" className="hover:text-neon-cyan">Privacidad</Link>
          <Link href="/terms" className="hover:text-neon-cyan">Términos</Link>
        </div>
        <div>© 2026 IdiomaConnect · Hecho en 🇨🇱</div>
      </footer>
    </main>
  );
}

function Benefit({ emoji, title, body }: { emoji: string; title: string; body: string }) {
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
      <h3 className="font-bold mb-1 mt-3">{title}</h3>
      <p className="text-sm text-ink-dim">{body}</p>
    </GlassCard>
  );
}
