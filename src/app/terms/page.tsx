import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos de Servicio",
  description: "Condiciones de uso de IdiomaConnect para familias y colegios.",
};

export default function TermsPage() {
  return (
    <main className="min-h-dvh px-5 py-12 max-w-3xl mx-auto relative z-10 prose prose-invert">
      <h1>Términos de Servicio</h1>
      <p><em>Última actualización: 11 de junio de 2026</em></p>

      <h2>1. Aceptación</h2>
      <p>
        Al crear una cuenta en IdiomaConnect (idiomaconnect.com), operado por
        <strong> [Razón social a completar]</strong>, aceptas estos Términos y nuestra{" "}
        <a href="/privacy">Política de Privacidad</a>. Si no estás de acuerdo, no uses el servicio.
      </p>

      <h2>2. Edad y consentimiento parental</h2>
      <p>
        Solo personas mayores de 18 años pueden crear cuentas. El servicio está diseñado para que lo
        usen niños y adolescentes de 8 a 18 años <strong>bajo la cuenta de un adulto responsable</strong>.
        Al agregar perfiles de menores declaras ser su padre, madre o tutor legal y autorizas
        expresamente su uso del servicio.
      </p>

      <h2>3. Prueba gratuita</h2>
      <ul>
        <li>La prueba gratis dura <strong>7 días</strong> y no requiere tarjeta.</li>
        <li>Se permite <strong>una (1) prueba gratuita por correo electrónico</strong>, de forma
          permanente. Crear cuentas adicionales para obtener nuevas pruebas no está permitido.</li>
        <li>Si la prueba termina sin contratar, los datos y avances se conservan por
          <strong> 30 días</strong> y luego se eliminan definitivamente.</li>
      </ul>

      <h2>4. Suscripciones y pagos</h2>
      <ul>
        <li>Planes familiares: <strong>USD 9,99/mes</strong> o <strong>USD 79/año</strong> (hasta 6
          perfiles). Los precios pueden incluir impuestos según tu país.</li>
        <li>Los pagos son procesados por <strong>Lemon Squeezy</strong> como comercializador oficial
          (Merchant of Record), quien emite la boleta o factura correspondiente.</li>
        <li>Las suscripciones se <strong>renuevan automáticamente</strong> al final de cada período
          (mensual o anual) hasta que canceles.</li>
        <li>Podemos modificar los precios avisando con al menos 30 días de anticipación; el nuevo
          precio aplica desde la siguiente renovación.</li>
      </ul>

      <h2>5. Cancelación (&quot;cancela cuando quieras&quot;)</h2>
      <p>
        Puedes cancelar tu suscripción en cualquier momento desde la sección de pagos de tu cuenta.
        Al cancelar:
      </p>
      <ul>
        <li>Se <strong>desactiva la renovación automática</strong>: no se te volverá a cobrar.</li>
        <li>Tu suscripción <strong>sigue activa hasta la fecha de término del período ya pagado</strong>
          (fin del mes o del año contratado), y hasta entonces conservas el acceso completo.</li>
        <li><strong>No se realizan devoluciones proporcionales</strong> por el tiempo no utilizado entre
          la fecha de cancelación y el término del período pagado.</li>
        <li>Terminado el período, los datos se conservan <strong>30 días</strong> por si decides volver,
          y luego se eliminan definitivamente.</li>
      </ul>

      <h2>6. Pagos fallidos</h2>
      <p>
        Si un cobro de renovación falla, te avisaremos por correo para que regularices el método de
        pago. Mientras tanto el acceso puede suspenderse. Los datos se conservan
        <strong> 30 días</strong> (planes familiares) o <strong>180 días</strong> (planes
        institucionales) desde la falla de pago; después se eliminan definitivamente.
      </p>

      <h2>7. Planes para colegios e instituciones</h2>
      <ul>
        <li>Se contratan por <strong>período anual</strong> y por número de cupos (alumnos), según
          propuesta aceptada por la institución.</li>
        <li>El colegio es responsable de contar con las autorizaciones de los apoderados de sus
          alumnos y de administrar sus cuentas de profesores y cursos.</li>
        <li>Condiciones específicas (precio por alumno, vigencia, renovación) se rigen por la
          propuesta comercial firmada, que complementa estos Términos.</li>
      </ul>

      <h2>8. Códigos de descuento</h2>
      <p>
        Los códigos promocionales son personales, válidos por el período y número de usos indicados
        en cada campaña, no son canjeables por dinero y pueden revocarse en caso de uso fraudulento.
      </p>

      <h2>9. Uso aceptable</h2>
      <p>
        No puedes: usar el servicio o sus contenidos para entrenar modelos de IA; revender el acceso
        o usarlo con fines comerciales no autorizados; compartir la cuenta fuera de tu núcleo
        familiar (planes familiares); intentar vulnerar, sobrecargar o extraer datos del servicio;
        ni usarlo para acosar o dañar a terceros. El incumplimiento puede terminar la cuenta sin
        derecho a reembolso.
      </p>

      <h2>10. Propiedad intelectual</h2>
      <p>
        El código, el diseño, la marca, el personaje Lumi y los contenidos curados de IdiomaConnect
        son propiedad de la empresa. El contenido generado por la IA durante tu uso queda licenciado
        para el uso personal y educativo de tu familia o institución.
      </p>

      <h2>11. Disponibilidad y limitación de responsabilidad</h2>
      <p>
        IdiomaConnect es una herramienta de apoyo al aprendizaje: complementa pero no reemplaza la
        educación formal y no garantiza resultados específicos. El servicio se presta &quot;tal cual&quot;,
        con esfuerzos razonables de disponibilidad; no respondemos por interrupciones de terceros
        (proveedores de internet, nube o IA). En cualquier caso, nuestra responsabilidad total se
        limita al monto pagado por el usuario en los últimos 12 meses.
      </p>

      <h2>12. Cambios a estos términos</h2>
      <p>
        Si modificamos estos Términos de forma sustancial, avisaremos por correo al titular con al
        menos 15 días de anticipación. El uso continuado del servicio implica aceptación.
      </p>

      <h2>13. Ley aplicable</h2>
      <p>
        Estos Términos se rigen por las leyes de la República de Chile. Cualquier controversia se
        someterá a los tribunales ordinarios de Santiago de Chile, sin perjuicio de los derechos
        irrenunciables del consumidor (Ley N.º 19.496).
      </p>
    </main>
  );
}
