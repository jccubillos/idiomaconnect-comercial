export default function PrivacyPage() {
  return (
    <main className="min-h-dvh px-5 py-12 max-w-3xl mx-auto relative z-10 prose prose-invert">
      <h1>Política de Privacidad</h1>
      <p><em>Última actualización: 14 de mayo de 2026</em></p>

      <h2>1. Quiénes somos</h2>
      <p>
        IdiomaConnect es un servicio operado por <strong>[Razón social a completar]</strong>,
        domiciliado en Chile. Contacto: <a href="mailto:privacidad@idiomaconnect.com">privacidad@idiomaconnect.com</a>.
      </p>

      <h2>2. Qué datos recolectamos</h2>
      <ul>
        <li><strong>De la cuenta del padre/madre:</strong> email, nombre de la familia, datos de facturación (procesados por Stripe — nosotros no almacenamos números de tarjeta).</li>
        <li><strong>De los perfiles de niños:</strong> nombre, fecha de nacimiento, hobbies, color de avatar, contexto familiar opcional (nombres de familiares y mascotas).</li>
        <li><strong>De uso:</strong> XP, niveles, sesiones de lecciones, score por habilidad, trofeos.</li>
        <li><strong>Audio:</strong> los clips se procesan en tiempo real por Groq (Whisper) para transcripción. <strong>NO se almacenan</strong> ni se usan para entrenamiento.</li>
      </ul>

      <h2>3. Consentimiento parental (COPPA / GDPR-K)</h2>
      <p>
        Solo los padres, madres o tutores legales pueden crear cuentas. Al hacerlo,
        otorgan consentimiento verificable para que sus hijos menores de edad usen el servicio.
      </p>

      <h2>4. Proveedores de IA</h2>
      <p>
        Las lecciones se generan con <strong>Groq</strong> (Llama 3.3 70B + Whisper).
        La síntesis de voz usa <strong>OpenAI TTS</strong>. Ambos están vinculados por
        Data Processing Addendums (DPA) y no entrenan modelos con datos de menores.
      </p>

      <h2>5. Borrado de cuenta</h2>
      <p>
        Puedes eliminar tu cuenta y todos los datos asociados en cualquier momento desde
        <a href="/account/delete"> Configuración → Eliminar cuenta</a>. El borrado es total
        y se ejecuta en menos de 30 días.
      </p>

      <h2>6. Derechos</h2>
      <p>
        Bajo la Ley 21.719 (Chile), GDPR-K (UE), COPPA (USA) y normativas equivalentes, tienes
        derecho a acceder, rectificar, exportar y borrar los datos personales de tu familia.
      </p>
    </main>
  );
}
