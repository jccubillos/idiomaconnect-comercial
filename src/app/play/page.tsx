import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";
import { BottomNav } from "@/components/ui/BottomNav";
import { UNLOCKED_MODES } from "@/lib/content/modes";
import { getUniversalWorld, buildPersonalWorld } from "@/lib/content/worlds";

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
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">{world.emoji}</div>
          <h1 className="text-2xl font-extrabold mb-1">{world.name}</h1>
          <p className="text-sm text-ink-dim">{world.tagline}</p>
        </div>

        <div className="text-xs font-bold uppercase tracking-widest text-ink-dim mb-3 text-center">
          ¿Cómo quieres practicar hoy?
        </div>

        <div className="grid grid-cols-2 gap-3">
          {UNLOCKED_MODES.map((mode) => {
            const href = `/${routeFor(mode.key)}?kid=${kid.id}&world=${worldKey}`;
            return (
              <Link key={mode.key} href={href}>
                <GlassCard className="p-4 h-full hover:scale-[1.02] transition-transform border border-white/10 hover:border-neon-cyan/40">
                  <div className="text-3xl mb-2">{mode.emoji}</div>
                  <h3 className="font-bold text-sm mb-1">{mode.name}</h3>
                  <p className="text-xs text-ink-dim">{mode.short}</p>
                </GlassCard>
              </Link>
            );
          })}
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
