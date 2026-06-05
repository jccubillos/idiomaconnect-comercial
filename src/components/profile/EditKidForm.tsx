"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { Avatar } from "@/components/ui/Avatar";

const EMOJI_OPTIONS = ["🎨", "🎹", "🤸", "✈️", "🎮", "🎻", "⚽", "🦄", "🚀", "🐉", "🎤", "📚"];
const COLOR_OPTIONS = ["#FF4B4B", "#00EEFC", "#C464FF", "#39FF14", "#FFD400", "#FF66C4"];

interface KidEditable {
  id: string;
  name: string;
  emoji: string;
  color_hex: string;
  hobbies: string | null;
  grade: string | null;
  birth_date: string | null;
  tone: string | null;
  avatar_url?: string | null;
}

export function EditKidForm({ kid }: { kid: KidEditable }) {
  const router = useRouter();
  const [draft, setDraft] = useState({
    name: kid.name,
    emoji: kid.emoji,
    color_hex: kid.color_hex,
    hobbies: kid.hobbies ?? "",
    grade: kid.grade ?? "",
    birth_date: kid.birth_date ?? "",
    tone: kid.tone ?? "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(kid.avatar_url ?? null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kidId", kid.id);
      const res = await fetch("/api/avatar/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falló subida");
      setAvatarUrl(data.avatarUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("kid_profiles")
      .update({
        name: draft.name.trim(),
        emoji: draft.emoji,
        color_hex: draft.color_hex,
        hobbies: draft.hobbies.trim() || null,
        grade: draft.grade.trim() || null,
        birth_date: draft.birth_date || null,
        tone: draft.tone.trim() || null,
      })
      .eq("id", kid.id);
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push(`/profile/${kid.id}`);
    router.refresh();
  }

  async function archive() {
    if (!confirm(`¿Archivar perfil de ${kid.name}? Podrás restaurarlo después.`)) return;
    setDeleting(true);
    const supabase = createClient();
    await supabase
      .from("kid_profiles")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", kid.id);
    router.push("/profiles");
    router.refresh();
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-12 relative z-10">
      <GlassCard strong className="w-full max-w-md p-8">
        <h1 className="text-2xl font-extrabold mb-6">Editar {kid.name}</h1>

        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
          <Avatar src={avatarUrl} emoji={draft.emoji} name={draft.name} ringColor={draft.color_hex} size="lg" />
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <NeonButton
              type="button"
              variant="ghost-cyan"
              size="sm"
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="!normal-case"
            >
              📷 {avatarUrl ? "Cambiar foto" : "Subir foto"}
            </NeonButton>
            <p className="text-xs text-ink-dim mt-2">PNG/JPG/WebP · máx 2 MB</p>
          </div>
        </div>

        <div className="space-y-4">
          <Input label="Nombre" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
          <Input label="Hobbies" value={draft.hobbies} onChange={(v) => setDraft({ ...draft, hobbies: v })} />
          <Input label="Curso" value={draft.grade} onChange={(v) => setDraft({ ...draft, grade: v })} />
          <Input label="Fecha de nacimiento" type="date" value={draft.birth_date} onChange={(v) => setDraft({ ...draft, birth_date: v })} />
          <Input label="Tono del tutor (opcional)" value={draft.tone} onChange={(v) => setDraft({ ...draft, tone: v })} placeholder="cálido y motivador" />

          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-ink-dim mb-1.5">Avatar</div>
            <div className="grid grid-cols-6 gap-1.5">
              {EMOJI_OPTIONS.map((e) => (
                <button key={e} type="button" onClick={() => setDraft({ ...draft, emoji: e })} className={`aspect-square rounded-lg text-2xl flex items-center justify-center ${draft.emoji === e ? "bg-neon-cyan/15 border-2 border-neon-cyan" : "bg-surface-mid border-2 border-transparent"}`}>{e}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-ink-dim mb-1.5">Color</div>
            <div className="grid grid-cols-6 gap-1.5">
              {COLOR_OPTIONS.map((c) => (
                <button key={c} type="button" onClick={() => setDraft({ ...draft, color_hex: c })} className={`h-8 rounded-lg ${draft.color_hex === c ? "ring-2 ring-offset-2 ring-offset-surface-mid ring-white" : ""}`} style={{ background: c }} />
              ))}
            </div>
          </div>

          {error && <div className="text-sm text-neon-red">{error}</div>}

          <div className="flex gap-2">
            <Link href={`/profile/${kid.id}`} className="flex-1">
              <NeonButton variant="ghost-cyan" className="w-full" type="button">Cancelar</NeonButton>
            </Link>
            <NeonButton onClick={save} loading={loading} className="flex-1">Guardar</NeonButton>
          </div>

          <button
            onClick={archive}
            disabled={deleting}
            className="mt-6 w-full text-sm text-neon-red hover:underline disabled:opacity-50"
          >
            Archivar este perfil
          </button>
        </div>
      </GlassCard>
    </main>
  );
}

function Input({ label, value, onChange, type = "text", placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wide text-ink-dim block mb-1.5">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-cyan focus:outline-none"
      />
    </label>
  );
}
