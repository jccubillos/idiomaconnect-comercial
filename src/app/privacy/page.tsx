import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Cómo IdiomaConnect protege los datos de tu familia y de los alumnos de colegios.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh px-5 py-12 max-w-3xl mx-auto relative z-10 prose prose-invert">
      <h1>Política de Privacidad</h1>
      <p><em>Última actualización: 11 de junio de 2026</em></p>

      <h2>1. Quiénes somos</h2>
      <p>
        IdiomaConnect (<strong>idiomaconnect.com</strong>) es un servicio de aprendizaje de inglés
        para niños y adolescentes de 8 a 18 años, operado por <strong>[Razón social a completar]</strong>,
        domiciliado en Chile (el &quot;Responsable&quot; del tratamiento de datos).
        Contacto de privacidad: <a href="mailto:privacidad@idiomaconnect.com">privacidad@idiomaconnect.com</a>.
      </p>

      <h2>2. Qué datos recolectamos y para qué</h2>
      <ul>
        <li>
          <strong>De la cuenta del adulto responsable:</strong> correo electrónico, nombre de la
          familia y contraseña (almacenada cifrada). Finalidad: crear y administrar la cuenta.
        </li>
        <li>
          <strong>De pago:</strong> los pagos son procesados por <strong>Lemon Squeezy</strong> como
          comercializador oficial (Merchant of Record). <strong>Los datos de tarjeta nunca llegan a
          nuestros servidores</strong>; solo recibimos identificadores de cliente y suscripción, y el
          estado del pago.
        </li>
        <li>
          <strong>De los perfiles de niños:</strong> nombre o apodo, fecha de nacimiento (opcional),
          hobbies e intereses, y contexto familiar opcional (nombres de familiares y mascotas).
          Finalidad: personalizar las lecciones. Recomendamos usar solo nombres de pila o apodos.
        </li>
        <li>
          <strong>De uso y progreso:</strong> XP, nivel CEFR, sesiones de práctica, puntajes por
          habilidad, rachas y trofeos. Finalidad: seguimiento pedagógico y paneles de padres/profesores.
        </li>
        <li>
          <strong>Audio:</strong> los ejercicios de habla se procesan <strong>en tiempo real</strong> para
          transcribirlos y evaluarlos. <strong>El audio NO se almacena</strong> ni se usa para entrenar
          modelos de inteligencia artificial.
        </li>
        <li>
          <strong>Formularios de contacto y de colegios:</strong> los datos que envíes (nombre, correo,
          teléfono, mensaje y archivos adjuntos) se usan solo para responder tu solicitud.
        </li>
      </ul>

      <h2>3. Niños y consentimiento parental</h2>
      <p>
        Las cuentas solo pueden ser creadas por personas mayores de 18 años. Al crear perfiles de
        menores, el adulto declara ser su padre, madre o tutor legal y otorga consentimiento
        verificable para el uso del servicio (principios COPPA / GDPR-K). Los niños no pueden crear
        cuentas por sí mismos, no hay publicidad dirigida a menores y no vendemos datos personales.
      </p>

      <h2>4. Cuentas de colegios</h2>
      <p>
        En los planes institucionales, el colegio crea y administra los perfiles de sus alumnos y
        actúa como responsable de recabar las autorizaciones de los apoderados. IdiomaConnect trata
        esos datos por encargo del colegio, exclusivamente para prestar el servicio educativo: los
        profesores del curso solo ven el progreso de sus propios alumnos.
      </p>

      <h2>5. Proveedores de servicios (encargados de tratamiento)</h2>
      <p>Usamos proveedores con garantías contractuales de protección de datos (DPA):</p>
      <ul>
        <li><strong>Supabase</strong> — base de datos y autenticación (servidores en EE. UU.).</li>
        <li><strong>Vercel</strong> — alojamiento de la aplicación.</li>
        <li><strong>Groq</strong> — generación de lecciones y transcripción de voz en tiempo real.</li>
        <li><strong>OpenAI</strong> — síntesis de voz (pronunciación de palabras y frases).</li>
        <li><strong>Lemon Squeezy</strong> — procesamiento de pagos y facturación.</li>
        <li><strong>Resend</strong> — envío de correos transaccionales.</li>
      </ul>
      <p>
        Ninguno de estos proveedores está autorizado a usar datos de menores para entrenar modelos
        de IA ni para fines propios. Al usar el servicio aceptas esta transferencia internacional
        de datos con las garantías indicadas.
      </p>

      <h2>6. Cuánto tiempo guardamos los datos</h2>
      <ul>
        <li><strong>Cuenta activa:</strong> mientras la suscripción esté vigente.</li>
        <li><strong>Prueba gratuita que no se convierte en suscripción:</strong> los datos se conservan
          <strong> 30 días</strong> desde el término de la prueba y luego se eliminan definitivamente.</li>
        <li><strong>Suscripción familiar con pago fallido o cancelada:</strong> los datos se conservan
          <strong> 30 días</strong> para permitir la reactivación y luego se eliminan definitivamente.</li>
        <li><strong>Cuentas institucionales (colegios):</strong> los datos se conservan
          <strong> 180 días</strong> desde el incumplimiento de pago o término del contrato.</li>
        <li><strong>Borrado manual:</strong> puedes eliminar la cuenta en cualquier momento (ver punto 8).</li>
      </ul>

      <h2>7. Comunicaciones</h2>
      <p>
        Enviamos correos <strong>transaccionales</strong> (estado de la cuenta, pagos, avisos de
        retención de datos) y correos <strong>promocionales</strong> (recordatorios y ofertas tras la
        prueba gratis). Todos los correos promocionales incluyen un enlace para darte de baja con un
        clic; los transaccionales se envían solo cuando corresponde al estado de tu cuenta.
      </p>

      <h2>8. Tus derechos (acceso, exportación, rectificación y borrado)</h2>
      <p>
        Conforme a la Ley N.º 21.719 de Chile y normativas equivalentes (GDPR de la UE, COPPA de
        EE. UU.), puedes en cualquier momento:
      </p>
      <ul>
        <li><strong>Exportar</strong> todos los datos de tu familia en formato JSON desde
          Configuración → &quot;Descargar mis datos&quot;.</li>
        <li><strong>Rectificar</strong> los datos de los perfiles desde la propia app.</li>
        <li><strong>Eliminar</strong> la cuenta completa desde Configuración → &quot;Eliminar cuenta&quot;.
          El borrado es total (perfiles, progreso, repaso, trofeos y archivos) e inmediato.</li>
        <li>Ejercer cualquier otro derecho escribiendo a
          <a href="mailto:privacidad@idiomaconnect.com"> privacidad@idiomaconnect.com</a>.</li>
      </ul>

      <h2>9. Seguridad</h2>
      <p>
        Aplicamos cifrado en tránsito (HTTPS), contraseñas cifradas, aislamiento de datos por familia
        y por colegio a nivel de base de datos (Row Level Security), control de acceso por roles y
        registro de auditoría en las operaciones administrativas.
      </p>

      <h2>10. Cambios a esta política</h2>
      <p>
        Si modificamos esta política de forma sustancial, lo avisaremos por correo al titular de la
        cuenta con al menos 15 días de anticipación. La fecha de &quot;última actualización&quot; siempre
        refleja la versión vigente.
      </p>
    </main>
  );
}
