"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

const EMOJI_OPTIONS = ["🎨", "🎹", "🤸", "✈️", "🎮", "🎻", "⚽", "🦄", "🚀", "🐉", "🎤", "📚"];
const COLOR_OPTIONS = [
  { hex: "#FF4B4B", name: "Coral" },
  { hex: "#00EEFC", name: "Cyan" },
  { hex: "#C464FF", name: "Violeta" },
  { hex: "#39FF14", name: "Verde neón" },
  { hex: "#FFD400", name: "Amarillo" },
  { hex: "#FF66C4", name: "Rosa" },
];

type Step = 1 | 2 | 3 | 4;

interface KidDraft {
  name: string;
  birthDate: string;
  emoji: string;
  colorHex: string;
  hobbies: string;
  grade: string;
}

interface MemberDraft {
  relation: string;
  name: string;
  age: string;
  notes: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [kid, setKid] = useState<KidDraft>({
    name: "",
    birthDate: "",
    emoji: "🎨",
    colorHex: "#00EEFC",
    hobbies: "",
    grade: "",
  });

  const [members, setMembers] = useState<MemberDraft[]>([
    { relation: "padre", name: "", age: "", notes: "" },
    { relation: "madre", name: "", age: "", notes: "" },
  ]);

  function addMember() {
    setMembers((m) => [...m, { relation: "hermano", name: "", age: "", notes: "" }]);
  }

  function updateMember(i: number, patch: Partial<MemberDraft>) {
    setMembers((m) => m.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  function removeMember(i: number) {
    setMembers((m) => m.filter((_, idx) => idx !== i));
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Sesión expirada. Vuelve a entrar.");
      setLoading(false);
      return;
    }

    const { data: family } = await supabase
      .from("families")
      .select("id")
      .eq("owner_user_id", user.id)
      .single();
    if (!family) {
      setError("No se encontró tu familia. Contacta soporte.");
      setLoading(false);
      return;
    }

    // 1. Insert kid
    const { data: newKid, error: kidErr } = await supabase
      .from("kid_profiles")
      .insert({
        family_id: family.id,
        name: kid.name.trim(),
        birth_date: kid.birthDate || null,
        emoji: kid.emoji,
        color_hex: kid.colorHex,
        hobbies: kid.hobbies.trim() || null,
        grade: kid.grade.trim() || null,
        tone: null,
      })
      .select()
      .single();
    if (kidErr || !newKid) {
      setError(kidErr?.message ?? "No pude crear el perfil.");
      setLoading(false);
      return;
    }

    // 2. Insert family members (skip empty rows)
    const filtered = members.filter((m) => m.name.trim());
    if (filtered.length) {
      await supabase.from("family_members").insert(
        filtered.map((m) => ({
          family_id: family.id,
          relation: m.relation,
          name: m.name.trim(),
          age: m.age ? parseInt(m.age, 10) || null : null,
          notes: m.notes.trim() || null,
        })),
      );
    }

    // 3. Mark consent timestamps
    await supabase
      .from("families")
      .update({
        parental_consent_at: new Date().toISOString(),
        privacy_accepted_at: new Date().toISOString(),
        tos_accepted_at: new Date().toISOString(),
      })
      .eq("id", family.id);

    setLoading(false);
    // Arrancamos con el diagnóstico para personalizar las lecciones desde el día uno.
    router.push(`/exam?kid=${newKid.id}&onboarding=1`);
    router.refresh();
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-12 relative z-10">
      <GlassCard strong className="w-full max-w-2xl p-8">
        {/* Stepper */}
        <div className="flex items-center gap-2 mb-6">
          {([1, 2, 3, 4] as const).map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                s <= step ? "bg-neon-cyan shadow-neon-cyan" : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <div className="text-xs font-bold uppercase tracking-widest text-ink-dim mb-2">
          Paso {step} de 4
        </div>

        {step === 1 && (
          <>
            <h2 className="text-2xl font-extrabold mb-1">Cuéntame de tu hijo/a</h2>
            <p className="text-sm text-ink-dim mb-6">
              Este es el perfil del primer niño/a. Podrás agregar más después.
            </p>
            <div className="space-y-4">
              <Field label="Nombre">
                <input
                  type="text"
                  value={kid.name}
                  onChange={(e) => setKid({ ...kid, name: e.target.value })}
                  className="input"
                  placeholder="Antonia"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha de nacimiento">
                  <input
                    type="date"
                    value={kid.birthDate}
                    onChange={(e) => setKid({ ...kid, birthDate: e.target.value })}
                    className="input"
                  />
                </Field>
                <Field label="Curso (opcional)">
                  <input
                    type="text"
                    value={kid.grade}
                    onChange={(e) => setKid({ ...kid, grade: e.target.value })}
                    className="input"
                    placeholder="8vo básico"
                  />
                </Field>
              </div>
              <Field label="Hobbies / pasiones (clave para personalizar)">
                <input
                  type="text"
                  value={kid.hobbies}
                  onChange={(e) => setKid({ ...kid, hobbies: e.target.value })}
                  className="input"
                  placeholder="Tenis, pintura, K-pop"
                />
              </Field>
            </div>
            <Nav onNext={() => kid.name && setStep(2)} canNext={!!kid.name} />
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-2xl font-extrabold mb-1">Su look en la app</h2>
            <p className="text-sm text-ink-dim mb-6">Avatar y color del perfil.</p>

            <div className="mb-5">
              <div className="text-xs font-bold uppercase tracking-wide text-ink-dim mb-2">Avatar</div>
              <div className="grid grid-cols-6 gap-2">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setKid({ ...kid, emoji: e })}
                    className={`aspect-square rounded-xl text-3xl flex items-center justify-center transition-all ${
                      kid.emoji === e
                        ? "bg-neon-cyan/15 border-2 border-neon-cyan shadow-neon-cyan"
                        : "bg-surface-mid border-2 border-transparent hover:border-white/20"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-ink-dim mb-2">Color</div>
              <div className="grid grid-cols-3 gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setKid({ ...kid, colorHex: c.hex })}
                    className={`py-3 rounded-xl text-sm font-bold transition-all ${
                      kid.colorHex === c.hex ? "ring-2 ring-offset-2 ring-offset-surface-mid" : ""
                    }`}
                    style={{ background: c.hex, color: "#10141788" }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <Nav onBack={() => setStep(1)} onNext={() => setStep(3)} canNext />
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-2xl font-extrabold mb-1">Su familia y mascotas</h2>
            <p className="text-sm text-ink-dim mb-6">
              Esto hace que las lecciones mencionen a personas reales. Podrás editarlo después.
            </p>
            <div className="space-y-3 mb-4 max-h-[40vh] overflow-y-auto pr-2 scrollbar-hide">
              {members.map((m, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <select
                    value={m.relation}
                    onChange={(e) => updateMember(i, { relation: e.target.value })}
                    className="input col-span-3"
                  >
                    <option value="padre">Padre</option>
                    <option value="madre">Madre</option>
                    <option value="hermano">Hermano/a</option>
                    <option value="abuelo">Abuelo/a</option>
                    <option value="tio">Tío/a</option>
                    <option value="primo">Primo/a</option>
                    <option value="amigo">Amigo/a</option>
                    <option value="mascota">Mascota</option>
                    <option value="otro">Otro/a</option>
                  </select>
                  <input
                    placeholder="Nombre"
                    value={m.name}
                    onChange={(e) => updateMember(i, { name: e.target.value })}
                    className="input col-span-4"
                  />
                  <input
                    placeholder="Edad"
                    type="number"
                    value={m.age}
                    onChange={(e) => updateMember(i, { age: e.target.value })}
                    className="input col-span-2"
                  />
                  <input
                    placeholder="Notas (opc)"
                    value={m.notes}
                    onChange={(e) => updateMember(i, { notes: e.target.value })}
                    className="input col-span-2"
                  />
                  <button
                    onClick={() => removeMember(i)}
                    className="col-span-1 text-ink-dim hover:text-neon-red"
                    aria-label="Eliminar"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addMember} className="text-sm text-neon-cyan font-bold hover:underline mb-4">
              + Agregar otro miembro
            </button>
            <Nav onBack={() => setStep(2)} onNext={() => setStep(4)} canNext />
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-2xl font-extrabold mb-1">Revisa y confirma</h2>
            <p className="text-sm text-ink-dim mb-6">
              Esto se guarda en tu cuenta. Solo tú y tu familia pueden verlo.
            </p>
            <div className="space-y-3 mb-6">
              <Summary label="Nombre" value={kid.name} />
              <Summary label="Fecha nacimiento" value={kid.birthDate || "(no especificada)"} />
              <Summary label="Hobbies" value={kid.hobbies || "(no especificados)"} />
              <Summary
                label="Familia"
                value={members.filter((m) => m.name).map((m) => `${m.relation}: ${m.name}`).join(", ") || "(ninguno)"}
              />
            </div>

            {error && (
              <div className="text-sm text-neon-red bg-neon-red/10 border border-neon-red/30 rounded-lg p-3 mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <NeonButton variant="ghost-cyan" onClick={() => setStep(3)}>Atrás</NeonButton>
              <NeonButton variant="primary" loading={loading} onClick={handleSubmit} className="flex-1">
                Crear perfil y empezar
              </NeonButton>
            </div>
          </>
        )}
      </GlassCard>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          padding: 0.625rem 0.75rem;
          border-radius: 0.75rem;
          background: var(--surface-mid);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--on-surface);
          font-size: 0.875rem;
        }
        :global(.input:focus) {
          outline: none;
          border-color: var(--secondary);
        }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wide text-ink-dim block mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-ink-dim">{label}</span>
      <span className="font-bold text-right">{value}</span>
    </div>
  );
}

function Nav({
  onBack,
  onNext,
  canNext,
}: {
  onBack?: () => void;
  onNext: () => void;
  canNext: boolean;
}) {
  return (
    <div className="mt-6 flex gap-3">
      {onBack && (
        <NeonButton variant="ghost-cyan" onClick={onBack}>
          Atrás
        </NeonButton>
      )}
      <NeonButton variant="primary" onClick={onNext} disabled={!canNext} className="flex-1">
        Continuar
      </NeonButton>
    </div>
  );
}
