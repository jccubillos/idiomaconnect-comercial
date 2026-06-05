"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

const EMOJI_OPTIONS = ["🎨", "🎹", "🤸", "✈️", "🎮", "🎻", "⚽", "🦄", "🚀", "🐉", "🎤", "📚"];
const COLOR_OPTIONS = [
  { hex: "#FF4B4B" }, { hex: "#00EEFC" }, { hex: "#C464FF" },
  { hex: "#39FF14" }, { hex: "#FFD400" }, { hex: "#FF66C4" },
];

export default function AddKidPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [grade, setGrade] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [emoji, setEmoji] = useState("🎨");
  const [color, setColor] = useState("#00EEFC");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Sesión expirada"); setLoading(false); return; }
    const { data: family } = await supabase
      .from("families").select("id").eq("owner_user_id", user.id).single();
    if (!family) { setError("Familia no encontrada"); setLoading(false); return; }

    const { count } = await supabase
      .from("kid_profiles")
      .select("id", { count: "exact", head: true })
      .eq("family_id", family.id)
      .is("archived_at", null);
    if ((count ?? 0) >= 6) {
      setError("Tu plan permite hasta 6 perfiles.");
      setLoading(false);
      return;
    }

    const { data: newKid, error: e1 } = await supabase
      .from("kid_profiles")
      .insert({
        family_id: family.id,
        name: name.trim(),
        birth_date: birthDate || null,
        grade: grade.trim() || null,
        hobbies: hobbies.trim() || null,
        emoji, color_hex: color,
      })
      .select()
      .single();
    setLoading(false);
    if (e1 || !newKid) { setError(e1?.message ?? "No pude crear"); return; }
    // Diagnóstico inicial también para cada nuevo kid (personaliza desde el día uno).
    router.push(`/exam?kid=${newKid.id}&onboarding=1`);
    router.refresh();
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-12 relative z-10">
      <GlassCard strong className="w-full max-w-md p-8">
        <h1 className="text-2xl font-extrabold mb-1">Agregar perfil</h1>
        <p className="text-sm text-ink-dim mb-6">Crea un nuevo perfil para tu familia.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="w-full px-3 py-2.5 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-cyan focus:outline-none" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" className="w-full px-3 py-2.5 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-cyan focus:outline-none" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            <input className="w-full px-3 py-2.5 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-cyan focus:outline-none" placeholder="Curso (opc)" value={grade} onChange={(e) => setGrade(e.target.value)} />
          </div>
          <input className="w-full px-3 py-2.5 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-cyan focus:outline-none" placeholder="Hobbies" value={hobbies} onChange={(e) => setHobbies(e.target.value)} />

          <div>
            <div className="text-xs uppercase tracking-wide text-ink-dim mb-1.5">Avatar</div>
            <div className="grid grid-cols-6 gap-1.5">
              {EMOJI_OPTIONS.map((e) => (
                <button key={e} type="button" onClick={() => setEmoji(e)} className={`aspect-square rounded-lg text-2xl flex items-center justify-center ${emoji === e ? "bg-neon-cyan/15 border-2 border-neon-cyan" : "bg-surface-mid border-2 border-transparent"}`}>{e}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-ink-dim mb-1.5">Color</div>
            <div className="grid grid-cols-6 gap-1.5">
              {COLOR_OPTIONS.map((c) => (
                <button key={c.hex} type="button" onClick={() => setColor(c.hex)} className={`h-8 rounded-lg transition-all ${color === c.hex ? "ring-2 ring-offset-2 ring-offset-surface-mid ring-white" : ""}`} style={{ background: c.hex }} />
              ))}
            </div>
          </div>

          {error && <div className="text-sm text-neon-red bg-neon-red/10 rounded-lg p-3">{error}</div>}

          <div className="flex gap-2">
            <Link href="/profiles" className="flex-1">
              <NeonButton variant="ghost-cyan" className="w-full" type="button">Cancelar</NeonButton>
            </Link>
            <NeonButton type="submit" loading={loading} className="flex-1">Crear</NeonButton>
          </div>
        </form>
      </GlassCard>
    </main>
  );
}
