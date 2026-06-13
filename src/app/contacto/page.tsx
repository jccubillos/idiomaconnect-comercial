import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "¿Necesitas ayuda con IdiomaConnect? Escríbenos: soporte técnico, pagos, colegios o sugerencias. Te respondemos pronto.",
};

export default function ContactoPage() {
  return (
    <main className="min-h-dvh px-5 py-12 max-w-2xl mx-auto relative z-10">
      <Link href="/" className="text-sm font-bold text-neon-cyan">← Volver al inicio</Link>

      <header className="text-center my-8">
        <div className="text-5xl mb-3">💬</div>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Contáctanos</h1>
        <p className="text-sm text-ink-dim max-w-md mx-auto">
          ¿Dudas, problemas o ideas? Completa el formulario y te responderemos al correo
          lo antes posible.
        </p>
      </header>

      <ContactForm />

      <p className="text-center text-xs text-ink-dim mt-6">
        También puedes escribirnos directo a{" "}
        <a href="mailto:appidiomaconnect@gmail.com" className="text-neon-cyan underline">
          appidiomaconnect@gmail.com
        </a>
      </p>
    </main>
  );
}
