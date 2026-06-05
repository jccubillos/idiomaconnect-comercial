/**
 * Prueba de integración contra la base de datos REAL (Supabase).
 * Crea un usuario/familia/kid de prueba, valida las features nuevas a nivel de
 * datos, y LIMPIA todo al final (borrar el usuario hace cascada).
 *
 * Uso: node scripts/smoke-db.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// --- Cargar .env.local manualmente (sin dependencias extra) ---
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(2);
}

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

// Réplica de la lógica pura (ya unit-testeada en cefr.test.ts) para el round-trip de DB.
const THRESH = { A1: 0, A2: 150, B1: 400, B2: 900, C1: 1700, C2: 3000 };
const codeFor = (xp) => { let c = "A1"; for (const [code, t] of Object.entries(THRESH)) if (xp >= t) c = code; return c; };
const placementXp = (cur, lvl) => Math.max(cur, THRESH[lvl]);

let pass = 0, fail = 0;
const check = (name, cond, extra = "") => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ FALLO: ${name} ${extra}`); }
};

console.log("\n🔌 Conectando a Supabase y creando fixture de prueba…\n");

const email = `smoketest_${Date.now()}@idiomaconnect.test`;
const { data: u, error: ue } = await sb.auth.admin.createUser({
  email, password: "Test123456!", email_confirm: true,
});
check("crear usuario de prueba (auth.admin)", !ue && !!u?.user, ue?.message ?? "");
if (ue || !u?.user) { console.log(`\n${pass} OK / ${fail} fallos`); process.exit(1); }
const userId = u.user.id;

try {
  // El trigger handle_new_user debe haber creado la familia.
  let family = null;
  for (let i = 0; i < 5 && !family; i++) {
    const { data } = await sb.from("families").select("id").eq("owner_user_id", userId).single();
    family = data;
    if (!family) await new Promise((r) => setTimeout(r, 300));
  }
  check("el trigger creó la familia automáticamente", !!family);
  const familyId = family?.id;

  // --- Crear kid de prueba ---
  const { data: kid, error: ke } = await sb
    .from("kid_profiles")
    .insert({ family_id: familyId, name: "TestKid", emoji: "🚀" })
    .select().single();
  check("crear perfil de niño", !ke && !!kid, ke?.message ?? "");
  const kidId = kid?.id;

  // === CAMBIO 1: relación "amigo" ===
  const { error: meAmigo } = await sb.from("family_members").insert({ family_id: familyId, relation: "amigo", name: "Pedro" });
  check("Cambio 1 — insertar familiar con relación 'amigo'", !meAmigo, meAmigo?.message ?? "");
  const { error: meOtro } = await sb.from("family_members").insert({ family_id: familyId, relation: "otro", name: "Vecino" });
  check("Cambio 1 — insertar familiar con relación 'otro'", !meOtro, meOtro?.message ?? "");
  const { error: meMascota } = await sb.from("family_members").insert({ family_id: familyId, relation: "mascota", name: "Firulais" });
  check("Cambio 1 — insertar mascota", !meMascota, meMascota?.message ?? "");

  // === CAMBIO 3a: diagnóstico fija el nivel ===
  const xpB1 = placementXp(0, "B1");
  await sb.from("kid_profiles").update({ total_xp: xpB1, cefr_level: codeFor(xpB1) }).eq("id", kidId);
  const { data: k2 } = await sb.from("kid_profiles").select("total_xp, cefr_level").eq("id", kidId).single();
  check("Cambio 3 — diagnóstico B1 sube el XP y fija nivel B1", k2?.cefr_level === "B1" && k2?.total_xp === 400, `→ ${k2?.cefr_level}/${k2?.total_xp}`);

  // === CAMBIO 3b: el piso NO baja a un alumno avanzado ===
  await sb.from("kid_profiles").update({ total_xp: 1750, cefr_level: "C1" }).eq("id", kidId);
  const xpFloor = placementXp(1750, "A2"); // sugiere A2 pero ya está en C1
  await sb.from("kid_profiles").update({ total_xp: xpFloor, cefr_level: codeFor(xpFloor) }).eq("id", kidId);
  const { data: k3 } = await sb.from("kid_profiles").select("total_xp, cefr_level").eq("id", kidId).single();
  check("Cambio 3 — piso: sugerir A2 NO baja a un alumno C1", k3?.cefr_level === "C1" && k3?.total_xp === 1750, `→ ${k3?.cefr_level}/${k3?.total_xp}`);

  // === CAMBIO 2: la query del dashboard de padres trae cefr_level ===
  const { data: sum, error: se } = await sb
    .from("kid_profiles")
    .select("id, name, emoji, color_hex, total_xp, cefr_level, hobbies")
    .eq("id", kidId).single();
  check("Cambio 2 — query del dashboard de padres devuelve cefr_level", !se && sum?.cefr_level != null, se?.message ?? "");
} catch (e) {
  fail++;
  console.log(`  ✗ EXCEPCIÓN: ${e?.message ?? e}`);
} finally {
  const { error: de } = await sb.auth.admin.deleteUser(userId);
  check("limpieza — borrar usuario de prueba (cascada a familia/kid/miembros)", !de, de?.message ?? "");
}

console.log(`\n${"─".repeat(40)}\n  RESULTADO: ${pass} OK / ${fail} fallos\n`);
process.exit(fail ? 1 : 0);
