export default function TermsPage() {
  return (
    <main className="min-h-dvh px-5 py-12 max-w-3xl mx-auto relative z-10 prose prose-invert">
      <h1>Términos de Servicio</h1>
      <p><em>Última actualización: 14 de mayo de 2026</em></p>

      <h2>1. Aceptación</h2>
      <p>
        Al crear una cuenta en IdiomaConnect aceptas estos términos. Si no estás de acuerdo,
        no uses el servicio.
      </p>

      <h2>2. Edad y consentimiento</h2>
      <p>
        Solo personas mayores de 18 años pueden crear cuentas. Como adulto, declaras ser
        padre, madre o tutor legal de los menores cuyos perfiles agregues, y consientes
        expresamente el uso del servicio por su parte.
      </p>

      <h2>3. Suscripción</h2>
      <p>
        El Family Plan cuesta USD 9.99/mes o USD 79/año. Renovación automática hasta cancelar.
        Cancelas en <a href="/billing">Billing</a> o desde el portal de Stripe.
      </p>

      <h2>4. Uso aceptable</h2>
      <p>
        No puedes usar el servicio para entrenar modelos de IA, ni para fines comerciales no
        autorizados, ni para acosar a otros usuarios. No puedes intentar hackear, scrappear
        o sobrecargar el servicio.
      </p>

      <h2>5. Propiedad intelectual</h2>
      <p>
        El código, el diseño y los contenidos curados de IdiomaConnect son propiedad de la
        empresa. El contenido generado por IA durante tu uso es para uso personal de tu familia.
      </p>

      <h2>6. Limitación de responsabilidad</h2>
      <p>
        IdiomaConnect es una herramienta de apoyo al aprendizaje. No reemplaza la educación
        formal. No garantizamos resultados específicos.
      </p>

      <h2>7. Ley aplicable</h2>
      <p>
        Estos términos se rigen por las leyes de Chile. Disputas se resuelven en tribunales
        de Santiago.
      </p>
    </main>
  );
}
