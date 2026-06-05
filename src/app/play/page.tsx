import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";
import { BottomNav } from "@/components/ui/BottomNav";
import { UNLOCKED_MODES, MODES, type LessonMode, type ModeMeta } from "@/lib/content/modes";
import { getUniversalWorld, buildPersonalWorld } from "@/lib/content/worlds";
import { RECOMMENDED_MODES, WORLD_FOCUS_LABEL } from "@/lib/content/world-tracks";

interface PageProps {
  searchParams: { kid?: string; world?: string };
}

/**
 * Mode hub for a world. Worlds card → here → user picks a modality.
 */
export default async function PlayPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const kidId = searchParams.kid;
  const worldKey = searchParams.world ?? "vocab";
  if (!kidId) redirect("/profiles");

  const { data: kid } = await supabase
    .from("kid_profiles")
    .select("id, name, emoji, avatar_url, color_hex, hobbies")
    .eq("id", kidId).single();
  if (!kid) redirect("/profiles");

  const world =
    worldKey === "personal"
      ? buildPersonalWorld({ kidName: kid.name, hobbies: kid.hobbies, color: kid.color_hex, emoji: kid.emoji })
      : getUniversalWorld(worldKey) ?? getUniversalWorld("vocab")!;

  // Modos destacados de este mundo (van primero) + el resto.
  const recommended = (RECOMMENDED_MODES[worldKey] ?? []) as LessonMode[];
  const featured = recommended.map((k) => MODES[k]).filter((m) => m && m.unlocked);
  const featuredKeys = new Set(featured.map((m) => m.key));
  const rest = UNLOCKED_MODES.filter((m) => !featuredKeys.has(m.key));

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass-strong px-5 py-3 flex justify-between items-center">
        <Link href={`/worlds?kid=${kid.id}`} className="text-sm font-bold text-neon-cyan">
          ← Worlds
        </Link>
        <div className="flex items-center gap-2">
          <Avatar src={kid.avatar_url} emoji={kid.emoji} name={kid.name} ringColor={kid.color_hex} size="sm" />
          <span className="text-sm font-bold">{kid.name}</span>
        </div>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-2xl mx-auto relative z-10">
        {/* Hero TEMÁTICO del mundo (color + enfoque) — hace que cada mundo se sienta distinto */}
        <div
          className="text-center mb-6 rounded-2xl p-5 border"
          style={{
            borderColor: `${world.accent}66`,
            background: `radial-gradient(ellipse at 50% 0%, ${world.accent}1f 0%, transparent 70%)`,
          }}
        >
          <div className="text-5xl mb-2">{world.emoji}</div>
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: world.accent }}>
            {world.name}
          </h1>
          <p className="text-sm text-ink-dim mb-3">{world.tagline}</p>
          {WORLD_FOCUS_LABEL[worldKey] && (
            <span
              className="inline-block text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: `${world.accent}22`, color: world.accent, border: `1px solid ${world.accent}55` }}
            >
              🎯 {WORLD_FOCUS_LABEL[worldKey]}
            </span>
          )}
        </div>

        {/* Modos DESTACADOS para este mundo */}
        {featured.length > 0 && (
          <>
            <div className="text-xs font-bold uppercase tracking-widest text-ink-dim mb-3">
              ⭐ Recomendado en {world.name}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {featured.map((mode) => (
                <ModeCard key={mode.key} mode={mode} kidId={kid.id} worldKey={worldKey} accent={world.accent} featured />
              ))}
            </div>
          </>
        )}

        {/* Resto de los modos */}
        <div className="text-xs font-bold uppercase tracking-widest text-ink-dim mb-3">
          {featured.length > 0 ? "Otros modos" : "¿Cómo quieres practicar hoy?"}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {rest.map((mode) => (
            <ModeCard key={mode.key} mode={mode} kidId={kid.id} worldKey={worldKey} accent={world.accent} />
          ))}
        </div>
      </main>
      <BottomNav />
    </>
  );
}

function routeFor(modeKey: string): string {
  switch (modeKey) {
    case "lesson": return "lesson";
    case "battle": return "battle";
    case "pronunciation": return "pronunciation";
    case "flashcards": return "flashcards";
    case "srs_review": return "srs";
    case "conversation": return "conversation";
    case "sentence_builder": return "sentence-builder";
    case "story_fill": return "story-fill";
    case "speaking_journal": return "speaking-journal";
    case "exam": return "exam";
    case "shadow_speaking": return "shadow-speaking";
    case "translate_inverse": return "translate-inverse";
    case "describe_scene": return "describe-scene";
    case "minimal_pairs": return "minimal-pairs";
    case "listen_id": return "listen-id";
    case "memory_match": return "memory-match";
    default: return "lesson";
  }
}

function ModeCard({
  mode,
  kidId,
  worldKey,
  accent,
  featured = false,
}: {
  mode: ModeMeta;
  kidId: string;
  worldKey: string;
  accent: string;
  featured?: boolean;
}) {
  const href = `/${routeFor(mode.key)}?kid=${kidId}&world=${worldKey}`;
  return (
    <Link href={href}>
      <GlassCard
        className="p-4 h-full hover:scale-[1.02] transition-transform border"
        style={
          featured
            ? { borderColor: `${accent}80`, background: `${accent}0f` }
            : { borderColor: "rgba(255,255,255,0.10)" }
        }
      >
        <div className="text-3xl mb-2">{mode.emoji}</div>
        <h3 className="font-bold text-sm mb-1">{mode.name}</h3>
        <p className="text-xs text-ink-dim">{mode.short}</p>
      </GlassCard>
    </Link>
  );
}
