import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 20;

const MAX_BYTES = 2 * 1024 * 1024;        // 2 MB
const ALLOWED = ["image/png", "image/jpeg", "image/webp"];

/**
 * Accepts a kid avatar image, uploads to the `avatars` bucket in Supabase Storage,
 * and updates kid_profiles.avatar_url.
 *
 * Bucket setup (run once in dashboard):
 *   - name: avatars
 *   - public: true
 *   - file size limit: 2 MB
 *   - allowed mime types: image/png, image/jpeg, image/webp
 */
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const kidId = form.get("kidId");
  if (!(file instanceof Blob) || typeof kidId !== "string") {
    return NextResponse.json({ error: "Missing file or kidId" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `Imagen máx ${MAX_BYTES / 1024 / 1024} MB` }, { status: 413 });
  }
  const type = (file as File).type || "image/png";
  if (!ALLOWED.includes(type)) {
    return NextResponse.json({ error: "Formato no permitido (usa PNG/JPG/WebP)" }, { status: 415 });
  }

  // Verify ownership before uploading
  const { data: kid } = await supabase
    .from("kid_profiles")
    .select("id, family_id, name")
    .eq("id", kidId)
    .single();
  if (!kid) return NextResponse.json({ error: "Kid not found" }, { status: 404 });

  const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  const path = `${kid.family_id}/${kid.id}-${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadErr } = await supabase.storage
    .from("avatars")
    .upload(path, bytes, { contentType: type, upsert: true });
  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = pub.publicUrl;

  await supabase.from("kid_profiles").update({ avatar_url: avatarUrl }).eq("id", kid.id);

  return NextResponse.json({ avatarUrl });
}
